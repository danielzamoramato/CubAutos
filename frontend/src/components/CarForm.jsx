import { useState, useEffect } from 'react'
import { getBrands, getProvinces, getMunicipalities, createCar, updateCar, uploadImages, deleteImage, setCover, createBrand } from '../lib/api'

const KM_TO_MI = 0.621371

export default function CarForm({ token, car, onSaved }) {
  const isEdit = !!car

  const [brands, setBrands] = useState([])
  const [provinces, setProvinces] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [images, setImages] = useState(car?.images || [])
  const [newFiles, setNewFiles] = useState([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showNewBrand, setShowNewBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [addingBrand, setAddingBrand] = useState(false)

  const [kmUnit, setKmUnit] = useState('km') // 'km' | 'mi'

  const [form, setForm] = useState({
    brand_id: car?.brand_id || '',
    model: car?.model || '',
    year: car?.year || '',
    price: car?.price || '',
    is_used: car?.is_used ?? true,
    km: car?.km ?? '',
    is_electric: car?.is_electric ?? false,
    description: car?.description || '',
    province_id: car?.province_id || '',
    municipality_id: car?.municipality_id || '',
    owner_name: car?.owner_name || '',
    owner_phone: car?.owner_phone || '',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    getBrands().then(r => setBrands(r.data))
    getProvinces().then(r => setProvinces(r.data))
  }, [])

  useEffect(() => {
    if (form.province_id) {
      getMunicipalities(form.province_id).then(r => setMunicipalities(r.data))
    } else {
      setMunicipalities([])
      set('municipality_id', '')
    }
  }, [form.province_id])

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return
    setAddingBrand(true)
    try {
      const { data } = await createBrand(newBrandName.trim(), token)
      setBrands(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      set('brand_id', data.id)
      setNewBrandName('')
      setShowNewBrand(false)
    } catch {
      setError('Error al agregar la marca')
    } finally {
      setAddingBrand(false)
    }
  }

  const handleDeleteImage = async (imgId) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    await deleteImage(imgId, token)
    setImages(prev => prev.filter(i => i.id !== imgId))
  }

  const handleSetCover = async (imgId) => {
    await setCover(imgId, car.id, token)
    setImages(prev => prev.map(i => ({ ...i, is_cover: i.id === imgId })))
  }

  // Muestra el km guardado (siempre en km) convertido a la unidad elegida
  const displayKm = form.km === '' ? '' : (kmUnit === 'mi' ? Math.round(form.km * KM_TO_MI) : form.km)

  const handleKmChange = (value) => {
    if (value === '') return set('km', '')
    const num = Number(value)
    // Convierte siempre de vuelta a km para guardar consistente en la DB
    const inKm = kmUnit === 'mi' ? Math.round(num / KM_TO_MI) : num
    set('km', inKm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.brand_id) return setError('Selecciona una marca')
    if (!form.model.trim()) return setError('El modelo es obligatorio')
    if (!form.price || Number(form.price) <= 0) return setError('El precio debe ser mayor a 0')
    if (!form.province_id) return setError('Selecciona una provincia')
    if (!form.owner_phone.trim()) return setError('El teléfono de contacto es obligatorio')
    if (!isEdit && newFiles.length === 0) return setError('Agrega al menos una foto del vehículo')

    setSaving(true)
    try {
      let carId = car?.id
      const payload = {
        ...form,
        price: Number(form.price),
        is_used: form.is_used === 'true' || form.is_used === true,
        km: (form.is_used === true || form.is_used === 'true') && form.km !== ''
          ? Number(form.km)
          : null,
        municipality_id: form.municipality_id || null,
        is_electric: form.is_electric,
        is_active: true,
      }
      if (isEdit) {
        await updateCar(carId, payload, token)
      } else {
        const { data } = await createCar(payload, token)
        carId = data.id
      }
      if (newFiles.length > 0) {
        await uploadImages(carId, newFiles, coverIndex, token)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = `w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white
    focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all`
  const labelClass = `text-xs text-slate-500 mb-1.5 block font-medium`

  const isUsed = form.is_used === true || form.is_used === 'true'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 space-y-8">

      <div>
        <h2 className="text-xl font-bold text-slate-800">
          {isEdit ? 'Editar vehículo' : 'Publicar nuevo vehículo'}
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Completa la información para {isEdit ? 'actualizar' : 'publicar'} el anuncio
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Datos del vehículo */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
          <h3 className="text-sm font-semibold text-slate-700">Datos del vehículo</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
          <div>
            <label className={labelClass}>Marca *</label>
            <div className="flex gap-2">
              <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)}
                required className={inputClass}>
                <option value="">Seleccionar...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewBrand(s => !s)}
                className="shrink-0 px-3 rounded-lg border border-slate-200 text-slate-500 text-sm
                           hover:border-amber-400 hover:text-amber-600 transition-colors">
                +
              </button>
            </div>
            {showNewBrand && (
              <div className="flex gap-2 mt-2">
                <input value={newBrandName} onChange={e => setNewBrandName(e.target.value)}
                  placeholder="Nombre de la marca nueva" className={inputClass} />
                <button type="button" onClick={handleAddBrand} disabled={addingBrand}
                  className="shrink-0 bg-slate-700 text-white px-4 rounded-lg text-sm font-medium
                             hover:bg-slate-600 transition-colors disabled:opacity-50">
                  {addingBrand ? '...' : 'Agregar'}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Modelo *</label>
            <input value={form.model} onChange={e => set('model', e.target.value)}
              required placeholder="Ej: Corolla" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Año</label>
            <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
              placeholder="Ej: 2018" min="1900" max="2026" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Precio (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                required placeholder="12000" min="0" className={`${inputClass} pl-7`} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Estado *</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set('is_used', true)}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors
                  ${isUsed ? 'bg-amber-400 border-amber-400 text-slate-900' : 'border-slate-200 text-slate-500'}`}>
                Usado
              </button>
              <button type="button" onClick={() => set('is_used', false)}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors
                  ${!isUsed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-500'}`}>
                Nuevo
              </button>
            </div>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_electric}
                onChange={e => set('is_electric', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-teal-500 focus:ring-teal-400"
              />
              <span className="text-sm text-slate-600">⚡ Es un vehículo eléctrico</span>
            </label>
          </div>

          {isUsed && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Kilometraje recorrido</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={displayKm}
                  onChange={e => handleKmChange(e.target.value)}
                  placeholder={kmUnit === 'mi' ? 'Ej: 53000' : 'Ej: 85000'}
                  min="0"
                  className={inputClass}
                />
                <div className="flex shrink-0 rounded-lg border border-slate-200 overflow-hidden">
                  <button type="button" onClick={() => setKmUnit('km')}
                    className={`px-3 py-2 text-sm font-medium transition-colors
                      ${kmUnit === 'km' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500'}`}>
                    km
                  </button>
                  <button type="button" onClick={() => setKmUnit('mi')}
                    className={`px-3 py-2 text-sm font-medium transition-colors
                      ${kmUnit === 'mi' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500'}`}>
                    mi
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Se guarda internamente en kilómetros, sin importar la unidad que elijas aquí
              </p>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className={labelClass}>Descripción</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} placeholder="Describe el estado, extras, historial..."
              className={inputClass} />
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
          <h3 className="text-sm font-semibold text-slate-700">Ubicación</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
          <div>
            <label className={labelClass}>Provincia *</label>
            <select value={form.province_id} onChange={e => set('province_id', e.target.value)}
              required className={inputClass}>
              <option value="">Seleccionar...</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Municipio</label>
            <select value={form.municipality_id} onChange={e => set('municipality_id', e.target.value)}
              disabled={!municipalities.length}
              className={`${inputClass} ${!municipalities.length ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <option value="">{municipalities.length ? 'Seleccionar...' : 'Selecciona provincia primero'}</option>
              {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
          <h3 className="text-sm font-semibold text-slate-700">Contacto</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
          <div>
            <label className={labelClass}>Nombre</label>
            <input value={form.owner_name} onChange={e => set('owner_name', e.target.value)}
              placeholder="Nombre completo" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono *</label>
            <input value={form.owner_phone} onChange={e => set('owner_phone', e.target.value)}
              placeholder="+53 5 xxx xxxx" className={inputClass} />
          </div>
        </div>
      </section>

      {/* Fotos existentes */}
      {isEdit && images.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">4</div>
            <h3 className="text-sm font-semibold text-slate-700">Fotos actuales</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pl-8">
            {images.map(img => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden h-24 sm:h-28">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                                transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                  <button type="button" onClick={() => handleSetCover(img.id)}
                    className="text-white text-xs bg-amber-500 px-2 py-1 rounded w-full text-center">
                    {img.is_cover ? '★ Portada' : 'Portada'}
                  </button>
                  <button type="button" onClick={() => handleDeleteImage(img.id)}
                    className="text-white text-xs bg-red-500 px-2 py-1 rounded w-full text-center">
                    Eliminar
                  </button>
                </div>
                {img.is_cover && (
                  <span className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded">★</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Subir fotos */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {isEdit ? '5' : '4'}
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            {isEdit ? 'Agregar fotos' : 'Fotos'}
          </h3>
        </div>

        <div className="pl-8">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed
                            border-slate-200 rounded-xl py-8 cursor-pointer hover:border-amber-400
                            hover:bg-amber-50/50 transition-colors">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-slate-500">
              <span className="text-amber-600 font-medium">Toca para elegir fotos</span> o arrástralas aquí
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setNewFiles(Array.from(e.target.files))}
              className="hidden"
            />
          </label>

          {newFiles.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              {newFiles.length} {newFiles.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'} — máximo 8 MB por foto
            </p>
          )}
          {!isEdit && newFiles.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">* Al menos una foto es obligatoria</p>
          )}

          {newFiles.length > 1 && (
            <div className="mt-3">
              <label className="text-xs text-slate-500 mb-2 block">Toca una foto para elegirla como portada</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {newFiles.map((f, i) => (
                  <div key={i} onClick={() => setCoverIndex(i)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden h-20 border-2 transition-all
                      ${i === coverIndex ? 'border-amber-400 shadow-md' : 'border-transparent opacity-70'}`}>
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    {i === coverIndex && (
                      <span className="absolute top-0.5 left-0.5 bg-amber-400 text-slate-900 text-xs px-1 rounded font-bold">★</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-semibold
                   transition-colors disabled:opacity-50 text-sm sm:text-base shadow-sm"
      >
        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Publicar vehículo'}
      </button>
    </form>
  )
}