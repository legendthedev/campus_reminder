import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px #22c55e44"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: '',
});

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 16, { duration: 1 }); }, [center, map]);
  return null;
}

export default function MapView() {
  const [geofence, setGeofence] = useState(null);
  const [position, setPosition] = useState(null);
  const [locationStatus, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const defaultCenter = [6.5244, 3.3792];

  useEffect(() => {
    api.get('/api/geofence').then(r => setGeofence(r.data?.[0])).catch(() => {});
  }, []);

  const checkPosition = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        setPosition(latlng);
        try {
          const r = await api.post('/api/geofence/check-position', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            platform: 'web',
          });
          setStatus(r.data);
        } catch {}
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const center = geofence
    ? [parseFloat(geofence.centre_latitude), parseFloat(geofence.centre_longitude)]
    : defaultCenter;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
      {/* Status bar */}
      <div style={{
        padding: '14px 20px',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderBottom: '1px solid #2a2a2a',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          {locationStatus ? (
            <div>
              <span style={{
                fontWeight: 700,
                color: locationStatus.is_on_campus ? '#22c55e' : '#f97316',
                fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {locationStatus.is_on_campus ? 'On campus' : `Off campus \u2014 ${locationStatus.distance_metres?.toFixed(0)}m away`}
              </span>
              {geofence && (
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>
                  {geofence.name} \u00b7 {geofence.radius_metres}m boundary
                </div>
              )}
            </div>
          ) : (
            <span style={{ color: '#6b7280', fontSize: 13 }}>
              {geofence ? `${geofence.name}` : 'Tap "Locate me" to check your position'}
            </span>
          )}
        </div>
        <button onClick={checkPosition} disabled={loading} className="btn-green" style={{
          padding: '8px 18px', fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
          {loading ? 'Locating...' : 'Locate me'}
        </button>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%', background: '#111111' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {geofence && (
            <Circle
              center={[parseFloat(geofence.centre_latitude), parseFloat(geofence.centre_longitude)]}
              radius={parseInt(geofence.radius_metres)}
              pathOptions={{
                color: '#22c55e',
                fillColor: '#22c55e',
                fillOpacity: 0.08,
                weight: 2,
              }}
            >
              <Popup>
                <b style={{ color: '#000' }}>{geofence.name}</b><br />
                Radius: {geofence.radius_metres}m
              </Popup>
            </Circle>
          )}

          {position && (
            <Marker position={position} icon={userIcon}>
              <Popup>
                <b style={{ color: '#000' }}>Your location</b>
                {locationStatus && (
                  <div style={{ fontSize: 12, marginTop: 4, color: '#333' }}>
                    {locationStatus.is_on_campus ? 'On campus' : `${locationStatus.distance_metres?.toFixed(0)}m from campus`}
                  </div>
                )}
              </Popup>
            </Marker>
          )}

          {position && <FlyTo center={position} />}
        </MapContainer>
      </div>
    </div>
  );
}
