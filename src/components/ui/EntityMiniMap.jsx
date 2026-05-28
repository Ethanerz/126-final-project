// EntityMiniMap.jsx — compact interactive MapTiler map centered on one entity.
// Uses the SDK (not static maps) because this key has no Static Maps access.
import { useEffect, useRef } from 'react'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY

export default function EntityMiniMap({ lat, lng, zoom = 16 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || lat == null || lng == null) return

    mapRef.current = new maptilersdk.Map({
      container: containerRef.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [lng, lat],
      zoom,
      scrollZoom: false,
    })
    new maptilersdk.Marker({ color: '#A31F33' })
      .setLngLat([lng, lat])
      .addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, zoom])

  return <div ref={containerRef} className="rupv-detail-map-canvas" />
}
