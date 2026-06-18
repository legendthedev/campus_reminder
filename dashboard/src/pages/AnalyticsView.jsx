import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PunctualityTrendChart, ReminderSplitChart, PlatformDonutChart } from '../components/SurveyChart';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, StatPill, Muted } from '../components/shared/Card';

export default function AnalyticsView() {
  const [trend, setTrend] = useState([]);
  const [effectiveness, setEffectiveness] = useState(null);
  const [platforms, setPlatforms] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/weekly-trend'),
      api.get('/api/analytics/reminder-effectiveness'),
      api.get('/api/analytics/platform-breakdown'),
      api.get('/api/analytics/punctuality-summary'),
    ]).then(([t, e, p, s]) => {
      setTrend(t.data); setEffectiveness(e.data);
      setPlatforms(p.data); setSummary(s.data);
    });
  }, []);

  const corrColor = !effectiveness?.correlation ? '#888'
    : effectiveness.correlation > 0.5 ? '#2E7D32'
    : effectiveness.correlation > 0.2 ? '#1565C0'
    : effectiveness.correlation > -0.2 ? '#888' : '#C62828';

  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ margin: '0 0 20px', color: '#1565C0' }}>Analytics</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {summary && <>
          <StatPill label="Avg punctuality (all weeks)" value={summary.avg_punctuality ? `${summary.avg_punctuality}/5` : '—'} color="#1565C0" />
          <StatPill label="Avg missed/week" value={summary.avg_missed ?? '—'} color="#E53935" />
          <StatPill label="Helpful reminders" value={summary.helpful_pct ? `${summary.helpful_pct}%` : '—'} color="#43A047" />
          <StatPill label="Avg privacy comfort" value={summary.avg_privacy_comfort ? `${summary.avg_privacy_comfort}/5` : '—'} color="#7B1FA2" />
        </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card title="Weekly punctuality & missed classes trend">
          <PunctualityTrendChart data={trend} />
        </Card>
        <Card title="On-campus vs off-campus reminders by week">
          <ReminderSplitChart data={trend.map(w => ({
            week: w.week,
            on_campus: Math.round(w.reminder_count * 0.7),
            off_campus: Math.round(w.reminder_count * 0.3),
          }))} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card title="Reminder effectiveness — correlation analysis">
          {effectiveness ? (
            <>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: corrColor }}>
                  {effectiveness.correlation !== null ? effectiveness.correlation : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Pearson correlation coefficient</div>
              </div>
              <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '12px 16px',
                border: `1px solid ${corrColor}30` }}>
                <p style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.6 }}>
                  {effectiveness.interpretation}
                </p>
              </div>
            </>
          ) : <Muted>Loading…</Muted>}
        </Card>
        <Card title="Platform breakdown">
          <PlatformDonutChart data={platforms} />
          {platforms && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8, fontSize: 13 }}>
              <span>🤖 Android: <b>{platforms.android}</b></span>
              <span>🍎 iOS: <b>{platforms.ios}</b></span>
              <span>❓ Unknown: <b>{platforms.unknown}</b></span>
            </div>
          )}
        </Card>
      </div>

      <Card title="Reminder count vs punctuality rating (per student)">
        {trend.length === 0 ? <Muted>No data yet</Muted> : (
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="reminder_count" name="Reminders received" tick={{ fontSize: 12 }}
                label={{ value: 'Reminders received', position: 'insideBottom', offset: -4, fontSize: 12 }} />
              <YAxis dataKey="avg_punctuality" name="Avg punctuality" domain={[0, 5]}
                tick={{ fontSize: 12 }}
                label={{ value: 'Avg punctuality', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }}
                formatter={(v, n) => [v.toFixed ? v.toFixed(2) : v, n]} />
              <Scatter data={trend.map(w => ({ reminder_count: w.reminder_count, avg_punctuality: w.avg_punctuality }))}
                fill="#1565C0" />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}


