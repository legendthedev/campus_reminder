import React from 'react';

export function Card({ title, children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20, ...style }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#333' }}>{title}</h3>
      {children}
    </div>
  );
}

export function StatPill({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '14px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export function PageLoader() {
  return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading dashboard…</div>;
}

export function Muted({ children }) {
  return <p style={{ color: '#bbb', textAlign: 'center', padding: '20px 0', fontSize: 14 }}>{children}</p>;
}
