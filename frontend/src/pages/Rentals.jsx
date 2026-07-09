import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import RentalCard from '../components/RentalCard'
import { getRentalsList } from '../lib/api'
import AdSlot from '../components/AdSlot'

export default function Rentals() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('recent')
  const [filters, setFilters] = useState({
    q: '', brand_id: '', province_id: '', municipality_id: '',
    min_price: '', max_price: '', transmission: ''
  })

  const fetchRentals = useCallback(async (activeFilters, activePage, activeSort) => {
    setLoading(true)
    try {
      const params = { ...activeFilters, page: activePage, sort: activeSort }
      const { data } = await getRentalsList(params)
      setRentals(data.rentals ?? [])
      setTotalPages(data.pages ?? 1)
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRentals(filters, page, sort)
  }, [filters, page, sort, fetchRentals])

  const handleSearch = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header onSearch={handleSearch} filters={filters} mode="rentals" />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

        <div className="mb-5">
          <AdSlot placement="rentals_top" />
        </div>

        <div className="flex items-center justify-between mb-4 gap-3">
          {!loading && (
            <p className="text-xs sm:text-sm text-slate-500">
              {total === 0
                ? 'Sin resultados'
                : `${total} ${total === 1 ? 'carro disponible' : 'carros disponibles'}`}
            </p>
          )}
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white
                       text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-1
                       focus:ring-amber-400 transition-colors shrink-0"
          >
            <option value="recent">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 animate-pulse">
                <div className="h-44 sm:h-48 bg-slate-200" />
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-6 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-20 sm:py-24">
            <p className="text-slate-600 font-medium">No hay carros de renta disponibles</p>
            <p className="text-slate-400 text-sm mt-1">Intenta con otros filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {rentals.map(r => <RentalCard key={r.id} rental={r} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-8 sm:mt-10 flex-wrap">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm border border-slate-300 bg-white
                         text-slate-600 hover:border-slate-400 disabled:opacity-40 transition-colors">
              ← Ant.
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors
                  ${p === page ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm border border-slate-300 bg-white
                         text-slate-600 hover:border-slate-400 disabled:opacity-40 transition-colors">
              Sig. →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}