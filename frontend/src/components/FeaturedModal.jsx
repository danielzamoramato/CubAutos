import { useState } from 'react'

export default function FeaturedModal({ item, onConfirm, onClose }) {
  const [days, setDays] = useState(7)
  const isCurrentlyFeatured = item.is_featured && item.featured_until && new Date(item.featured_until) > new Date()

  const handleConfirm = () => {
    const until = new Date()
    until.setDate(until.getDate() + Number(days))
    onConfirm(until.toISOString())
  }

  const handleRemove = () => {
    onConfirm(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Destacar publicación</h2>
        <p className="text-sm text-slate-400 mb-4">
          {item.brand} {item.model}
        </p>

        {isCurrentlyFeatured && (
          <div className="bg-amber-50 text-amber-700 text-sm px-3 py-2 rounded-lg mb-4">
            Ya está destacado hasta el {new Date(item.featured_until).toLocaleDateString('es-CU')}
          </div>
        )}

        <label className="text-xs text-slate-500 mb-1 block font-medium">
          Duración del destacado (días)
        </label>
        <input
          type="number"
          min="1"
          value={days}
          onChange={e => setDays(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-2
                     focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        />

        <div className="flex gap-2 flex-wrap mb-5">
          {[3, 7, 15, 30].map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors
                ${Number(days) === d
                  ? 'bg-amber-400 border-amber-400 text-slate-900'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
              {d} días
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {isCurrentlyFeatured && (
            <button type="button" onClick={handleRemove}
              className="flex-1 border border-red-200 text-red-500 py-2.5 rounded-lg text-sm font-medium
                         hover:bg-red-50 transition-colors">
              Quitar destacado
            </button>
          )}
          <button type="button" onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-500 py-2.5 rounded-lg text-sm font-medium
                       hover:border-slate-300 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm}
            className="flex-1 bg-slate-700 text-white py-2.5 rounded-lg text-sm font-medium
                       hover:bg-slate-600 transition-colors">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}