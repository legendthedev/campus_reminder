import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUser } from '../services/auth';

export default function Home() {
  const user = getUser();
  const firstName = user?.full_name?.split(' ')[0] ?? 'Student';
  const navigate = useNavigate();

  const [geofence, setGeofence] = useState(null);
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [todayClasses, setTodayClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadTodayClasses = useCallback(async () => {
    setClassLoading(true);
    try {
      const r = await api.get('/api/timetable/today');
      setTodayClasses(r.data);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setClassLoading(false);
    }
  }, []);

  const checkLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const r = await api.post('/api/geofence/check-position', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            platform: 'web',
          });
          setLocation(r.data);
        } catch {
          setOffline(true);
        } finally {
          setLocLoading(false);
        }
      },
      () => setLocLoading(false),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    loadTodayClasses();
    checkLocation();
    api.get('/api/geofence').then(r => setGeofence(r.data?.[0])).catch(() => {});
  }, [loadTodayClasses, checkLocation]);

  const onCampus = location?.is_on_campus;
  const distance = location?.distance_metres?.toFixed(0);
  const hasLoc = location !== null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Welcome header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>
          {greeting()}, {firstName}
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Welcome back to your student portal. Here's your overview for today.
        </p>
      </div>

      {offline && (
        <div style={{
          background: '#1c1700', border: '1px solid #854d0e', color: '#fbbf24',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Offline — showing cached data
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {/* Geofence Status */}
        <div style={{
          background: hasLoc
            ? onCampus ? '#052e16' : '#1c1007'
            : '#1a1a1a',
          border: `1px solid ${hasLoc ? (onCampus ? '#166534' : '#92400e') : '#2a2a2a'}`,
          borderRadius: 12,
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: hasLoc ? (onCampus ? '#22c55e18' : '#f9731618') : '#ffffff08',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hasLoc ? (onCampus ? '#22c55e' : '#f97316') : '#6b7280'} strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <button onClick={checkLocation} style={{
              background: 'transparent', border: 'none', color: '#6b7280', padding: 4,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: hasLoc ? (onCampus ? '#22c55e' : '#f97316') : '#9ca3af' }}>
            {locLoading ? 'Checking...' : hasLoc ? (onCampus ? 'On Campus' : 'Off Campus') : 'Unavailable'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {hasLoc && !onCampus ? `${distance}m away` : geofence?.name ?? 'Location status'}
          </div>
        </div>

        {/* Today's Classes Count */}
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 12,
          padding: '20px',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#22c55e12',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 24, color: '#fff' }}>
            {classLoading ? '...' : todayClasses.length}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            Classes today
          </div>
        </div>

        {/* Survey CTA */}
        <div
          onClick={() => navigate('/survey')}
          style={{
            background: '#0f2d1a',
            border: '1px solid #166534',
            borderRadius: 12,
            padding: '20px',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#22c55e12',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#22c55e' }}>
            Survey
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            Weekly feedback
          </div>
        </div>
      </div>

      {/* Today's Classes */}
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 14,
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Today's Schedule</h3>
            {!classLoading && (
              <span style={{
                background: '#052e16', color: '#22c55e', borderRadius: 6,
                fontSize: 11, fontWeight: 700, padding: '2px 8px', border: '1px solid #166534',
              }}>
                {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'}
              </span>
            )}
          </div>
          <button onClick={loadTodayClasses} style={{
            background: 'transparent', border: '1px solid #2a2a2a', color: '#9ca3af',
            borderRadius: 6, padding: '5px 12px', fontSize: 12,
          }}>
            Refresh
          </button>
        </div>

        {classLoading ? (
          <div style={{ textAlign: 'center', color: '#4b5563', padding: '30px 0' }}>Loading...</div>
        ) : todayClasses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#4b5563', padding: '40px 20px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p>No classes scheduled today</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayClasses.map(entry => (
              <ClassCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClassCard({ entry }) {
  const code = entry.course_code ?? entry.course?.course_code ?? '??';
  const name = entry.course_name ?? entry.course?.course_name ?? 'Unknown';
  return (
    <div style={{
      background: '#111111',
      border: '1px solid #2a2a2a',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: '#22c55e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 12, color: '#000', flexShrink: 0,
      }}>
        {code.substring(0, 3)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{name}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, display: 'flex', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {entry.room_name}, {entry.building_name}
          </span>
        </div>
      </div>
      <span style={{
        background: '#052e16', color: '#22c55e', borderRadius: 6,
        fontSize: 11, fontWeight: 600, padding: '4px 10px', border: '1px solid #166534',
        flexShrink: 0,
      }}>Upcoming</span>
    </div>
  );
}
