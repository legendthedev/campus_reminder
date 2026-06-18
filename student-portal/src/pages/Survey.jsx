import React, { useEffect, useState } from 'react';
import api from '../services/api';

const LOCATION_OPTIONS = [
  { value: 'on_campus_only', label: 'On campus only', desc: 'Only remind me when I\'m near campus' },
  { value: 'always', label: 'Always', desc: 'Remind me regardless of location' },
  { value: 'never', label: 'Never', desc: 'Do not send reminders' },
];

export default function Survey() {
  const [weekInfo, setWeekInfo] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(null);
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState(3);
  const [q6, setQ6] = useState('');

  useEffect(() => {
    api.get('/api/survey/current-week')
      .then(r => {
        setWeekInfo(r.data);
        setSubmitted(r.data.has_submitted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (!q4) { setError('Please select a reminder preference.'); return; }
    if (q3 === null) { setError('Please answer question 3.'); return; }
    setSending(true);
    setError('');
    try {
      await api.post('/api/survey/submit', {
        q1_punctuality_rating: q1,
        q2_missed_classes: q2,
        q3_reminder_helpful: q3,
        q4_location_preference: q4,
        q5_privacy_comfort: q5,
        q6_open_feedback: q6 || null,
      });
      setSuccess(true);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', color: '#4b5563', padding: '60px 0' }}>Loading...</div>
  );

  if (success || submitted) return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: '#052e16',
        border: '2px solid #166534', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={{ color: '#22c55e', marginBottom: 8, fontSize: 20, fontWeight: 700 }}>
        {success ? 'Survey Submitted!' : 'Already Submitted'}
      </h2>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        {success
          ? 'Thank you for your feedback this week.'
          : `You already submitted the week ${weekInfo?.week_number} survey.`}
      </p>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {weekInfo && (
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
          padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>
            Week {weekInfo.week_number} &middot; {weekInfo.week_start_date} \u2013 {weekInfo.week_end_date}
          </span>
        </div>
      )}

      <form onSubmit={submit}>
        {/* Q1 */}
        <Section num={1} title="How punctual were you this week?" subtitle="1 = very late \u00b7 5 = always on time">
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(v => (
              <button key={v} type="button" onClick={() => setQ1(v)} style={{
                flex: 1, height: 44, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 16,
                background: q1 === v ? '#22c55e' : '#111111',
                color: q1 === v ? '#000' : '#9ca3af',
                transition: 'all 0.15s',
              }}>{v}</button>
            ))}
          </div>
        </Section>

        {/* Q2 */}
        <Section num={2} title="How many classes did you miss this week?">
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2, 3, 4, 5].map(v => (
              <button key={v} type="button" onClick={() => setQ2(v)} style={{
                flex: 1, height: 42, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14,
                background: q2 === v ? '#22c55e' : '#111111',
                color: q2 === v ? '#000' : '#9ca3af',
                transition: 'all 0.15s',
              }}>{v}{v === 5 ? '+' : ''}</button>
            ))}
          </div>
        </Section>

        {/* Q3 */}
        <Section num={3} title="Were the class reminders helpful?">
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ v: true, l: 'Yes, helpful' }, { v: false, l: 'No, not helpful' }].map(({ v, l }) => (
              <button key={String(v)} type="button" onClick={() => setQ3(v)} style={{
                flex: 1, height: 44, borderRadius: 8, border: q3 === v ? '1px solid #22c55e' : '1px solid #2a2a2a',
                fontWeight: 600, fontSize: 13,
                background: q3 === v ? '#052e16' : '#111111',
                color: q3 === v ? '#22c55e' : '#9ca3af',
                transition: 'all 0.15s',
              }}>{l}</button>
            ))}
          </div>
        </Section>

        {/* Q4 */}
        <Section num={4} title="When should reminders be sent?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LOCATION_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setQ4(opt.value)} style={{
                textAlign: 'left', padding: '12px 16px', borderRadius: 8,
                border: q4 === opt.value ? '1px solid #22c55e' : '1px solid #2a2a2a',
                background: q4 === opt.value ? '#052e16' : '#111111',
                transition: 'all 0.15s',
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: q4 === opt.value ? '#22c55e' : '#fff' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Q5 */}
        <Section num={5} title="How comfortable are you with location tracking?" subtitle="1 = uncomfortable \u00b7 5 = very comfortable">
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(v => (
              <button key={v} type="button" onClick={() => setQ5(v)} style={{
                flex: 1, height: 44, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 16,
                background: q5 === v ? '#22c55e' : '#111111',
                color: q5 === v ? '#000' : '#9ca3af',
                transition: 'all 0.15s',
              }}>{v}</button>
            ))}
          </div>
        </Section>

        {/* Q6 */}
        <Section num={6} title="Any additional feedback?" subtitle="Optional">
          <textarea
            value={q6}
            onChange={e => setQ6(e.target.value)}
            rows={3}
            placeholder="Share your thoughts about the reminder system..."
            style={{ resize: 'vertical' }}
          />
        </Section>

        {error && (
          <div style={{
            background: '#1f0a0a', border: '1px solid #7f1d1d', color: '#fca5a5',
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <button type="submit" disabled={sending} className="btn-green" style={{ width: '100%', padding: '14px' }}>
          {sending ? 'Submitting...' : 'Submit Survey'}
        </button>
      </form>
    </div>
  );
}

function Section({ num, title, subtitle, children }) {
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: 12,
      padding: '20px',
      marginBottom: 16,
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#052e16',
            border: '1px solid #166534', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#22c55e',
          }}>{num}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{title}</span>
        </div>
        {subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, marginLeft: 30 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
