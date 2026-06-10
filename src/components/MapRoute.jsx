import { lazy, Suspense } from 'react'

// The map page pulls in the MapTiler SDK (~1.4 MB minified) — code-split it so
// the rest of the site doesn't pay for it on first load.
const MapPreview = lazy(() => import('./mapPreview'))

export default function MapRoute() {
  return (
    <Suspense
      fallback={
        <div className="map-page" aria-busy="true">
          <div className="map-skeleton rupv-skeleton" aria-hidden="true" />
        </div>
      }
    >
      <MapPreview />
    </Suspense>
  )
}
