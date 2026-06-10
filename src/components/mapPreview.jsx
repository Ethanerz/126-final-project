import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Map from './map.jsx';
import ErrorState from './ui/ErrorState';
import Icon from './ui/Icon';
import RatingBadge from './ui/RatingBadge';
import EntityFilters from './ui/EntityFilters';
import { useEntityFilters } from '../hooks/useEntityFilters';
import { usePageTitle } from '../hooks/usePageTitle';
import '../styles/map.css';

const MapPreview = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  // Bumping this key remounts the Map (fresh fetch + markers) on retry.
  const [mapKey, setMapKey] = useState(0);
  const externalMapRef = useRef(null);
  const markersRef = useRef({});

  usePageTitle('Campus map');

  const { filtered, filterProps } = useEntityFilters(entities);

  const retry = () => {
    setEntities([]);
    setLoaded(false);
    setLoadError(false);
    setMapKey((k) => k + 1);
  };

  const flyToMarker = (entity) => {
    const map = externalMapRef.current;
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

  // Keep the map pins in sync with the filtered list — hide the ones filtered out.
  useEffect(() => {
    const visible = new Set(filtered.map((e) => String(e.id)));
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker?.getElement?.();
      if (el) el.style.display = visible.has(String(id)) ? '' : 'none';
    });
  }, [filtered]);

  return (
    <div className="map-page">
      {/* Map fills the page; the list floats over it. */}
      <div className="map-area">
        <Map
          key={mapKey}
          onEntitiesLoaded={(data) => { setEntities(data); setLoaded(true); }}
          onError={() => setLoadError(true)}
          externalMapRef={externalMapRef}
          markersRef={markersRef}
        />
        <div
          className={`map-skeleton rupv-skeleton ${loaded || loadError ? 'map-skeleton--done' : ''}`}
          aria-hidden="true"
        />
      </div>

      {/* Floating top-left controls */}
      <div className="map-controls">
        <button type="button" className="rupv-backbtn" onClick={() => navigate(-1)}>
          <Icon name="arrowLeft" size={16} /> Back
        </button>
        <button
          type="button"
          className="rupv-backbtn"
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
          <EntityFilters {...filterProps} searchPlaceholder="Search places" />
        </div>

        <div className="sidebar-content-info rupv-stagger">
          {loadError ? (
            <ErrorState
              compact
              title="Couldn't load places"
              message="The map data didn't come through. Check your connection and try again."
              onRetry={retry}
            />
          ) : !loaded ? (
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
                <div
                  key={entity.id}
                  className="sidebar-entity-card"
                  style={{ '--i': Math.min(i, 8) }}
                  onClick={() => flyToMarker(entity)}
                >
                  <div className="sidebar-entity-image">
                    {entity.image_link ? (
                      <img src={entity.image_link} alt="" loading="lazy" decoding="async" />
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
                      {/* A real button, so keyboard users can fly to the pin too. */}
                      <button
                        type="button"
                        className="sidebar-entity-name"
                        onClick={(e) => { e.stopPropagation(); flyToMarker(entity); }}
                        aria-label={`Show ${entity.name} on the map`}
                      >
                        {entity.name}
                      </button>
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
