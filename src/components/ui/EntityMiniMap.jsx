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

    // No explicit style (SDK default Streets) + explicit projection to skip
    // the SDK's crashing projection-migration step — see map.jsx.
    mapRef.current = new maptilersdk.Map({
      container: containerRef.current,
      center: [lng, lat],
      zoom,
      scrollZoom: false,
      projection: 'mercator',
    })
    new maptilersdk.Marker({ color: '#A31F33' })
      .setLngLat([lng, lat])
      .addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng, zoom])

  return <div ref={containerRef} className="rupv-detail-map-canvas" />
}
