import { useState, useEffect, useRef } from 'react'
import { getAd, registerAdClick } from '../lib/api'

export default function AdSlot({ placement }) {
  const [ads, setAds] = useState([])
  const [active, setActive] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    getAd(placement)
      .then(r => setAds(r.data.ads ?? []))
      .catch(() => setAds([]))
  }, [placement])

  useEffect(() => {
    if (ads.length <= 1) return

    intervalRef.current = setInterval(() => {
      setActive(i => (i + 1) % ads.length)
    }, 10000)

    return () => clearInterval(intervalRef.current)
  }, [ads])

  if (!ads.length) return null

  const ad = ads[active]

  const handleClick = () => {
    registerAdClick(ad.id).catch(() => {})
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <a 
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block relative"
      >
        <span className="absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded
                         bg-slate-900/60 text-white z-10">
          Publicidad
        </span>
        <img
          src={ad.image_url}
          alt={ad.title || 'Publicidad'}
          className="w-full h-28 sm:h-36 md:h-44 object-cover"
        />
      </a>

      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {ads.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all
                ${i === active ? 'bg-white w-4' : 'bg-white/50'}`}
              aria-label={`Anuncio ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}