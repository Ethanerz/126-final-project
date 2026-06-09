import { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Map from './map.jsx';
import Icon from './ui/Icon';
import RatingBadge from './ui/RatingBadge';
import '../styles/map.css';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'facility', label: 'Facilities' },
  { key: 'service', label: 'Services' },
];

const MapPreview = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const mapRefExternal = useRef(null);
  const markersRef = useRef({});

  const flyToMarker = (entity) => {
    const map = mapRefExternal.current;
    if (!map) return;

    // Fly to the marker
    map.flyTo({
      center: [entity.longitude, entity.latitude],
      zoom: 18,
      speed: 1.2,
      curve: 1.2,
    });

    // Open popup after fly animation (~1.2s)
    setTimeout(() => {
      const marker = markersRef.current[entity.id];
      if (marker && !marker.getPopup().isOpen()) {
        marker.togglePopup();
      }
    }, 1200);
  };

  // Filter the list the same way the Browse page does (search + type).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entities.filter((e) => {
      if (typeFilter !== 'all' && e.entity_type !== typeFilter) return false;
      if (!q) return true;
      return (
        e.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    });
  }, [entities, query, typeFilter]);

  return (
    <div className="map-page">
      {/* Map fills the page; the list floats over it. */}
      <div className="map-area">
        <Map
          onEntitiesLoaded={(data) => { setEntities(data); setLoaded(true); }}
          mapRefExternal={mapRefExternal}
          markersRef={markersRef}
        />
        <div
          className={`map-skeleton rupv-skeleton ${loaded ? 'map-skeleton--done' : ''}`}
          aria-hidden="true"
        />
      </div>

      {/* Floating top-left controls */}
      <div className="map-controls">
        <button type="button" className="map-back-btn" onClick={() => navigate(-1)}>
          <Icon name="arrowLeft" size={16} /> Back
        </button>
        <button
          type="button"
          className="map-toggle-btn"
          onClick={() => setListOpen((o) => !o)}
          aria-pressed={listOpen}
        >
          <Icon name={listOpen ? 'close' : 'filter'} size={16} />
          {listOpen ? 'Hide list' : 'Show list'}
        </button>
      </div>

      {/* Floating places panel, overlaid on the map */}
      <aside className={`sidebar ${listOpen ? '' : 'sidebar--collapsed'}`} aria-hidden={!listOpen} inert={!listOpen}>
        <div className="sidebar-toolbar">
          <label className="rupv-search">
            <Icon name="search" size={20} stroke="var(--rupv-fg-3)" />
            <input
              type="search"
              placeholder="Search places"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search places"
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

        <div className="sidebar-content-info rupv-stagger">
          {!loaded ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="sidebar-entity-card sidebar-entity-card--skeleton"
                style={{ '--i': i }}
                aria-hidden="true"
              >
                <div className="rupv-skeleton sidebar-skel-image" />
                <div className="sidebar-entity-head">
                  <div className="rupv-skeleton sidebar-skel-badge" />
                  <div className="sidebar-entity-headings">
                    <div className="rupv-skeleton sidebar-skel-name" />
                    <div className="rupv-skeleton sidebar-skel-meta" />
                  </div>
                </div>
                <div className="rupv-skeleton sidebar-skel-line" />
                <div className="rupv-skeleton sidebar-skel-line sidebar-skel-line--sm" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="sidebar-empty">
              <Icon name="building" size={32} stroke="var(--rupv-fg-3)" />
              <p className="rupv-body-sm">No places match your search.</p>
            </div>
          ) : (
            filtered.map((entity, i) => {
              const reviewCount = entity.reviews?.length ?? 0;
              const avgRating = reviewCount > 0
                ? entity.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
                : 0;
              return (
                <div key={entity.id} className="sidebar-entity-card" style={{ '--i': Math.min(i, 8) }} onClick={() => flyToMarker(entity)}>
                  <div className="sidebar-entity-image">
                    {entity.image_link ? (
                      <img src={entity.image_link} alt={entity.name} />
                    ) : (
                      <div className="sidebar-image-placeholder">
                        <Icon name="building" size={32} stroke="var(--rupv-slate-soft)" />
                      </div>
                    )}
                  </div>
                  <div className="sidebar-entity-head">
                    <RatingBadge
                      value={reviewCount > 0 ? avgRating : null}
                      count={reviewCount}
                      size="sm"
                    />
                    <div className="sidebar-entity-headings">
                      <strong className="sidebar-entity-name">{entity.name}</strong>
                      <span className="sidebar-entity-meta">
                        {reviewCount === 0
                          ? 'No reviews yet'
                          : `${reviewCount} review${reviewCount !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                  {entity.description && (
                    <p className="sidebar-entity-desc">{entity.description}</p>
                  )}
                  <Link
                    className="sidebar-entity-link"
                    to={`/rating/${entity.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View reviews <Icon name="arrowUpRight" size={15} />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};

export default MapPreview;
