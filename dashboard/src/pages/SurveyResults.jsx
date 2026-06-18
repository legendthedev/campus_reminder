import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Q1DistributionChart, Q3PieChart, Q4PreferenceChart, Q5ComfortChart } from '../components/SurveyChart';

export default function SurveyResults() {
  const [allResponses, setAllResponses] = useState([]);
  const [students, setStudents] = useState([]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [maxWeek, setMaxWeek] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/api/survey/responses'), api.get('/api/students'), api.get('/api/survey/current-week')])
      .then(([r, s, w]) => {
        setAllResponses(r.data); setStudents(s.data);
        setMaxWeek(w.data.week_number); setWeekNumber(w.data.week_number);
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load survey data.'));
  }, []);

  const weekResponses = allResponses.filter(r => r.survey_week === weekNumber);
  const respondentIds = new Set(weekResponses.map(r => r.student_id));
  const nonRespondents = students.filter(s => !respondentIds.has(s.id));
  const responseRate = students.length ? Math.round((weekResponses.length / students.length) * 100) : 0;

  const avgQ1 = weekResponses.length ? (weekResponses.reduce((a, r) => a + r.q1_punctuality_rating, 0) / weekResponses.length).toFixed(2) : '—';
  const totalMissed = weekResponses.reduce((a, r) => a + r.q2_missed_classes, 0);
  const avgMissed = weekResponses.length ? (totalMissed / weekResponses.length).toFixed(1) : '—';
  const openFeedback = weekResponses.filter(r => r.q6_open_feedback);

  const exportCsv = () => {
    const headers = ['student_id','week','q1','q2','q3','q4','q5','q6'];
    const rows = weekResponses.map(r =>
      [r.student_id, r.survey_week, r.q1_punctuality_rating, r.q2_missed_classes,
       r.q3_reminder_helpful, r.q4_location_preference, r.q5_privacy_comfort,
       `"${r.q6_open_feedback || ''}"`].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `survey_week_${weekNumber}.csv`; a.click();
  };

  const sendReminder = async (studentId) => {
    try {
      await api.post('/api/notifications/broadcast', {
        title: 'Survey reminder', body: 'Please complete your weekly survey — it only takes 2 minutes.',
        target: 'all',
      });
      alert('Reminder sent');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reminder.');
    }
  };

  const weekOptions = Array.from({ length: maxWeek }, (_, i) => i + 1);

  return (
    <div style={{ padding: 28 }}>
      {error && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#1565C0' }}>Survey results</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={weekNumber} onChange={e => setWeekNumber(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}>
            {weekOptions.map(w => <option key={w} value={w}>Week {w}</option>)}
          </select>
          <button onClick={exportCsv} style={btn('#43A047')}>⬇ Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <StatPill label="Response rate" value={`${responseRate}%`} color="#1565C0" />
        <StatPill label="Responses" value={`${weekResponses.length} / ${students.length}`} color="#43A047" />
        <StatPill label="Avg punctuality" value={`${avgQ1}/5`} color="#7B1FA2" />
        <StatPill label="Avg missed classes" value={avgMissed} color="#E53935" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card title="Q1 — Punctuality rating distribution">
          <Q1DistributionChart responses={weekResponses} />
        </Card>
        <Card title="Q2 — Missed classes">
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#E53935' }}>{totalMissed}</div>
            <div style={{ color: '#888', fontSize: 14 }}>total missed classes this week</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#555', marginTop: 12 }}>{avgMissed} avg per student</div>
          </div>
        </Card>
        <Card title="Q3 — Did reminders help?">
          <Q3PieChart responses={weekResponses} />
        </Card>
        <Card title="Q4 — Reminder preference">
          <Q4PreferenceChart responses={weekResponses} />
        </Card>
      </div>

      <Card title="Q5 — Privacy comfort with GPS tracking" style={{ marginBottom: 20 }}>
        <Q5ComfortChart responses={weekResponses} />
      </Card>

      {openFeedback.length > 0 && (
        <Card title="Q6 — Open feedback" style={{ marginBottom: 20 }}>
          {openFeedback.map(r => (
            <div key={r.id} style={{ background: '#f9f9f9', borderLeft: '3px solid #1565C0',
              padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: 10, fontStyle: 'italic', fontSize: 14 }}>
              "{r.q6_open_feedback}"
            </div>
          ))}
        </Card>
      )}

      {nonRespondents.length > 0 && (
        <Card title={`Non-respondents this week (${nonRespondents.length})`}>
          {nonRespondents.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
              <span><b>{s.full_name}</b> <span style={{ color: '#888' }}>{s.email}</span></span>
              <button onClick={() => sendReminder(s.id)} style={btn('#1565C0', true)}>Send reminder</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

const Card = ({ title, children, style }) => (
  <div style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:12, padding:20, ...style }}>
    <h3 style={{ margin:'0 0 16px', fontSize:15, color:'#333' }}>{title}</h3>
    {children}
  </div>
);

const StatPill = ({ label, value, color }) => (
  <div style={{ background:'#fff', border:'1px solid #e0e0e0', borderRadius:10, padding:'14px 20px', flex:1 }}>
    <div style={{ fontSize:11, color:'#888', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color }}>{value}</div>
  </div>
);

const btn = (bg, small) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', padding: small ? '5px 12px' : '9px 18px', fontWeight: 600, fontSize: small ? 12 : 14 });
