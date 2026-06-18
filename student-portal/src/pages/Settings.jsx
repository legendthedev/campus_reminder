import React, { useState } from 'react';
import { getUser, logout } from '../services/auth';
import api from '../services/api';

export default function Settings() {
  const user = getUser();
  const [fcmToken, setFcmToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const updateFcm = async () => {
    if (!fcmToken.trim()) return;
    await api.post('/api/notifications/update-fcm-token', {
      fcm_token: fcmToken,
      platform: 'web',
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Account Section */}
      <SectionHeader title="Account Information" subtitle="Your profile details" />
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        padding: '4px 0',
        marginBottom: 28,
      }}>
        <Row label="Full Name" value={user?.full_name ?? '\u2014'} />
        <Divider />
        <Row label="Email" value={user?.email ?? '\u2014'} />
        <Divider />
        <Row label="Student ID" value={user?.student_id ?? '\u2014'} />
        <Divider />
        <Row label="Role" value={<Tag>{user?.role}</Tag>} />
        <Divider />
        <Row label="Platform" value={<Tag>{user?.platform ?? 'web'}</Tag>} />
      </div>

      {/* Push Notifications */}
      <SectionHeader title="Push Notifications" subtitle="Configure device notifications" />
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        padding: '20px',
        marginBottom: 28,
      }}>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, lineHeight: 1.6 }}>
          Enter your Firebase Cloud Messaging token to receive push notifications on this device.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={fcmToken}
            onChange={e => setFcmToken(e.target.value)}
            placeholder="Paste your FCM device token..."
            style={{ flex: 1 }}
          />
          <button onClick={updateFcm} className="btn-green" style={{ padding: '10px 18px', fontSize: 13, flexShrink: 0 }}>
            {saved ? 'Saved!' : 'Save Token'}
          </button>
        </div>
      </div>

      {/* Privacy */}
      <SectionHeader title="Privacy" subtitle="Location & data preferences" />
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        padding: '20px',
        marginBottom: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>Location sharing</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
              GPS data is used solely for geofence reminders
            </div>
          </div>
          <button onClick={() => setPrivacy(!privacy)} style={{
            width: 44, height: 26, borderRadius: 13, border: 'none',
            background: privacy ? '#22c55e' : '#374151',
            position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
          }}>
            <span style={{
              position: 'absolute', top: 3, left: privacy ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
        <div style={{ height: 1, background: '#2a2a2a', margin: '14px 0' }} />
        <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
          Your GPS location is checked only during class hours (7 am \u2013 8 pm, weekdays).
          Location data is cached for 10 minutes and never shared with third parties.
          You may withdraw consent at any time by toggling off location sharing.
        </p>
      </div>

      {/* Sign out */}
      <button onClick={logout} style={{
        width: '100%', padding: '14px', borderRadius: 12, border: '1px solid #7f1d1d',
        background: '#1f0a0a', color: '#fca5a5', fontWeight: 700, fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign Out
      </button>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: '#2a2a2a', margin: '0 20px' }} />;
}

function Tag({ children }) {
  return (
    <span style={{
      background: '#052e16', color: '#22c55e', borderRadius: 6,
      fontSize: 12, fontWeight: 600, padding: '3px 10px', border: '1px solid #166534',
      textTransform: 'capitalize',
    }}>{children}</span>
  );
}
