import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import AdminPanel from './AdminPanel'
import Button from './ui/Button'
import Icon from './ui/Icon'
import Pill from './ui/Pill'
import RatingBadge from './ui/RatingBadge'
import '../styles/Dashboard.css'

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'facility', label: 'Facilities' },
  { key: 'service', label: 'Services' },
]

const Dashboard = () => {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [pendingEdit, setPendingEdit] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const { session, userRole, signInAsGuest } = UserAuth()

  const isAdmin = userRole === 'admin'

  async function fetchEntitiesWithRatings() {
    const { data: entitiesData, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .order('name')

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError)
      setLoading(false)
      return
    }

    const entitiesWithRatings = await Promise.all(
      entitiesData.map(async (entity) => {
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('entity_id', entity.id)

        if (reviewsError) return { ...entity, avgRating: 0, reviewCount: 0 }

        const reviewCount = reviews.length
        const avgRating = reviewCount > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 0

        return { ...entity, avgRating: Number(avgRating.toFixed(1)), reviewCount }
      })
    )

    setEntities(entitiesWithRatings)
    setLoading(false)
  }

  // A logged-out visitor browses as the shared read-only guest account.
  useEffect(() => {
    if (session === null) signInAsGuest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    if (session) fetchEntitiesWithRatings()
  }, [session])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entities.filter((e) => {
      if (typeFilter !== 'all' && e.entity_type !== typeFilter) return false
      if (!q) return true
      return (
        e.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      )
    })
  }, [entities, typeFilter, query])

  if (session === undefined || loading) {
    return (
      <div className="rupv-container rupv-browse">
        <div className="rupv-browse-loading">Loading facilities and services…</div>
      </div>
    )
  }

  return (
    <div className="rupv-container rupv-browse">
      {isAdmin && (
        <AdminPanel
          onEntityChange={fetchEntitiesWithRatings}
          pendingEdit={pendingEdit}
          pendingDelete={pendingDelete}
          onConsumed={() => { setPendingEdit(null); setPendingDelete(null) }}
        />
      )}

      <header className="rupv-browse-head">
        <div>
          <h1 className="rupv-h1">Browse campus</h1>
          <p className="rupv-browse-sub">
            Real student reviews of the facilities and services at UP Visayas.
          </p>
        </div>
        <Button variant="ghost" size="md" to="/mappreview">
          <Icon name="map" size={18} /> Campus map
        </Button>
      </header>

      <div className="rupv-browse-toolbar">
        <label className="rupv-search">
          <Icon name="search" size={20} stroke="var(--rupv-fg-3)" />
          <input
            type="search"
            placeholder="Search facilities and services"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
        </label>
        <div className="rupv-filters" role="tablist" aria-label="Filter by type">
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
      </div>

      {filtered.length === 0 ? (
        <div className="rupv-browse-empty">
          <Icon name="building" size={40} stroke="var(--rupv-fg-3)" />
          <p className="rupv-h4">Nothing here yet</p>
          <p className="rupv-body-sm">
            {entities.length === 0
              ? 'No facilities or services have been added yet.'
              : 'No results match your search. Try a different term or filter.'}
          </p>
        </div>
      ) : (
        <div className="rupv-browse-grid">
          {filtered.map((entity) => (
            <article key={entity.id} className="rupv-fcard">
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
                    <img src={entity.image_link} alt="" loading="lazy" />
                  ) : (
                    <div className="rupv-fcard-media-empty" aria-hidden="true">
                      <Icon name="building" size={36} stroke="var(--rupv-slate-soft)" />
                    </div>
                  )}
                  <span className="rupv-fcard-go" aria-hidden="true">
                    <Icon name="arrowUpRight" size={18} stroke="var(--rupv-cream)" />
                  </span>
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
