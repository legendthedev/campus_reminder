// Navbar.jsx
import React from 'react';
import { logout, getUser } from '../services/auth';

export default function Navbar() {
  const user = getUser();
  return (
    <nav style={{ background: '#1565C0', color: '#fff', padding: '0 24px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100 }}>
      <span style={{ fontWeight: 700, fontSize: 18 }}>🎓 Campus Reminder</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, opacity: 0.9 }}>{user?.full_name} ({user?.role})</span>
        <button onClick={logout}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
