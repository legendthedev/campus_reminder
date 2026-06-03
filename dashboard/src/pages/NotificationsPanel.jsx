import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function NotificationsPanel() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', target: 'all' });
  const [preview, setPreview] = useState(false);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/api/courses').then(r => setCourses(r.data));
  }, []);

  const send = async () => {
    await api.post('/api/notifications/broadcast', form);
    setSent(true);
    setHistory(h => [{ ...form, ts: new Date().toLocaleString(), id: Date.now() }, ...h]);
    setForm({ title: '', body: '', target: 'all' });
    setPreview(false);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ margin: '0 0 20px', color: '#1565C0' }}>Broadcast notification</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15 }}>Compose message</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Title</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="e.g. Important announcement"
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Message body</label>
            <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})}
              placeholder="Write your message here…" rows={4}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Send to</label>
            <select value={form.target} onChange={e => setForm({...form, target: e.target.value})} style={inputStyle}>
              <option value="all">All students</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} — {c.course_name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setPreview(!preview)}
              style={{ flex: 1, padding: '11px', background: '#f5f5f5', color: '#333',
                border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {preview ? 'Hide preview' : 'Preview'}
            </button>
            <button onClick={send} disabled={!form.title || !form.body}
              style={{ flex: 1, padding: '11px', background: sent ? '#43A047' : '#1565C0',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: 'pointer', opacity: (!form.title || !form.body) ? 0.5 : 1 }}>
              {sent ? '✅ Sent!' : '🔔 Send notification'}
            </button>
          </div>
        </div>

        <div>
          {preview && form.title && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12,
              padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#888' }}>Preview</h3>
              <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '14px 16px',
                border: '1px solid #ddd', maxWidth: 320 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🎓 {form.title}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{form.body}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
                  To: {form.target === 'all' ? 'All students' : courses.find(c => c.id === form.target)?.course_name}
                </div>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Sent history (this session)</h3>
            {history.length === 0 ? (
              <p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No notifications sent yet</p>
            ) : history.map(h => (
              <div key={h.id} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{h.title}</div>
                <div style={{ color: '#888', fontSize: 12 }}>{h.body}</div>
                <div style={{ color: '#bbb', fontSize: 11, marginTop: 4 }}>{h.ts}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#444' };
const inputStyle = { width: '100%', padding: '9px 10px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' };
