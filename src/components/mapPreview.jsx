import React from 'react';
import { useNavigate } from 'react-router-dom';
import Map from './map.jsx';
import '../styles/map.css';

const MapPreview = () => {
  const navigate = useNavigate();

  return (
    <div className="map-page">
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
  );
};

export default MapPreview;
