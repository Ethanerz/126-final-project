import React, { useRef, useEffect } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import '../styles/map.css';
import { supabase } from '../supabaseClient';

const Map = ({ onEntitiesLoaded }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const upv = { lng: 122.230924083072, lat: 10.6419865561452 };
  const zoom = 14;

  maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [upv.lng, upv.lat],
      zoom: zoom,
    });

    const addMarkers = async () => {
      const { data: entities, error } = await supabase
        .from('entities')
        .select('id, name, description, latitude, longitude, reviews(rating)');

      if (error) {
        console.error('Error fetching entities:', error.message);
        return;
      }

      if (onEntitiesLoaded) onEntitiesLoaded(entities);

      entities.forEach((entity) => {
        const { id, name, latitude, longitude, reviews } = entity;
        if (latitude == null || longitude == null) return;

        const reviewCount = reviews?.length ?? 0;
        const avgRating = reviewCount > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 0;
        const stars = '★'.repeat(Math.floor(avgRating)) + '☆'.repeat(5 - Math.floor(avgRating));

        const popupHTML = `
          <div class="popUpMarker">
            <strong class="popUpTitle">${name}</strong>
            <div class="popUpStars">${stars}</div>
            <div class="popUpReviews">
              ${avgRating.toFixed(1)} / 5 (${reviewCount} review${reviewCount !== 1 ? 's' : ''})
            </div>
            <a class="popUpLink" href="/rating/${id}">View Reviews</a>
          </div>
        `;

        const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(popupHTML);

        const marker = new maptilersdk.Marker({ color: '#FF0000' })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(mapRef.current);

        marker.getElement().style.cursor = 'pointer';
      });
    };

    if (mapRef.current.loaded?.()) {
      addMarkers();
    } else {
      mapRef.current.on('load', addMarkers);
    }
  }, []);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
};

export default Map;