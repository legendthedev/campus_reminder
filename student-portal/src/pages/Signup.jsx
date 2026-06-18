import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        student_id: role === 'student' ? (studentId.trim() || null) : null,
        phone_number: phone.trim() || null,
      });
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Make sure the backend is running.');
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.');
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
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 16,
        padding: '40px',
        width: '100%',
        maxWidth: 460,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
            Create Account
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
            Campus Reminder Student Portal
          </p>
        </div>

        {/* Role toggle */}
        <div style={{
          display: 'flex',
          background: '#111111',
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          padding: 4,
          marginBottom: 22,
          gap: 4,
        }}>
          {[
            { value: 'student', label: 'Student' },
            { value: 'lecturer', label: 'Lecturer' },
          ].map(r => (
            <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{
              flex: 1, padding: '9px 0', borderRadius: 6, border: 'none',
              fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
              background: role === r.value ? '#22c55e' : 'transparent',
              color: role === r.value ? '#000' : '#6b7280',
            }}>{r.label}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <FormField label="Full Name" required>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
          </FormField>

          <FormField label="Email Address" required>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={role === 'student' ? 'student@university.edu' : 'lecturer@university.edu'} required />
          </FormField>

          {role === 'student' && (
            <FormField label="Student ID" optional>
              <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="STU/2024/001" />
            </FormField>
          )}

          <FormField label="Phone Number" optional>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" />
          </FormField>

          <FormField label="Password" required>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required />
          </FormField>

          <FormField label="Confirm Password" required>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required />
          </FormField>

          {error && (
            <div style={{
              background: '#1f0a0a', border: '1px solid #7f1d1d', color: '#fca5a5',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 8,
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function FormField({ label, required, optional, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
        {label}
        {optional && <span style={{ color: '#4b5563', fontWeight: 400, marginLeft: 4 }}>(optional)</span>}
      </label>
      {children}
    </div>
  );
}
