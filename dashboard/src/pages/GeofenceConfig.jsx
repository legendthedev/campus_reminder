import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function GeofenceConfig() {
  const [geofences, setGeofences] = useState([]);
  const [form, setForm] = useState({ name:'Main Campus', centre_latitude:'6.5244', centre_longitude:'3.3792', radius_metres:500 });
  const [editId, setEditId] = useState(null);
  const [stats, setStats] = useState(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const [g, s] = await Promise.all([api.get('/api/geofence'), api.get('/api/analytics/geofence-stats')]);
    setGeofences(g.data); setStats(s.data);
    if (g.data?.[0]) {
      const gf = g.data[0];
      setForm({ name: gf.name, centre_latitude: String(gf.centre_latitude),
        centre_longitude: String(gf.centre_longitude), radius_metres: gf.radius_metres });
      setEditId(gf.id);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...form, centre_latitude: parseFloat(form.centre_latitude),
      centre_longitude: parseFloat(form.centre_longitude), radius_metres: parseInt(form.radius_metres) };
    if (editId) await api.put(`/api/geofence/${editId}`, payload);
    else await api.post('/api/geofence', payload);
    setSaved(true); setTimeout(() => setSaved(false), 2000); load();
  };

  const mapsUrl = `https://maps.google.com/maps?q=${form.centre_latitude},${form.centre_longitude}&z=16&output=embed`;

  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ margin: '0 0 20px', color: '#1565C0' }}>Geofence configuration</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>
        <div>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Campus geofence settings</h3>
            {[['Campus name','name','text'],['Centre latitude','centre_latitude','number'],['Centre longitude','centre_longitude','number']].map(([label,key,type]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})}
                  style={{ width: '100%', padding: '9px 10px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Radius: {form.radius_metres}m
              </label>
              <input type="range" min={50} max={2000} step={50} value={form.radius_metres}
                onChange={e => setForm({...form, radius_metres: parseInt(e.target.value)})}
                style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa' }}>
                <span>50m</span><span>2000m</span>
              </div>
            </div>
            <button onClick={save} style={{ width: '100%', padding: '11px', background: '#1565C0', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {saved ? '✅ Saved!' : 'Save geofence'}
            </button>
          </div>

          {stats && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Today's stats</h3>
              {[
                ['Total reminders today', stats.reminders_today, '🔔'],
                ['On-campus reminders', stats.on_campus_reminders, '✅'],
                ['Off-campus reminders', stats.off_campus_reminders, '🏃'],
              ].map(([label, val, icon]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
                  <span>{icon} {label}</span>
                  <strong>{val ?? 0}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e0e0e0', fontWeight: 600, fontSize: 14 }}>
            📍 Campus location preview — {form.centre_latitude}, {form.centre_longitude} (radius: {form.radius_metres}m)
          </div>
          <iframe title="Campus map" src={mapsUrl} width="100%" height="480"
            style={{ display: 'block', border: 'none' }} loading="lazy" />
        </div>
      </div>
    </div>
  );
}
