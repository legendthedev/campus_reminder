import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatCard } from '../components/AlertBanner';
import { AlertBanner } from '../components/AlertBanner';
import { PunctualityTrendChart, ReminderSplitChart, PlatformDonutChart } from '../components/SurveyChart';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [platforms, setPlatforms] = useState(null);
  const [todayTimetable, setTodayTimetable] = useState([]);
  const [geofence, setGeofence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/punctuality-summary'),
      api.get('/api/analytics/weekly-trend'),
      api.get('/api/analytics/platform-breakdown'),
      api.get('/api/timetable/today'),
      api.get('/api/geofence'),
      api.get('/api/analytics/geofence-stats'),
    ]).then(([s, t, p, tt, gf, gs]) => {
      setStats({ ...s.data, ...gs.data });
      setTrend(t.data);
      setPlatforms(p.data);
      setTodayTimetable(tt.data);
      setGeofence(gf.data?.[0]);
    }).catch(err => {
      setError(err.response?.data?.detail || 'Failed to load dashboard data. Please try again.');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 28 }}>
      {error && <AlertBanner message={error} type="error" />}
      <h2 style={{ marginTop: 0, color: '#1565C0' }}>Overview</h2>

      {!geofence && <AlertBanner message="No active geofence configured. Go to Geofence settings to set up the campus boundary." type="warning" />}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Total reminders today" value={stats?.reminders_today ?? 0} icon="🔔" color="#1565C0" />
        <StatCard label="On-campus reminders" value={stats?.on_campus_reminders ?? 0} icon="✅" color="#43A047" />
        <StatCard label="Off-campus reminders" value={stats?.off_campus_reminders ?? 0} icon="🏃" color="#FB8C00" />
        <StatCard label="Avg punctuality (this week)" value={stats?.avg_punctuality ? stats.avg_punctuality.toFixed(1) + '/5' : '—'} icon="⭐" color="#7B1FA2" />
        <StatCard label="Survey responses" value={stats?.total_responses ?? 0} icon="📋" color="#00897B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <ChartCard title="Punctuality & missed classes trend">
          <PunctualityTrendChart data={trend} />
        </ChartCard>
        <ChartCard title="Platform breakdown">
          <PlatformDonutChart data={platforms} />
          {platforms && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8, fontSize: 13 }}>
              <span>🤖 Android: <b>{platforms.android}</b></span>
              <span>🍎 iOS: <b>{platforms.ios}</b></span>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Today's timetable">
        {todayTimetable.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>No classes scheduled today</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Course', 'Code', 'Time', 'Room', 'Building'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#555', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayTimetable.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={{ padding: '8px 12px' }}>{e.course?.course_name || '—'}</td>
                  <td style={{ padding: '8px 12px' }}><code>{e.course?.course_code}</code></td>
                  <td style={{ padding: '8px 12px' }}>{e.start_time} – {e.end_time}</td>
                  <td style={{ padding: '8px 12px' }}>{e.room_name}</td>
                  <td style={{ padding: '8px 12px' }}>{e.building_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#333' }}>{title}</h3>
      {children}
    </div>
  );
}

function PageLoader() {
  return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading dashboard…</div>;
}
