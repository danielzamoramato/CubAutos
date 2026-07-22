import { useState, useEffect } from 'react'
import { getBrands, getProvinces, getMunicipalities, createRental, updateRental, uploadRentalImages, deleteRentalImage, setRentalCover, createBrand } from '../lib/api'

export default function RentalForm({ token, rental, onSaved }) {
  const isEdit = !!rental

  const [brands, setBrands] = useState([])
  const [provinces, setProvinces] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [showNewBrand, setShowNewBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [images, setImages] = useState(rental?.images || [])
  const [newFiles, setNewFiles] = useState([])
  const [coverIndex, setCoverIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    brand_id: rental?.brand_id || '',
    model: rental?.model || '',
    year: rental?.year || '',
    price_per_day: rental?.price_per_day || '',
    transmission: rental?.transmission || 'manual',
    seats: rental?.seats || '',
    description: rental?.description || '',
    province_id: rental?.province_id || '',
    municipality_id: rental?.municipality_id || '',
    owner_name: rental?.owner_name || '',
    owner_phone: rental?.owner_phone || '',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    getBrands().then(r => setBrands(r.data))
    getProvinces().then(r => setProvinces(r.data))
  }, [])

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return
    try {
      const { data } = await createBrand(newBrandName.trim(), token)
      setBrands(prev => [...prev, data])
      set('brand_id', data.id)
      setNewBrandName('')
      setShowNewBrand(false)
    } catch {
      setError('Error al agregar la marca')
    }
  }

  useEffect(() => {
    if (form.province_id) {
      getMunicipalities(form.province_id).then(r => setMunicipalities(r.data))
    } else {
      setMunicipalities([])
      set('municipality_id', '')
    }
  }, [form.province_id])

  const handleDeleteImage = async (imgId) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    await deleteRentalImage(imgId, token)
    setImages(prev => prev.filter(i => i.id !== imgId))
  }

  const handleSetCover = async (imgId) => {
    await setRentalCover(imgId, rental.id, token)
    setImages(prev => prev.map(i => ({ ...i, is_cover: i.id === imgId })))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.brand_id) return setError('Selecciona una marca')
    if (!form.model.trim()) return setError('El modelo es obligatorio')
    if (!form.price_per_day || Number(form.price_per_day) <= 0) return setError('El precio por día debe ser mayor a 0')
    if (!form.province_id) return setError('Selecciona una provincia')
    if (!form.owner_phone.trim()) return setError('El teléfono de contacto es obligatorio')
    if (!isEdit && newFiles.length === 0) return setError('Agrega al menos una foto del vehículo')

    setSaving(true)
    try {
      let rentalId = rental?.id
      const payload = {
        ...form,
        price_per_day: Number(form.price_per_day),
        seats: form.seats ? Number(form.seats) : null,
        is_active: true,
      }
      if (isEdit) {
        await updateRental(rentalId, payload, token)
      } else {
        const { data } = await createRental(payload, token)
        rentalId = data.id
      }
      if (newFiles.length > 0) {
        await uploadRentalImages(rentalId, newFiles, coverIndex, token)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = `w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm
    focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors`
  const labelClass = `text-xs text-slate-500 mb-1 block font-medium`

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">
        {isEdit ? 'Editar carro de renta' : 'Publicar carro de renta'}
      </h2>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}

      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Datos del vehículo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Marca *</label>
            <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)}
              required className={inputClass}>
              <option value="">Seleccionar...</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {!showNewBrand ? (
              <button type="button" onClick={() => setShowNewBrand(true)}
                className="text-xs text-amber-600 hover:text-amber-700 mt-1">
                ¿No está tu marca? Agrégala
              </button>
            ) : (
              <div className="flex gap-2 mt-2">
                <input value={newBrandName} onChange={e => setNewBrandName(e.target.value)}
                  placeholder="Nombre de la marca" className={inputClass} />
                <button type="button" onClick={handleAddBrand}
                  className="bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-medium shrink-0">
                  Agregar
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
            <label className={labelClass}>Precio por día (USD) *</label>
            <input type="number" value={form.price_per_day} onChange={e => set('price_per_day', e.target.value)}
              required placeholder="Ej: 45" min="0" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Transmisión</label>
            <select value={form.transmission} onChange={e => set('transmission', e.target.value)}
              className={inputClass}>
              <option value="manual">Manual</option>
              <option value="automatic">Automática</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Asientos</label>
            <input type="number" value={form.seats} onChange={e => set('seats', e.target.value)}
              placeholder="Ej: 5" min="1" max="9" className={inputClass} />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>Descripción</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={4} placeholder="Condiciones de renta, kilometraje incluido, requisitos..."
            className={inputClass} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ubicación</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contacto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nombre</label>
            <input value={form.owner_name} onChange={e => set('owner_name', e.target.value)}
              placeholder="Nombre completo" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input value={form.owner_phone} onChange={e => set('owner_phone', e.target.value)}
              placeholder="+53 5 xxx xxxx" className={inputClass} />
          </div>
        </div>
      </section>

      {isEdit && images.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Fotos actuales</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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

      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {isEdit ? 'Agregar fotos' : 'Fotos'}
        </h3>
        <input type="file" accept="image/*" multiple
          onChange={e => setNewFiles(Array.from(e.target.files))}
          className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-3
                     file:rounded-lg file:border-0 file:text-sm file:font-medium
                     file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200" />
        {newFiles.length > 0 && (
          <p className="text-xs text-slate-500 mt-1.5">
            {newFiles.length} {newFiles.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'} — máximo 8 MB por foto
          </p>
        )}
        {!isEdit && newFiles.length === 0 && (
          <p className="text-xs text-amber-600 mt-1.5">* Al menos una foto es obligatoria</p>
        )}
        {newFiles.length > 1 && (
          <div className="mt-3">
            <label className={labelClass}>Toca una foto para seleccionarla como portada</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
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
      </section>

      <button type="submit" disabled={saving}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium
                   transition-colors disabled:opacity-50 text-sm sm:text-base">
        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Publicar carro de renta'}
      </button>
    </form>
  )
}