import CarCard from './CarCard'

export default function CarGrid({ cars, loading }) {
  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 animate-pulse">
          <div className="h-44 sm:h-48 bg-slate-200" />
          <div className="p-3 sm:p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-2/3 mt-4" />
          </div>
        </div>
      ))}
    </div>
  )

  if (!cars.length) return (
    <div className="text-center py-20 sm:py-24">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-slate-600 font-medium">No se encontraron vehículos</p>
      <p className="text-slate-400 text-sm mt-1">Intenta con otros filtros</p>
    </div>
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
      {cars.map(car => <CarCard key={car.id} car={car} />)}
    </div>
  )
}