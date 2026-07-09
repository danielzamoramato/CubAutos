import { useState } from 'react'
import { createAd, updateAd } from '../lib/api'

const PLACEMENTS = [
  { value: 'home_top', label: 'Inicio — banner superior' },
  { value: 'home_grid', label: 'Inicio — dentro del listado' },
  { value: 'rentals_top', label: 'Rentas — banner superior' },
  { value: 'detail_sidebar', label: 'Detalle de carro — banner' },
  { value: 'rental_detail', label: 'Detalle de renta — banner' },
]

export default function AdForm({ token, ad, onSaved }) {
  const isEdit = !!ad

  const [form, setForm] = useState({
    title: ad?.title || '',
    image_url: ad?.image_url || '',
    link_url: ad?.link_url || '',
    placement: ad?.placement || 'home_top',
    starts_at: ad?.starts_at?.slice(0, 10) || '',
    ends_at: ad?.ends_at?.slice(0, 10) || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.image_url.trim()) return setError('La URL de la imagen es obligatoria')
    if (!form.link_url.trim()) return setError('La URL de destino es obligatoria')
    if (!/^https?:\/\//.test(form.link_url)) return setError('La URL de destino debe empezar con http:// o https://')
    if (!/^https?:\/\//.test(form.image_url)) return setError('La URL de la imagen debe empezar con http:// o https://')

    setSaving(true)
    try {
      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: true,
      }
      if (isEdit) {
        await updateAd(ad.id, payload, token)
      } else {
        await createAd(payload, token)
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-5">
      <h2 className="text-lg font-semibold text-slate-800">
        {isEdit ? 'Editar anuncio' : 'Nuevo espacio publicitario'}
      </h2>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}

      <div>
        <label className={labelClass}>Nombre del negocio / anuncio</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Ej: Restaurante El Mojito" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>URL de la imagen *</label>
        <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
          placeholder="https://res.cloudinary.com/..." className={inputClass} />
        <p className="text-xs text-slate-400 mt-1">
          Sube la imagen a Cloudinary, Imgur, o cualquier hosting y pega el link aquí
        </p>
      </div>

      {form.image_url && (
        <div className="rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-50">
          <img src={form.image_url} alt="Vista previa"
            onError={e => e.target.style.display = 'none'}
            className="w-full h-full object-cover" />
        </div>
      )}

      <div>
        <label className={labelClass}>URL de destino (adónde lleva el click) *</label>
        <input value={form.link_url} onChange={e => set('link_url', e.target.value)}
          placeholder="https://wa.me/53..." className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Ubicación del anuncio *</label>
        <select value={form.placement} onChange={e => set('placement', e.target.value)}
          className={inputClass}>
          {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Inicia (opcional)</label>
          <input type="date" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Termina (opcional)</label>
          <input type="date" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}
            className={inputClass} />
        </div>
      </div>
      <p className="text-xs text-slate-400 -mt-3">
        Deja las fechas vacías para que el anuncio corra indefinidamente
      </p>

      <button type="submit" disabled={saving}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium
                   transition-colors disabled:opacity-50 text-sm sm:text-base">
        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear anuncio'}
      </button>
    </form>
  )
}