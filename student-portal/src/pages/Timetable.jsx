import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getUser } from '../services/auth';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function Timetable() {
  const user = getUser();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const [tab, setTab] = useState(DAYS.includes(today) ? DAYS.indexOf(today) : 0);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = user?.role === 'student'
      ? `/api/students/${user.id}/timetable`
      : '/api/timetable';
    api.get(endpoint)
      .then(r => setEntries(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  const dayEntries = entries.filter(e => e.day_of_week === DAYS[tab]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Day tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 24,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 10,
        padding: 6,
      }}>
        {DAYS.map((d, i) => (
          <button key={d} onClick={() => setTab(i)} style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 7,
            border: 'none',
            background: tab === i ? '#22c55e' : 'transparent',
            color: tab === i ? '#000' : '#9ca3af',
            fontWeight: tab === i ? 700 : 500,
            fontSize: 13,
            cursor: 'pointer',
            position: 'relative',
          }}>
            {DAY_LABELS[i]}
            {d === today && (
              <span style={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                background: tab === i ? '#000' : '#22c55e',
                borderRadius: '50%',
              }} />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#4b5563', padding: '60px 0' }}>Loading...</div>
      ) : dayEntries.length === 0 ? (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 14,
          textAlign: 'center',
          color: '#4b5563',
          padding: '60px 20px',
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" style={{ margin: '0 auto 14px' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p style={{ fontSize: 15, fontWeight: 500 }}>No classes on {DAY_LABELS[tab]}</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Enjoy your free day!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dayEntries.map(entry => (
            <TimetableCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function TimetableCard({ entry }) {
  const code = entry.course_code ?? entry.course?.course_code ?? '?';
  const name = entry.course_name ?? entry.course?.course_name ?? 'Unknown';

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: 12,
      padding: '18px 20px',
      display: 'flex',
      gap: 16,
      alignItems: 'stretch',
    }}>
      <div style={{
        width: 4, borderRadius: 4, background: '#22c55e', flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              background: '#052e16', color: '#22c55e', borderRadius: 5,
              fontSize: 11, fontWeight: 700, padding: '3px 8px',
              border: '1px solid #166534', marginBottom: 6, display: 'inline-block',
            }}>{code}</span>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginTop: 6 }}>{name}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#22c55e' }}>
              {entry.start_time?.slice(0, 5)}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              to {entry.end_time?.slice(0, 5)}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 10, display: 'flex', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {entry.room_name}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
            {entry.building_name}
          </span>
        </div>
      </div>
    </div>
  );
}
