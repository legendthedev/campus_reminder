import React from 'react';

export const inputStyle = {
  width: '100%', padding: '9px 10px', border: '1px solid #ddd',
  borderRadius: 7, fontSize: 14, boxSizing: 'border-box',
};

export const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#444',
};

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
