import { useState, useEffect, useRef } from 'react'
import { getBrands, getProvinces, getMunicipalities } from '../lib/api'
import { Link } from 'react-router-dom'

export default function Header({ onSearch, filters, mode = 'sale' }) {
  const [brands, setBrands] = useState([])
  const [provinces, setProvinces] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [local, setLocal] = useState(filters)
  const debounceRef = useRef(null)
  const municipalitiesCache = useRef({})

  useEffect(() => {
    getBrands().then(r => setBrands(r.data))
    getProvinces().then(r => setProvinces(r.data))
  }, [])

  useEffect(() => { setLocal(filters) }, [filters])

  useEffect(() => {
    if (!local.province_id) {
      setMunicipalities([])
      return
    }

    if (municipalitiesCache.current[local.province_id]) {
      setMunicipalities(municipalitiesCache.current[local.province_id])
      return
    }

    getMunicipalities(local.province_id).then(r => {
      municipalitiesCache.current[local.province_id] = r.data
      setMunicipalities(r.data)
    })
  }, [local.province_id])

  const set = (key, value) => {
    const updated = { ...local, [key]: value }
    if (key === 'province_id') updated.municipality_id = ''
    setLocal(updated)
  }

  const handleTextChange = (e) => {
    const value = e.target.value
    setLocal(prev => ({ ...prev, q: value }))
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch({ ...local, q: value })
    }, 400)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    onSearch(local)
    setShowFilters(false)
  }

  const handleReset = () => {
    const empty = { q: '', brand_id: '', is_used: '', min_price: '', max_price: '', province_id: '', municipality_id: '', electric: ''}
    setLocal(empty)
    setMunicipalities([])
    onSearch(empty)
  }

  const activeFilterCount = Object.entries(local)
    .filter(([k, v]) => k !== 'q' && v !== '').length

  const selectClass = `w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white
    text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-1
    focus:ring-amber-400 transition-colors`

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">

        <div className="flex flex-col gap-2">

          {/* Fila 1: logo + nav + filtros */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-white font-bold text-lg sm:text-xl shrink-0 tracking-tight">
                <span className="text-slate-300">Cub</span>
                <span className="text-amber-400">Autos</span>
              </Link>

              <nav className="flex gap-1">
                <Link to="/"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${mode === 'sale' ? 'bg-amber-400 text-slate-900' : 'text-slate-300 hover:text-white'}`}>
                  Venta
                </Link>
                <Link to="/rentas"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${mode === 'rentals' ? 'bg-amber-400 text-slate-900' : 'text-slate-300 hover:text-white'}`}>
                  Renta
                </Link>
              </nav>
            </div>

            {/* Toggle filtros */}
            <button
              type="button"
              onClick={() => setShowFilters(f => !f)}
              className={`relative flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-2 text-sm
                          font-medium transition-colors shrink-0 border
                          ${showFilters
                            ? 'bg-amber-400 text-slate-900 border-amber-400'
                            : 'border-slate-500 text-slate-300 hover:border-slate-400 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 text-xs
                                 w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Fila 2: búsqueda */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 shrink-0"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar marca, modelo..."
                value={local.q}
                onChange={handleTextChange}
                className="w-full bg-slate-600/60 border border-slate-500 text-white placeholder-slate-400
                           rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-400
                           focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>
            <button type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2
                         rounded-lg text-sm font-semibold transition-colors shrink-0">
              Buscar
            </button>
          </form>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <select value={local.brand_id} onChange={e => set('brand_id', e.target.value)}
                className={selectClass}>
                <option value="">Todas las marcas</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              <select value={local.is_used} onChange={e => set('is_used', e.target.value)}
                className={selectClass}>
                <option value="">Nuevo y usado</option>
                <option value="false">Nuevo</option>
                <option value="true">Usado</option>
              </select>
              <select value={local.electric} onChange={e => set('electric', e.target.value)}
              className={selectClass}>
              <option value="">Combustión y eléctrico</option>
              <option value="true">Solo eléctricos</option>
              <option value="false">Solo combustión</option>
             </select>
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <input type="number" placeholder="Precio mín." value={local.min_price}
                  onChange={e => set('min_price', e.target.value)} className={selectClass} />
                <input type="number" placeholder="Precio máx." value={local.max_price}
                  onChange={e => set('max_price', e.target.value)} className={selectClass} />
              </div>

              <select value={local.province_id} onChange={e => set('province_id', e.target.value)}
                className={selectClass}>
                <option value="">Todas las provincias</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <select
                value={local.municipality_id || ''}
                onChange={e => set('municipality_id', e.target.value)}
                disabled={!municipalities.length}
                className={`${selectClass} ${!municipalities.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">
                  {local.province_id ? 'Todos los municipios' : 'Selecciona provincia'}
                </option>
                {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="flex gap-2 justify-end mt-3">
              <button type="button" onClick={handleReset}
                className="px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
                Limpiar
              </button>
              <button type="submit"
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-5 py-2.5 rounded-lg
                           text-sm font-semibold transition-colors">
                Aplicar filtros
              </button>
            </div>
          </form>
        )}
      </div>
    </header>
  )
}