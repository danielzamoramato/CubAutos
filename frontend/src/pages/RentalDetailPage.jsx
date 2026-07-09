import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRentalById } from '../lib/api'
import { Helmet } from 'react-helmet-async'
import AdSlot from '../components/AdSlot'

export default function RentalDetailPage() {
  const { id } = useParams()
  const [rental, setRental] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    fetchedRef.current = false
    setLoading(true)
    setActiveImg(0)
  }, [id])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    getRentalById(id)
      .then(r => setRental(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const handler = (e) => {
      if (!lightbox || !rental) return
      if (e.key === 'ArrowRight') setActiveImg(i => (i + 1) % orderedImages.length)
      if (e.key === 'ArrowLeft')  setActiveImg(i => (i - 1 + orderedImages.length) % orderedImages.length)
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, rental])

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p)

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 h-14" />
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 w-full">
        <div className="h-64 sm:h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    </div>
  )

  if (!rental) return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
      <p className="text-slate-500 text-lg font-medium text-center">Carro de renta no encontrado</p>
      <Link to="/rentas" className="mt-4 text-amber-500 text-sm hover:text-amber-400 transition-colors">
        ← Volver a rentas
      </Link>
    </div>
  )

  const images = rental.images ?? []
  const coverIndex = images.findIndex(i => i.is_cover)
  const orderedImages = coverIndex > 0
    ? [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)]
    : images

  return (
    <div className="min-h-screen bg-slate-100">
      <Helmet>
        <title>{rental.brand} {rental.model} en renta — {formatPrice(rental.price_per_day)}/día | CubAutos</title>
        <meta name="description"
          content={`Renta ${rental.brand} ${rental.model} en ${rental.province}. ${rental.description?.slice(0, 120) || ''}`} />
      </Helmet>

      <header className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4">
          <Link to="/" className="text-white font-bold text-lg sm:text-xl tracking-tight shrink-0">
            <span className="text-slate-300">Cub</span>
            <span className="text-amber-400">Autos</span>
          </Link>
          <Link to="/rentas" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1">
            ← Volver a rentas
          </Link>
        </div>
      </header>

      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightbox(false)}>
          <img src={orderedImages[activeImg]?.url} alt=""
            className="max-h-[85vh] max-w-[85vw] object-contain"
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(false)}
            className="absolute top-3 right-3 text-white hover:bg-white/10 w-9 h-9 flex items-center
                       justify-center rounded-full transition-colors text-lg z-10">
            ✕
          </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

        <div className="mb-5 sm:mb-8">
          <AdSlot placement="rental_detail" />
        </div>

        <div className="flex flex-col gap-5 sm:gap-8">

          <div>
            {orderedImages.length > 0 ? (
              <>
                <div className="rounded-xl overflow-hidden h-64 sm:h-96 bg-slate-200 cursor-zoom-in shadow-md"
                  onClick={() => setLightbox(true)}>
                  <img src={orderedImages[activeImg]?.url} alt={`${rental.brand} ${rental.model}`}
                    className="w-full h-full object-cover" />
                </div>
                {orderedImages.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {orderedImages.map((img, i) => (
                      <button key={img.id} type="button" onClick={() => setActiveImg(i)}
                        className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2
                          ${i === activeImg ? 'border-amber-400' : 'border-transparent opacity-60'}`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl h-64 sm:h-96 bg-slate-200 flex items-center justify-center text-slate-400 shadow-md">
                Sin fotos
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 bg-amber-400 text-slate-900">
                Renta
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                {rental.brand} {rental.model}
                {rental.year && <span className="text-slate-400 font-normal ml-1">({rental.year})</span>}
              </h1>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2 tracking-tight">
                {formatPrice(rental.price_per_day)}<span className="text-base font-normal text-slate-400">/día</span>
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalles</h2>
              <Detail label="Marca" value={rental.brand} />
              <Detail label="Modelo" value={rental.model} />
              {rental.year && <Detail label="Año" value={rental.year} />}
              <Detail label="Transmisión" value={rental.transmission === 'automatic' ? 'Automática' : 'Manual'} />
              {rental.seats && <Detail label="Asientos" value={rental.seats} />}
              <Detail label="Provincia" value={rental.province} />
              {rental.municipality && <Detail label="Municipio" value={rental.municipality} />}
            </div>

            {rental.description && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descripción</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{rental.description}</p>
              </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contacto</h2>
              {rental.owner_name && (
                <p className="text-sm text-slate-700 font-semibold mb-3">{rental.owner_name}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rental.owner_phone && (
                  <a href={`tel:${rental.owner_phone}`}
                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600
                               text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                    Llamar — {rental.owner_phone}
                  </a>
                )}
                {rental.owner_phone && (
                  <a href={`https://wa.me/${rental.owner_phone.replace(/\D/g, '')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400
                               text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
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