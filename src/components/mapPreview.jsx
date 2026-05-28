import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Map from './map.jsx';
import Icon from './ui/Icon';
import RatingBadge from './ui/RatingBadge';
import '../styles/map.css';

const MapPreview = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([]);
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

  return (
    <div className="map-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Places</h2>
        </div>
        <div className="sidebar-content-info">
          {entities.map((entity) => {
            const reviewCount = entity.reviews?.length ?? 0;
            const avgRating = reviewCount > 0
              ? entity.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              : 0;
            return (
              <div key={entity.id} className="sidebar-entity-card" onClick={() => flyToMarker(entity)}>
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
          })}
        </div>
      </aside>
      <div className="map-area">
        <button
          type="button"
          className="map-back-btn"
          onClick={() => navigate(-1)}
        >
          <Icon name="arrowLeft" size={16} /> Back
        </button>
        <Map onEntitiesLoaded={setEntities} mapRefExternal={mapRefExternal} markersRef={markersRef} />
      </div>
    </div>
  );
};

export default MapPreview;
