import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../services/googleMaps';
import './GoogleMap.css';

const EMPTY_MARKERS = [];

// Share one API loader between the civic map and the report location picker.
export default function GoogleMap({ center, zoom = 13, focusRequest = 0, mapType = 'street', showLabels = true, markers = EMPTY_MARKERS, onLocationSelect, onMarkerSelect, language = 'en' }) {
  const container = useRef(null);
  const initialView = useRef({ center, zoom });
  const [engine, setEngine] = useState(null);
  const [error, setError] = useState('');
  const lat = Number(center?.lat ?? 13.0827);
  const lng = Number(center?.lng ?? 80.2707);

  useEffect(() => {
    let active = true;
    let map;
    loadGoogleMaps().then((api) => {
      if (!active) return;
      map = new api.Map(container.current, {
        center: initialView.current.center || { lat: 13.0827, lng: 80.2707 },
        zoom: initialView.current.zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
        clickableIcons: false,
      });
      setEngine({ map, api });
    }).catch(() => { if (active) setError('unavailable'); });
    return () => {
      active = false;
      if (map) window.google.maps.event.clearInstanceListeners(map);
    };
  }, []);

  useEffect(() => {
    if (!engine || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    engine.map.panTo({ lat, lng });
    engine.map.setZoom(zoom);
  }, [engine, lat, lng, zoom, focusRequest]);

  useEffect(() => {
    if (!engine) return;
    engine.map.setMapTypeId(mapType === 'satellite' ? (showLabels ? 'hybrid' : 'satellite') : mapType === 'terrain' ? 'terrain' : 'roadmap');
  }, [engine, mapType, showLabels]);

  useEffect(() => {
    if (!engine || !onLocationSelect) return;
    const listener = engine.map.addListener('click', (event) => {
      if (event.latLng) onLocationSelect(event.latLng.toJSON());
    });
    return () => listener.remove();
  }, [engine, onLocationSelect]);

  useEffect(() => {
    if (!engine) return;
    const { api, map } = engine;
    const info = new api.InfoWindow();
    const overlays = [];
    const listeners = [];
    markers.forEach((marker) => {
      const position = { lat: Number(marker.lat), lng: Number(marker.lng) };
      if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return;
      if (marker.density) overlays.push(new api.Circle({ map, center: position, radius: 220, strokeWeight: 0, fillColor: marker.color, fillOpacity: 0.18, clickable: false }));
      const circle = new api.Circle({
        map, center: position, radius: marker.selected ? 48 : 30,
        strokeColor: marker.selected ? '#10231d' : marker.color,
        strokeWeight: marker.selected ? 4 : 2,
        fillColor: marker.color, fillOpacity: 0.9,
      });
      overlays.push(circle);
      listeners.push(circle.addListener('click', () => {
        onMarkerSelect?.(marker);
        const content = document.createElement('div');
        content.className = 'map-popup';
        if (marker.image) {
          const image = document.createElement('img');
          image.src = marker.image;
          image.alt = 'Reported issue';
          content.append(image);
        }
        (marker.lines || [marker.title]).filter(Boolean).forEach((line, index) => {
          const element = document.createElement(index === 0 ? 'strong' : 'span');
          element.textContent = line;
          content.append(element);
        });
        info.setContent(content);
        info.setPosition(position);
        info.open({ map, shouldFocus: false });
      }));
    });
    return () => {
      info.close();
      listeners.forEach((listener) => listener.remove());
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [engine, markers, onMarkerSelect]);

  return <div className="google-map-shell">
    <div ref={container} className="google-map" aria-label={language === 'ta' ? 'கூகுள் நகர வரைபடம்' : 'Google civic map'} />
    {(!engine || error) && <div className="google-map-status" role="status">
      {error
        ? (language === 'ta' ? 'வரைபடத்தை ஏற்ற முடியவில்லை. பின்னர் முயற்சிக்கவும்.' : 'Google Maps could not load. Please try again later.')
        : (language === 'ta' ? 'கூகுள் வரைபடம் ஏற்றப்படுகிறது…' : 'Loading Google Maps…')}
    </div>}
  </div>;
}
