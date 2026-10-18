// Filter/sort toolbar for the entity list — search + type + sort visible, the
// rest under an inline "More" accordion. State + filtering live in the
// useEntityFilters hook (src/hooks); pass its `filterProps` straight in.
import { useState } from 'react'
import Icon from './Icon'

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'facility', label: 'Facilities' },
  { key: 'service', label: 'Services' },
]

const SORTS = [
  { key: 'rating', label: 'Top rated' },
  { key: 'reviews', label: 'Most reviewed' },
  { key: 'name', label: 'A–Z' },
]

const MIN_RATINGS = [
  { value: 0, label: 'Any' },
  { value: 1, label: '1★+' },
  { value: 2, label: '2★+' },
  { value: 3, label: '3★+' },
  { value: 4, label: '4★+' },
  { value: 5, label: '5★' },
]

export default function EntityFilters({
  query, setQuery,
  typeFilter, setTypeFilter,
  sort, setSort,
  minRating, setMinRating,
  reviewedOnly, setReviewedOnly,
  activeAdvanced = 0,
  searchPlaceholder = 'Search',
}) {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className="rupv-filterbar">
      <div className="rupv-filterbar-controls">
        <label className="rupv-search">
          <Icon name="search" size={20} stroke="var(--rupv-fg-3)" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
        </label>

        <div className="rupv-filters" role="group" aria-label="Filter by type">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="rupv-btn rupv-btn--chip rupv-btn--sm"
              data-active={typeFilter === f.key}
              aria-pressed={typeFilter === f.key}
              onClick={() => setTypeFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select className="rupv-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        <button
          type="button"
          className="rupv-btn rupv-btn--chip rupv-btn--sm rupv-more-btn"
          data-active={moreOpen || activeAdvanced > 0}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
        >
          <Icon name="filter" size={15} /> More{activeAdvanced > 0 ? ` (${activeAdvanced})` : ''}
        </button>
      </div>

      {moreOpen && (
        <div className="rupv-filterbar-more">
          <label className="rupv-filter-group">
            <span className="rupv-filter-group-label">Min rating</span>
            <select
              className="rupv-select"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              aria-label="Minimum rating"
            >
              {MIN_RATINGS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>

          <label className="rupv-toggle">
            <input
              type="checkbox"
              checked={reviewedOnly}
              onChange={(e) => setReviewedOnly(e.target.checked)}
            />
            <span>Reviewed only</span>
          </label>
        </div>
      )}
    </div>
  )
}
