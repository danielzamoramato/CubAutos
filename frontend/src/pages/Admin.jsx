import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminCars, deleteCar, toggleCarActive,
  getAdminRentals, deleteRental, toggleRentalActive,
  login
} from '../lib/api'
import CarForm from '../components/CarForm'
import RentalForm from '../components/RentalForm'

const TOKEN_KEY = 'cubautos_token'

export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem(TOKEN_KEY) || '')
  const [authed, setAuthed] = useState(!!sessionStorage.getItem(TOKEN_KEY))
  const [pwdInput, setPwdInput] = useState('')
  const [error, setError] = useState('')

  const [listType, setListType] = useState('sale') // 'sale' | 'rental' — qué lista se muestra
  const [cars, setCars] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(false)

  // view: 'list' | 'choose' | 'create' | 'edit'
  const [view, setView] = useState('list')
  const [formType, setFormType] = useState(null) // 'sale' | 'rental' — qué formulario se usa
  const [editing, setEditing] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await login(pwdInput)
      sessionStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setAuthed(true)
    } catch {
      setError('Contraseña incorrecta')
    }
  }

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    setAuthed(false)
    setToken('')
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      if (listType === 'sale') {
        const { data } = await getAdminCars(token)
        setCars(data.cars ?? [])
      } else {
        const { data } = await getAdminRentals(token)
        setRentals(data.rentals ?? [])
      }
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authed && view === 'list') fetchData() }, [authed, listType, view])

  const handleDeleteCar = async (id) => {
    if (!confirm('¿Eliminar este carro?')) return
    try { await deleteCar(id, token); fetchData() } catch { setError('Error al eliminar') }
  }

  const handleDeleteRental = async (id) => {
    if (!confirm('¿Eliminar este carro de renta?')) return
    try { await deleteRental(id, token); fetchData() } catch { setError('Error al eliminar') }
  }

  const handleToggleCar = async (car) => {
    try { await toggleCarActive(car.id, !car.is_active, token); fetchData() }
    catch { setError('Error al actualizar') }
  }

  const handleToggleRental = async (rental) => {
    try { await toggleRentalActive(rental.id, !rental.is_active, token); fetchData() }
    catch { setError('Error al actualizar') }
  }

  const handleSaved = () => {
    setView('list')
    setEditing(null)
    setFormType(null)
    fetchData()
  }

  const startCreate = () => {
    setEditing(null)
    setView('choose')
  }

  const chooseType = (type) => {
    setFormType(type)
    setView('create')
  }

  const startEdit = (item, type) => {
    setEditing(item)
    setFormType(type)
    setView('edit')
  }

  // ── Login ────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm w-full max-w-sm">
        <h1 className="text-xl font-semibold text-slate-800 mb-6 text-center">Panel Admin</h1>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-3">{error}</div>}
        <input type="password" placeholder="Contraseña" value={pwdInput}
          onChange={e => setPwdInput(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm mb-3
                     focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400" />
        <button type="submit"
          className="w-full bg-slate-700 text-white py-3 rounded-lg text-sm font-medium
                     hover:bg-slate-600 transition-colors">
          Entrar
        </button>
      </form>
    </div>
  )

  // ── Selector de tipo al crear ────────────────────────────
  if (view === 'choose') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm w-full max-w-sm text-center">
        <h1 className="text-lg font-semibold text-slate-800 mb-1">¿Qué deseas publicar?</h1>
        <p className="text-sm text-slate-400 mb-6">Selecciona el tipo de anuncio</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => chooseType('sale')}
            className="flex flex-col items-center gap-2 border-2 border-slate-200 rounded-xl p-5
                       hover:border-amber-400 hover:bg-amber-50 transition-colors">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-6l2-5h9l4 5h1a2 2 0 012 2v4h-2m-6 0H9m10 0H5" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Venta</span>
          </button>
          <button type="button" onClick={() => chooseType('rental')}
            className="flex flex-col items-center gap-2 border-2 border-slate-200 rounded-xl p-5
                       hover:border-amber-400 hover:bg-amber-50 transition-colors">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-9c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Renta</span>
          </button>
        </div>
        <button onClick={() => setView('list')}
          className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )

  // ── Formulario crear/editar ──────────────────────────────
  if (view === 'create' || view === 'edit') return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <button onClick={() => { setView('list'); setEditing(null); setFormType(null) }}
          className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          ← Volver
        </button>
        {formType === 'rental' ? (
          <RentalForm token={token} rental={editing} onSaved={handleSaved} />
        ) : (
          <CarForm token={token} car={editing} onSaved={handleSaved} />
        )}
      </div>
    </div>
  )

  // ── Lista ────────────────────────────────────────────────
  const items = listType === 'sale' ? cars : rentals
  const priceField = listType === 'sale' ? 'price' : 'price_per_day'

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 shrink-0">← Inicio</Link>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 truncate">Panel Admin</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={startCreate}
              className="bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium
                         hover:bg-slate-600 transition-colors">
              <span className="hidden sm:inline">+ Nuevo anuncio</span>
              <span className="sm:hidden">+ Nuevo</span>
            </button>
            <button onClick={logout}
              className="border border-slate-200 text-slate-500 px-3 sm:px-4 py-2 rounded-lg text-sm
                         hover:border-slate-300 transition-colors">
              Salir
            </button>
          </div>
        </div>

        {/* Tabs Venta / Renta */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setListType('sale')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${listType === 'sale' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            Venta
          </button>
          <button onClick={() => setListType('rental')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${listType === 'rental' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            Renta
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            No hay {listType === 'sale' ? 'carros en venta' : 'carros de renta'} aún
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Carro</th>
                    <th className="px-4 py-3 text-left">{listType === 'sale' ? 'Precio' : 'Precio/día'}</th>
                    <th className="px-4 py-3 text-left">Provincia</th>
                    <th className="px-4 py-3 text-left">Vistas</th>
                    <th className="px-4 py-3 text-left">Activo</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr key={item.id} className={`hover:bg-slate-50 ${!item.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.brand} {item.model} {item.year && `(${item.year})`}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        ${Number(item[priceField]).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.province}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">👁 {item.views ?? 0}</td>
                      <td className="px-4 py-3">
                        <button type="button"
                          onClick={() => listType === 'sale' ? handleToggleCar(item) : handleToggleRental(item)}
                          className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-300
                            ${item.is_active ? 'bg-amber-400' : 'bg-slate-300'}`}>
                          <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-md
                            transform transition-transform duration-300 mt-0.5
                            ${item.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 flex gap-3">
                        <button type="button" onClick={() => startEdit(item, listType)}
                          className="text-slate-500 hover:text-slate-700 text-xs font-medium">
                          Editar
                        </button>
                        <button type="button"
                          onClick={() => listType === 'sale' ? handleDeleteCar(item.id) : handleDeleteRental(item.id)}
                          className="text-red-400 hover:text-red-600 text-xs font-medium">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas mobile */}
            <div className="md:hidden space-y-3">
              {items.map(item => (
                <div key={item.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200
                    ${!item.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {item.brand} {item.model} {item.year && `(${item.year})`}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.province}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">👁 {item.views ?? 0}</span>
                  </div>
                  <p className="text-slate-900 font-bold text-lg mb-3">
                    ${Number(item[priceField]).toLocaleString()}{listType === 'rental' && <span className="text-xs font-normal text-slate-400">/día</span>}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => startEdit(item, listType)}
                        className="text-slate-500 hover:text-slate-700 text-sm font-medium">
                        Editar
                      </button>
                      <button type="button"
                        onClick={() => listType === 'sale' ? handleDeleteCar(item.id) : handleDeleteRental(item.id)}
                        className="text-red-400 hover:text-red-600 text-sm font-medium">
                        Eliminar
                      </button>
                    </div>
                    <button type="button"
                      onClick={() => listType === 'sale' ? handleToggleCar(item) : handleToggleRental(item)}
                      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-300
                        ${item.is_active ? 'bg-amber-400' : 'bg-slate-300'}`}>
                      <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-md
                        transform transition-transform duration-300 mt-0.5
                        ${item.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}