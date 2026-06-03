import React from 'react';
import { NavLink } from 'react-router-dom';
import { getUser } from '../services/auth';

const links = [
  { to: '/dashboard', label: '🏠 Overview', roles: ['admin', 'lecturer'] },
  { to: '/timetable', label: '📅 Timetable', roles: ['admin', 'lecturer'] },
  { to: '/students', label: '👥 Students', roles: ['admin', 'lecturer'] },
  { to: '/courses', label: '📚 Courses', roles: ['admin', 'lecturer'] },
  { to: '/geofence', label: '📍 Geofence', roles: ['admin'] },
  { to: '/survey', label: '📋 Survey results', roles: ['admin', 'lecturer'] },
  { to: '/analytics', label: '📊 Analytics', roles: ['admin', 'lecturer'] },
  { to: '/notifications', label: '🔔 Notifications', roles: ['admin', 'lecturer'] },
];

export default function Sidebar() {
  const user = getUser();
  const role = user?.role;
  const active = { background: '#E3F2FD', color: '#1565C0', fontWeight: 600 };
  return (
    <aside style={{ width: 220, minHeight: 'calc(100vh - 56px)', background: '#f8f9fa',
      borderRight: '1px solid #e0e0e0', padding: '16px 0' }}>
      {links.filter(l => l.roles.includes(role)).map(l => (
        <NavLink key={l.to} to={l.to}
          style={({ isActive }) => ({
            display: 'block', padding: '10px 20px', textDecoration: 'none',
            color: '#333', fontSize: 14, borderRadius: '0 8px 8px 0', margin: '2px 8px 2px 0',
            ...(isActive ? active : {}),
          })}>
          {l.label}
        </NavLink>
      ))}
    </aside>
  );
}
