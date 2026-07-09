import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import CarGrid from '../components/CarGrid'
import { getCars } from '../lib/api'
import AdSlot from '../components/AdSlot'

export default function Home() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('recent')
  const [filters, setFilters] = useState({
    q: '', brand_id: '', is_used: '', min_price: '', max_price: '',
    province_id: '', municipality_id: '', electric: ''
  })

  const fetchCars = useCallback(async (activeFilters, activePage, activeSort) => {
    setLoading(true)
    try {
      const params = { ...activeFilters, page: activePage, sort: activeSort }
      const { data } = await getCars(params)
      setCars(data.cars ?? [])
      setTotalPages(data.pages ?? 1)
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCars(filters, page, sort)
  }, [filters, page, sort, fetchCars])

  const handleSearch = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleSortChange = (e) => {
    setSort(e.target.value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header onSearch={handleSearch} filters={filters} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

        <div className="mb-5">
          <AdSlot placement="home_top" />
        </div>

        {/* Contador + Orden */}
        <div className="flex items-center justify-between mb-4 gap-3">
          {!loading && (
            <p className="text-xs sm:text-sm text-slate-500">
              {total === 0
                ? 'Sin resultados'
                : `${total} ${total === 1 ? 'vehículo encontrado' : 'vehículos encontrados'}`}
            </p>
          )}

          <select
            value={sort}
            onChange={handleSortChange}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white
                       text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-1
                       focus:ring-amber-400 transition-colors shrink-0"
          >
            <option value="recent">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>

        <CarGrid cars={cars} loading={loading} />

        <div className="my-8">
          <AdSlot placement="home_middle" />
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-8 sm:mt-10 flex-wrap">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm border border-slate-300 bg-white
                         text-slate-600 hover:border-slate-400 disabled:opacity-40 transition-colors"
            >
              ← Anterior.
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors
                  ${p === page
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm border border-slate-300 bg-white
                         text-slate-600 hover:border-slate-400 disabled:opacity-40 transition-colors"
            >
              Sig. →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}