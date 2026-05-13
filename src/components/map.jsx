import React, { useRef, useEffect } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import '../styles/map.css';
import { supabase } from '../supabaseClient'; // adjust path if needed

const Map = () => {
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
      .select('latitude, longitude');

    if (error) {
      console.error('Error fetching entities:', error.message);
      return;
    }

    console.log('Fetched entities:', entities); // confirm data is arriving

    entities.forEach(({ latitude, longitude }) => {
      if (latitude == null || longitude == null) return;

      new maptilersdk.Marker({ color: '#FF0000' })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);
    });
  };
  if (mapRef.current.loaded && typeof mapRef.current.loaded === 'function' ? mapRef.current.loaded() : false) {
    addMarkers(); // map already ready
  } else {
    mapRef.current.on && mapRef.current.on('load', addMarkers); // wait for it
  }
}, []);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}

export default Map