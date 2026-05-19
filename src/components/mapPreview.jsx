import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from './Map';
import '../styles/map.css';

const MapPreview = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState([]);

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
              <div key={entity.id} className="sidebar-entity-card">
                <strong>{entity.name}</strong>
                <div className="sidebar-stars">{stars}</div>
                <div className="sidebar-rating-text">
                  {avgRating.toFixed(1)} / 5 ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                </div>
                <p>{entity.description || 'No description available'}</p>
                <a href={`/rating/${entity.id}`}>View Reviews</a>
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
        <Map onEntitiesLoaded={setEntities} />
      </div>
    </div>
  );
};

export default MapPreview;