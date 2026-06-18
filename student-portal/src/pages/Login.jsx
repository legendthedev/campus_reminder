import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Make sure the backend is running.');
      } else {
        setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Login Card */}
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 16,
          padding: '44px 40px',
        }}>
          {/* Branding */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
              Campus Reminder
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
              Sign in to your student portal
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="student@university.edu"
                style={{ padding: '12px 14px' }}
              />
            </div>

            <div style={{ marginBottom: 26 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{ padding: '12px 14px' }}
              />
            </div>

            {error && (
              <div style={{
                background: '#1f0a0a',
                border: '1px solid #7f1d1d',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-green" style={{ width: '100%', padding: '13px 20px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: '#6b7280' }}>
            New to Campus Reminder?{' '}
            <Link to="/signup" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>
              Create account
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: 16,
          padding: '16px 20px',
          background: '#111111',
          borderRadius: 12,
          border: '1px solid #2a2a2a',
        }}>
          <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Demo Accounts
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              ['chidi@student.edu', 'student123'],
              ['amaka@student.edu', 'student123'],
            ].map(([e, p]) => (
              <button key={e} onClick={() => { setEmail(e); setPassword(p); }}
                style={{
                  flex: 1,
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#9ca3af',
                  fontSize: 12,
                  padding: '8px 12px',
                  textAlign: 'left',
                }}>
                <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 2 }}>{e.split('@')[0]}</div>
                <div style={{ fontSize: 11, color: '#4b5563' }}>{e}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
