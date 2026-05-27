import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from './map.jsx';
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
            const stars = '★'.repeat(Math.floor(avgRating)) + '☆'.repeat(5 - Math.floor(avgRating));

            return (
              <div
                key={entity.id}
                className="sidebar-entity-card"
                onClick={() => flyToMarker(entity)}
              >
                <strong>{entity.name}</strong>
                <div className="sidebar-stars">{stars}</div>
                <div className="sidebar-rating-text">
                  {avgRating.toFixed(1)} / 5 ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                </div>
                <p>{entity.description || 'No description available'}</p>
                <a
                  href={`/rating/${entity.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  View Reviews
                </a>
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
          Back
        </button>
        <Map
          onEntitiesLoaded={setEntities}
          mapRefExternal={mapRefExternal}
          markersRef={markersRef}
        />
      </div>
    </div>
  );
};

export default MapPreview;