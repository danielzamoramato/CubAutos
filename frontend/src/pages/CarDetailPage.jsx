import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCarById, getRelatedCars  } from '../lib/api'
import { Helmet } from 'react-helmet-async'
import CarCard from '../components/CarCard'

export default function CarDetailPage() {
  const { id } = useParams()
  const [car, setCar] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
  if (fetchedRef.current) return
  fetchedRef.current = true

  Promise.all([getCarById(id), getRelatedCars(id)])
    .then(([carRes, relatedRes]) => {
      setCar(carRes.data)
      setRelated(relatedRes.data.cars ?? [])
    })
    .catch(console.error)
    .finally(() => setLoading(false))
}, [id])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    getCarById(id)
      .then(r => {
        setCar(r.data)
        return getRelatedCars(id)
      })
      .then(r => setRelated(r.data.cars ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const handler = (e) => {
      if (!lightbox || !car) return
      if (e.key === 'ArrowRight') setActiveImg(i => (i + 1) % orderedImages.length)
      if (e.key === 'ArrowLeft')  setActiveImg(i => (i - 1 + orderedImages.length) % orderedImages.length)
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, car])

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p)

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 h-14" />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 w-full">
        <div className="h-4 bg-slate-200 rounded w-24 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 sm:h-96 bg-slate-200 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 rounded w-3/4 animate-pulse" />
            <div className="h-10 bg-slate-200 rounded w-1/2 animate-pulse" />
            <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!car) return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
      <p className="text-slate-500 text-lg font-medium text-center">Vehículo no encontrado</p>
      <Link to="/" className="mt-4 text-amber-500 text-sm hover:text-amber-400 transition-colors">
        ← Volver al inicio
      </Link>
    </div>
  )

  const images = car.images ?? []
  const coverIndex = images.findIndex(i => i.is_cover)
  const orderedImages = coverIndex > 0
    ? [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)]
    : images

  return (
    <div className="min-h-screen bg-slate-100">
      <Helmet>
       <title>{car.brand} {car.model} {car.year ? `(${car.year})` : ''} — US${Number(car.price).toLocaleString()} | CubAutos</title>
       <meta name="description"
       content={`${car.is_used ? 'Usado' : 'Nuevo'}, ${car.km ? `${Number(car.km).toLocaleString()} km, ` : ''}${car.province}. ${car.description?.slice(0, 120) || 'Ver detalles y contacto del vendedor.'}`} />
       <meta property="og:title" content={`${car.brand} ${car.model} — US$${Number(car.price).toLocaleString()}`} />
       <meta property="og:description" content={`${car.province}${car.municipality ? `, ${car.municipality}` : ''}. ${car.description?.slice(0, 100) || ''}`} />
       {car.images?.[0]?.url && <meta property="og:image" content={car.images[0].url} />}
    </Helmet>
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4">
          <Link to="/" className="text-white font-bold text-lg sm:text-xl tracking-tight shrink-0">
            <span className="text-slate-300">Cub</span>
            <span className="text-amber-400">Autos</span>
          </Link>
          <Link to="/" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1">
            ← <span className="hidden sm:inline">Volver al listado</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>
      </header>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightbox(false)}>
          <button
            onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + orderedImages.length) % orderedImages.length) }}
            className="absolute left-2 sm:left-4 text-white text-3xl sm:text-4xl w-10 h-10 sm:w-12 sm:h-12
                       flex items-center justify-center hover:bg-white/10 rounded-full transition-colors z-10">
            ‹
          </button>
          <img src={orderedImages[activeImg]?.url} alt=""
            className="max-h-[85vh] max-w-[85vw] object-contain"
            onClick={e => e.stopPropagation()} />
          <button
            onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % orderedImages.length) }}
            className="absolute right-2 sm:right-4 text-white text-3xl sm:text-4xl w-10 h-10 sm:w-12 sm:h-12
                       flex items-center justify-center hover:bg-white/10 rounded-full transition-colors z-10">
            ›
          </button>
          <button onClick={() => setLightbox(false)}
            className="absolute top-3 right-3 text-white hover:bg-white/10 w-9 h-9 flex items-center
                       justify-center rounded-full transition-colors text-lg z-10">
            ✕
          </button>
          <span className="absolute bottom-4 text-slate-400 text-sm">
            {activeImg + 1} / {orderedImages.length}
          </span>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

  <div className="flex flex-col gap-5 sm:gap-8">

    {/* Galería */}
    <div>
      {orderedImages.length > 0 ? (
        <>
          <div
            className="rounded-xl overflow-hidden h-64 sm:h-96 lg:h-[480px] bg-slate-200
                        cursor-zoom-in shadow-md"
            onClick={() => setLightbox(true)}
          >
            <img
              src={orderedImages[activeImg]?.url}
              alt={`${car.brand} ${car.model}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          {orderedImages.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {orderedImages.map((img, i) => (
                <button key={img.id} type="button" onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden
                              border-2 transition-all
                              ${i === activeImg
                                ? 'border-amber-400 shadow-md'
                                : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl h-64 sm:h-96 bg-slate-200 flex flex-col
                        items-center justify-center text-slate-400 shadow-md">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm">Sin fotos</span>
        </div>
      )}
    </div>

    {/* Info */}
    <div className="space-y-3 sm:space-y-4">
      <div>
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2
          ${car.is_used ? 'bg-slate-700 text-slate-200' : 'bg-emerald-500 text-white'}`}>
          {car.is_used ? 'Usado' : 'Nuevo'}
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
          {car.brand} {car.model}
          {car.year && <span className="text-slate-400 font-normal ml-1">({car.year})</span>}
        </h1>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2 tracking-tight">
          {formatPrice(car.price)}
        </p>
      </div>

      {/* Ficha técnica */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ficha técnica</h2>
        <Detail label="Marca" value={car.brand} />
        <Detail label="Modelo" value={car.model} />
        {car.year && <Detail label="Año" value={car.year} />}
        <Detail label="Estado" value={car.is_used ? 'Usado' : 'Nuevo'} />
        {car.is_used && car.km && (
          <Detail label="Kilometraje" value={`${Number(car.km).toLocaleString()} km`} />
        )}
        <Detail label="Provincia" value={car.province} />
        {car.municipality && <Detail label="Municipio" value={car.municipality} />}
      </div>

      {/* Descripción */}
      {car.description && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descripción</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{car.description}</p>
        </div>
      )}

      {/* Contacto */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contacto</h2>
        {car.owner_name && (
          <p className="text-sm text-slate-700 font-semibold mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            {car.owner_name}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {car.owner_phone && (
            <a href={`tel:${car.owner_phone}`}
              className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600
                         text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Llamar — {car.owner_phone}
            </a>
          )}
          {car.owner_phone && (
            <a href={`https://wa.me/${car.owner_phone.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400
                         text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  </div>

  {/* Carros relacionados */}
  {related.length > 0 && (
    <div className="mt-10 sm:mt-14">
      <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">
        Vehículos similares
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {related.map(c => <CarCard key={c.id} car={c} />)}
      </div>
    </div>
  )}
</div>

      
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium text-right">{value}</span>
    </div>
  )
}