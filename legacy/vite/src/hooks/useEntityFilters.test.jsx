import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEntityFilters } from './useEntityFilters'

// Dashboard shape: pre-computed avgRating/reviewCount.
const dash = (id, name, type, avg, count, description = '') => ({
  id, name, entity_type: type, avgRating: avg, reviewCount: count, description,
})

// Map shape: raw reviews array.
const raw = (id, name, type, ratings = []) => ({
  id, name, entity_type: type, reviews: ratings.map((rating) => ({ rating })),
})

const FIXTURES = [
  dash(1, 'Main Library', 'facility', 4.5, 10, 'Quiet study spots'),
  dash(2, 'Cafeteria', 'facility', 2.0, 4, 'Cheap meals'),
  dash(3, 'Registrar', 'service', 3.0, 1, 'Enrollment documents'),
  dash(4, 'Clinic', 'service', 0, 0, 'Campus health services'),
  dash(5, 'Gym', 'facility', 5.0, 2, 'Weights and courts'),
]

describe('useEntityFilters', () => {
  it('returns everything by default, sorted by rating then review count', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    expect(result.current.filtered.map((e) => e.id)).toEqual([5, 1, 3, 2, 4])
  })

  it('handles an empty list', () => {
    const { result } = renderHook(() => useEntityFilters([]))
    expect(result.current.filtered).toEqual([])
  })

  it('handles a single item', () => {
    const { result } = renderHook(() => useEntityFilters([FIXTURES[0]]))
    expect(result.current.filtered).toHaveLength(1)
  })

  it('handles 1000+ items without blowing up', () => {
    const big = Array.from({ length: 1500 }, (_, i) =>
      dash(i, `Place ${i}`, i % 2 ? 'facility' : 'service', (i % 50) / 10, i % 7)
    )
    const { result } = renderHook(() => useEntityFilters(big))
    expect(result.current.filtered).toHaveLength(1500)
  })

  it('searches name and description, case-insensitively', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    act(() => result.current.filterProps.setQuery('LIBRARY'))
    expect(result.current.filtered.map((e) => e.id)).toEqual([1])
    act(() => result.current.filterProps.setQuery('meals'))
    expect(result.current.filtered.map((e) => e.id)).toEqual([2])
  })

  it('ignores surrounding whitespace in the query', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    act(() => result.current.filterProps.setQuery('   gym   '))
    expect(result.current.filtered.map((e) => e.id)).toEqual([5])
  })

  it('matches unicode and emoji names', () => {
    const items = [dash(1, 'Café Niño ☕', 'facility', 4, 1)]
    const { result } = renderHook(() => useEntityFilters(items))
    act(() => result.current.filterProps.setQuery('café'))
    expect(result.current.filtered).toHaveLength(1)
    act(() => result.current.filterProps.setQuery('☕'))
    expect(result.current.filtered).toHaveLength(1)
  })

  it('survives entities with null/missing name and description', () => {
    const items = [
      { id: 1, name: null, entity_type: 'facility', avgRating: 1, reviewCount: 1 },
      { id: 2, entity_type: 'service', avgRating: 2, reviewCount: 1 },
    ]
    const { result } = renderHook(() => useEntityFilters(items))
    expect(result.current.filtered).toHaveLength(2)
    act(() => result.current.filterProps.setQuery('x'))
    expect(result.current.filtered).toHaveLength(0)
    act(() => result.current.filterProps.setQuery(''))
    act(() => result.current.filterProps.setSort('name'))
    expect(result.current.filtered).toHaveLength(2) // localeCompare on '' must not throw
  })

  it('filters by type', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    act(() => result.current.filterProps.setTypeFilter('service'))
    expect(result.current.filtered.map((e) => e.id).sort()).toEqual([3, 4])
  })

  it('min rating is inclusive at the boundary', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    act(() => result.current.filterProps.setMinRating(3))
    // avg exactly 3.0 (Registrar) must be included
    expect(result.current.filtered.map((e) => e.id)).toEqual([5, 1, 3])
  })

  it('reviewedOnly hides zero-review entities', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    act(() => result.current.filterProps.setReviewedOnly(true))
    expect(result.current.filtered.map((e) => e.id)).not.toContain(4)
  })

  it('sorts by review count with rating tiebreak', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    act(() => result.current.filterProps.setSort('reviews'))
    expect(result.current.filtered.map((e) => e.id)).toEqual([1, 2, 5, 3, 4])
  })

  it('sorts A–Z', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    act(() => result.current.filterProps.setSort('name'))
    expect(result.current.filtered.map((e) => e.name)).toEqual(
      ['Cafeteria', 'Clinic', 'Gym', 'Main Library', 'Registrar']
    )
  })

  it('computes stats from the raw reviews shape (map page) identically', () => {
    const items = [
      raw(1, 'A', 'facility', [5, 5]),       // avg 5, count 2
      raw(2, 'B', 'facility', [1]),          // avg 1, count 1
      raw(3, 'C', 'service', []),            // unrated
    ]
    const { result } = renderHook(() => useEntityFilters(items))
    expect(result.current.filtered.map((e) => e.id)).toEqual([1, 2, 3])
    act(() => result.current.filterProps.setMinRating(4))
    expect(result.current.filtered.map((e) => e.id)).toEqual([1])
  })

  it('counts active advanced filters', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    expect(result.current.filterProps.activeAdvanced).toBe(0)
    act(() => result.current.filterProps.setMinRating(2))
    act(() => result.current.filterProps.setReviewedOnly(true))
    expect(result.current.filterProps.activeAdvanced).toBe(2)
  })

  it('stacks search + type + rating filters', () => {
    const { result } = renderHook(() => useEntityFilters(FIXTURES))
    act(() => {
      result.current.filterProps.setTypeFilter('facility')
      result.current.filterProps.setMinRating(4)
      result.current.filterProps.setQuery('library')
    })
    expect(result.current.filtered.map((e) => e.id)).toEqual([1])
  })
})
