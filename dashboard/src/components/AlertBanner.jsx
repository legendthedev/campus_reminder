import React from 'react';

export function AlertBanner({ message, type = 'warning' }) {
  const colors = {
    warning: { bg: '#FFF8E1', border: '#F9A825', text: '#5D4037', icon: '⚠️' },
    error:   { bg: '#FFEBEE', border: '#C62828', text: '#B71C1C', icon: '❌' },
    success: { bg: '#E8F5E9', border: '#2E7D32', text: '#1B5E20', icon: '✅' },
    info:    { bg: '#E3F2FD', border: '#1565C0', text: '#0D47A1', icon: 'ℹ️' },
  };
  const c = colors[type] || colors.warning;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8,
      padding: '10px 16px', marginBottom: 12, color: c.text, fontSize: 14,
      display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{c.icon}</span>
      <span>{message}</span>
    </div>
  );
}

export function StatCard({ label, value, icon, color = '#1565C0', sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12,
      padding: '20px 24px', flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? '—'}</div>
          {sub && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 28, opacity: 0.6 }}>{icon}</span>
      </div>
    </div>
  );
}
