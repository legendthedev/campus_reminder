import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/timetable': 'Timetable',
  '/map': 'Campus Map',
  '/notifications': 'Notifications',
  '/survey': 'Weekly Survey',
  '/settings': 'Settings',
};

export default function Topbar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Campus Reminder';
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header style={{
      background: '#0f0f0f',
      borderBottom: '1px solid #1f1f1f',
      padding: '0 32px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
          {title}
        </h1>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#6b7280',
        fontSize: 13,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{today}</span>
      </div>
    </header>
  );
}
