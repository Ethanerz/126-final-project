// Shared filter/sort state + logic for the entity list (Browse + Map), so both
// pages behave identically. The matching UI lives in components/ui/EntityFilters.
import { useMemo, useState } from 'react'

// Works with either Dashboard's pre-computed { avgRating, reviewCount } shape or
// the map's raw { reviews: [{ rating }] } shape.
const statsOf = (e) => {
  if (typeof e.avgRating === 'number') return { avg: e.avgRating, count: e.reviewCount ?? 0 }
  const reviews = e.reviews ?? []
  const count = reviews.length
  const avg = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0
  return { avg, count }
}

export function useEntityFilters(entities) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState('rating')
  const [minRating, setMinRating] = useState(0)
  const [reviewedOnly, setReviewedOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = entities.filter((e) => {
      if (typeFilter !== 'all' && e.entity_type !== typeFilter) return false
      const { avg, count } = statsOf(e)
      if (reviewedOnly && count === 0) return false
      if (minRating > 0 && avg < minRating) return false
      if (!q) return true
      return (
        e.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      )
    })
    return list.sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
      const sa = statsOf(a)
      const sb = statsOf(b)
      if (sort === 'reviews') return sb.count - sa.count || sb.avg - sa.avg
      return sb.avg - sa.avg || sb.count - sa.count // 'rating'
    })
  }, [entities, query, typeFilter, sort, minRating, reviewedOnly])

  const activeAdvanced = (minRating > 0 ? 1 : 0) + (reviewedOnly ? 1 : 0)

  return {
    filtered,
    filterProps: {
      query, setQuery,
      typeFilter, setTypeFilter,
      sort, setSort,
      minRating, setMinRating,
      reviewedOnly, setReviewedOnly,
      activeAdvanced,
    },
  }
}
