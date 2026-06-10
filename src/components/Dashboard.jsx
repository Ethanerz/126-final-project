import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import AdminPanel from './AdminPanel'
import Button from './ui/Button'
import ErrorState from './ui/ErrorState'
import Icon from './ui/Icon'
import Pill from './ui/Pill'
import RatingBadge from './ui/RatingBadge'
import EntityFilters from './ui/EntityFilters'
import { useEntityFilters } from '../hooks/useEntityFilters'
import { usePageTitle } from '../hooks/usePageTitle'
import '../styles/Dashboard.css'

// One request: entities with their review ratings embedded (no N+1).
async function fetchEntitiesWithRatings() {
  const { data, error } = await supabase
    .from('entities')
    .select('*, reviews(rating)')
    .order('name')
  if (error) throw error
  return (data ?? []).map(({ reviews, ...entity }) => {
    const reviewCount = reviews?.length ?? 0
    const avgRating = reviewCount > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : 0
    return { ...entity, avgRating, reviewCount }
  })
}

const Dashboard = () => {
  // null = not loaded yet (skeleton); [] = loaded, empty.
  const [entities, setEntities] = useState(null)
  const [error, setError] = useState(null)
  const [pendingEdit, setPendingEdit] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const { userRole } = UserAuth()

  usePageTitle('Browse campus')

  const isAdmin = userRole === 'admin'

  // Public data — fetched immediately, signed in or not (anon RLS read).
  useEffect(() => {
    let cancelled = false
    fetchEntitiesWithRatings()
      .then((list) => { if (!cancelled) setEntities(list) })
      .catch((err) => {
        console.error('Error fetching entities:', err)
        if (!cancelled) setError(err)
      })
    return () => { cancelled = true }
  }, [])

  const retry = () => {
    setError(null)
    setEntities(null)
    fetchEntitiesWithRatings()
      .then(setEntities)
      .catch((err) => {
        console.error('Error fetching entities:', err)
        setError(err)
      })
  }

  // Silent refresh after admin add/edit/delete — keeps current data visible.
  const refresh = () => {
    fetchEntitiesWithRatings()
      .then(setEntities)
      .catch((err) => console.error('Error refreshing entities:', err))
  }

  const loading = entities === null && !error

  const { filtered, filterProps } = useEntityFilters(entities ?? [])

  const stats = useMemo(() => {
    const list = entities ?? []
    const places = list.length
    const totalReviews = list.reduce((sum, e) => sum + (e.reviewCount || 0), 0)
    const rated = list.filter((e) => e.reviewCount > 0)
    const avg = rated.length
      ? rated.reduce((sum, e) => sum + e.avgRating, 0) / rated.length
      : 0
    return { places, totalReviews, avg }
  }, [entities])

  if (loading) {
    return (
      <div className="rupv-container rupv-browse" aria-busy="true">
        {/* Hero band — mirrors the real hero so content loads in place */}
        <section className="rupv-hero rupv-hero--skeleton" aria-hidden="true">
          <div className="rupv-hero-content">
            <div className="rupv-skeleton rupv-skel-eyebrow" />
            <div className="rupv-skeleton rupv-skel-title" />
            <div className="rupv-skeleton rupv-skel-sub" />
            <div className="rupv-skeleton rupv-skel-sub rupv-skel-sub--short" />
            <div className="rupv-skeleton rupv-skel-btn" />
          </div>
          <div className="rupv-hero-stats">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rupv-hero-stat">
                <div className="rupv-skeleton rupv-skel-stat-num" />
                <div className="rupv-skeleton rupv-skel-stat-label" />
              </div>
            ))}
          </div>
        </section>

        {/* Toolbar — search field + filter chips */}
        <div className="rupv-browse-toolbar" aria-hidden="true">
          <div className="rupv-skeleton rupv-skel-search" />
          <div className="rupv-filters">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rupv-skeleton rupv-skel-chip" />
            ))}
          </div>
        </div>

        {/* Card grid */}
        <div className="rupv-browse-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="rupv-fcard rupv-fcard--skeleton">
              <div className="rupv-skeleton rupv-skel-media" />
              <div className="rupv-fcard-body">
                <div className="rupv-fcard-head">
                  <div className="rupv-skeleton rupv-skel-badge" />
                  <div className="rupv-skeleton rupv-skel-line" />
                </div>
                <div className="rupv-skeleton rupv-skel-line rupv-skel-line--sm" />
              </div>
            </article>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rupv-container rupv-browse">
        <ErrorState
          title="Couldn't load campus places"
          message="The list didn't come through. Check your connection and try again."
          onRetry={retry}
        />
      </div>
    )
  }

  return (
    <div className="rupv-container rupv-browse">
      {isAdmin && (
        <AdminPanel
          onEntityChange={refresh}
          pendingEdit={pendingEdit}
          pendingDelete={pendingDelete}
          onConsumed={() => { setPendingEdit(null); setPendingDelete(null) }}
        />
      )}

      <section className="rupv-hero">
        <div className="rupv-hero-content">
          <p className="rupv-hero-eyebrow">UP Visayas · Student Reviews</p>
          <h1 className="rupv-hero-title">Browse campus</h1>
          <p className="rupv-hero-sub">
            Real student reviews of the facilities and services at UP Visayas —
            find the best spots, dodge the worst.
          </p>
          <div className="rupv-hero-actions">
            <Button variant="onDark" size="md" to="/mappreview">
              <Icon name="map" size={18} /> Campus map
            </Button>
          </div>
        </div>
        <div className="rupv-hero-stats">
          <div className="rupv-hero-stat">
            <span className="rupv-hero-stat-num">{stats.places}</span>
            <span className="rupv-hero-stat-label">Places</span>
          </div>
          <div className="rupv-hero-stat">
            <span className="rupv-hero-stat-num">{stats.totalReviews}</span>
            <span className="rupv-hero-stat-label">Reviews</span>
          </div>
          <div className="rupv-hero-stat">
            <span className="rupv-hero-stat-num">{stats.avg ? stats.avg.toFixed(1) : '—'}</span>
            <span className="rupv-hero-stat-label">Avg rating</span>
          </div>
        </div>
      </section>

      <div className="rupv-browse-toolbar">
        <EntityFilters {...filterProps} searchPlaceholder="Search facilities and services" />
      </div>

      {filtered.length === 0 ? (
        <div className="rupv-browse-empty">
          <Icon name="building" size={40} stroke="var(--rupv-fg-3)" />
          <p className="rupv-h4">Nothing here yet</p>
          <p className="rupv-body-sm">
            {(entities ?? []).length === 0
              ? 'No facilities or services have been added yet.'
              : 'No results match your search. Try a different term or filter.'}
          </p>
        </div>
      ) : (
        <div className="rupv-browse-grid rupv-stagger">
          {filtered.map((entity, i) => (
            <article key={entity.id} className="rupv-fcard" data-type={entity.entity_type} style={{ '--i': i }}>
              {isAdmin && (
                <div className="rupv-fcard-admin">
                  <button
                    type="button"
                    className="rupv-fcard-iconbtn"
                    aria-label={`Edit ${entity.name}`}
                    onClick={() => setPendingEdit(entity)}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    type="button"
                    className="rupv-fcard-iconbtn rupv-fcard-iconbtn--danger"
                    aria-label={`Delete ${entity.name}`}
                    onClick={() => setPendingDelete(entity)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              )}

              <Link className="rupv-fcard-link" to={`/rating/${entity.id}`}>
                <div className="rupv-fcard-media">
                  {entity.image_link ? (
                    <img src={entity.image_link} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <div className="rupv-fcard-media-empty" aria-hidden="true">
                      <Icon name="building" size={36} stroke="var(--rupv-slate-soft)" />
                    </div>
                  )}
                </div>

                <div className="rupv-fcard-body">
                  <div className="rupv-fcard-head">
                    <RatingBadge value={entity.avgRating} count={entity.reviewCount} size="sm" />
                    <div className="rupv-fcard-headings">
                      <h3 className="rupv-fcard-name">{entity.name}</h3>
                      <p className="rupv-fcard-meta">
                        {entity.reviewCount === 0
                          ? 'No reviews yet'
                          : `${entity.reviewCount} review${entity.reviewCount === 1 ? '' : 's'}`}
                      </p>
                    </div>
                  </div>

                  {entity.description && (
                    <p className="rupv-fcard-desc">{entity.description}</p>
                  )}

                  <div className="rupv-fcard-tags">
                    <Pill>{entity.entity_type === 'service' ? 'Service' : 'Facility'}</Pill>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
