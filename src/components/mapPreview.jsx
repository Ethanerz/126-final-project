import React from 'react';
import { useNavigate } from 'react-router-dom';
import Map from './map.jsx';
import '../styles/map.css';

const MapPreview = () => {
  const navigate = useNavigate();

  return (
    <div className="map-page">
      <aside className="sidebar">
        <div className="sidebar-content-info"></div>
      </aside>
      <div className="map-area">
        <button
          type="button"
          className="map-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          Back
        </button>
        <Map />
      </div>
    </div>
  );
};

export default MapPreview;
