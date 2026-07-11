import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function CarCard({ car }) {
  const [imgError, setImgError] = useState(false)

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-CU', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(p)

    const isFeatured = car.is_featured && car.featured_until && new Date(car.featured_until) > new Date()

  return (
    <Link
      to={`/cars/${car.id}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200
                 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col"
    >
      {/* Imagen */}
      <div className="relative h-44 sm:h-48 bg-slate-100 overflow-hidden shrink-0">
        {car.cover_image && !imgError ? (
          <img
            src={car.cover_image}
            alt={`${car.brand} ${car.model}`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span className="text-xs mt-2">Sin foto</span>
          </div>
        )}
        
        <span className={`absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm
        ${car.is_used ? 'bg-slate-800/80 text-slate-200' : 'bg-emerald-500/90 text-white'}`}>
          {car.is_used ? 'Usado' : 'Nuevo'}
        </span>

        {isFeatured && (
          <span className="absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm bg-amber-400/90 text-slate-900 flex items-center gap-1">
            ★ Destacado
          </span>
        )}

        {car.is_electric && (
          <span className="absolute top-12 right-2 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm bg-teal-500/90 text-white">
            ⚡ Eléctrico
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-800 truncate text-sm">
          {car.brand} {car.model}{' '}
          {car.year && <span className="text-slate-400 font-normal">({car.year})</span>}
        </h3>
        <p className="text-slate-900 font-bold text-lg sm:text-xl mt-1 tracking-tight">
          {formatPrice(car.price)}
        </p>
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
          <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd" />
            </svg>
            <span className="truncate">
              {car.municipality ? `${car.municipality}, ` : ''}{car.province}
            </span>
          </span>
          {car.is_used && car.km && (
            <span className="text-xs text-slate-400 font-medium shrink-0">
              {Number(car.km).toLocaleString()} km
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}