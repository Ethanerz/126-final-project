import React, { useRef, useEffect } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import '../styles/map.css';
import { supabase } from '../supabaseClient';

// Popups are injected as raw HTML, so escape any entity-supplied text.
const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

const Map = ({ onEntitiesLoaded, mapRefExternal, markersRef }) => {
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

    // Share map instance with parent
    if (mapRefExternal) mapRefExternal.current = mapRef.current;

    const addMarkers = async () => {
      const { data: entities, error } = await supabase
        .from('entities')
        .select('id, name, description, image_link, latitude, longitude, reviews(rating)');

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
        const ratingNum = reviewCount > 0 ? avgRating.toFixed(1) : '—';
        const metaText = reviewCount > 0
          ? `${reviewCount} review${reviewCount !== 1 ? 's' : ''}`
          : 'No reviews yet';

        const popupHTML = `
          <div class="popUpMarker">
            <strong class="popUpTitle">${escapeHtml(name)}</strong>
            <div class="popUpRating">
              <span class="popUpBadge">${ratingNum}</span>
              <span class="popUpMeta">${metaText}</span>
            </div>
            <a class="popUpLink" href="/rating/${id}">View reviews</a>
          </div>
        `;

        const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(popupHTML);

        const marker = new maptilersdk.Marker({ color: '#A31F33' })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(mapRef.current);

        marker.getElement().style.cursor = 'pointer';

        // Store marker by entity id so parent can access it
        if (markersRef) markersRef.current[id] = marker;
      });
    };

    // The SDK's projection migration can throw inside its internal 'load'
    // sequence, which means the 'load' event may never fire. Markers are
    // positioned overlays that tolerate a still-loading map, so add them
    // directly instead of gating on 'load' (same approach as EntityMiniMap).
    addMarkers();
  }, []);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
};

export default Map;