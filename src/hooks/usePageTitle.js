import { useEffect } from 'react'

const BASE = 'Rate UPV'

// Sets document.title for the current page; restores the base title on unmount.
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE
    return () => {
      document.title = BASE
    }
  }, [title])
}
