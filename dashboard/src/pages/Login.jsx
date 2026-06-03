import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'student') {
        setError('Student accounts cannot access the dashboard.');
        setLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box', marginTop: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1565C0', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <h1 style={{ margin: 0, fontSize: 22, color: '#1565C0' }}>Campus Reminder</h1>
          <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>Staff & Admin Dashboard</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required style={inputStyle} placeholder="your@university.edu" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required style={inputStyle} placeholder="••••••••" />
          </div>
          {error && (
            <div style={{ background: '#FFEBEE', color: '#C62828', padding: '8px 12px',
              borderRadius: 6, fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#1565C0', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 20 }}>
          Seed credentials — lecturer: adebayo@university.edu / lecturer123<br />
          Admin: admin@university.edu / admin123
        </p>
      </div>
    </div>
  );
}
