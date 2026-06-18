import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const TYPE_META = {
  class_reminder: { icon: 'bell', label: 'Class Reminder', color: '#22c55e' },
  announcement:   { icon: 'megaphone', label: 'Announcement', color: '#f59e0b' },
  survey_invite:  { icon: 'clipboard', label: 'Survey', color: '#818cf8' },
};

function TypeIcon({ type, color }) {
  if (type === 'bell') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
  if (type === 'megaphone') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/notifications');
      setNotifications(r.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async id => {
    await api.put(`/api/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAll = async () => {
    await api.post('/api/notifications/mark-all-read').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {unread > 0 && (
            <span style={{
              background: '#052e16', color: '#22c55e', borderRadius: 8,
              fontSize: 12, fontWeight: 700, padding: '4px 10px', border: '1px solid #166534',
            }}>
              {unread} unread
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAll} style={{
            background: 'transparent', border: '1px solid #166534',
            color: '#22c55e', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
          }}>
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#4b5563', padding: '60px 0' }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 14,
          textAlign: 'center',
          color: '#4b5563',
          padding: '60px 20px',
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" style={{ margin: '0 auto 14px' }}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <p style={{ fontSize: 15, fontWeight: 500 }}>No notifications yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>You're all caught up!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const meta = TYPE_META[n.type] ?? { icon: 'bell', label: n.type, color: '#6b7280' };
            return (
              <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  background: n.is_read ? '#1a1a1a' : '#0f1f12',
                  border: `1px solid ${n.is_read ? '#2a2a2a' : '#166534'}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  display: 'flex',
                  gap: 14,
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `${meta.color}12`,
                  border: `1px solid ${meta.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TypeIcon type={meta.icon} color={meta.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: meta.color,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{meta.label}</span>
                    <span style={{ fontSize: 11, color: '#4b5563' }}>
                      {new Date(n.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: 14, color: '#fff', margin: '5px 0 3px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>
                    {n.body}
                  </div>
                </div>
                {!n.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#22c55e', flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
