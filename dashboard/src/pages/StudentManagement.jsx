import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ full_name:'', email:'', password:'student123', student_id:'', role:'student' });
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [s, c] = await Promise.all([api.get('/api/students'), api.get('/api/courses')]);
      setStudents(s.data); setCourses(c.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load students.');
    }
  };
  useEffect(() => { load(); }, []);

  const openDetail = async (s) => {
    setSelected(s);
    try {
      const [r, sv] = await Promise.all([
        api.get(`/api/students/${s.id}/reminder-history`),
        api.get(`/api/students/${s.id}/survey-responses`),
      ]);
      setReminders(r.data); setSurveys(sv.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load student details.');
    }
  };

  const deactivate = async (id) => {
    if (window.confirm('Deactivate this student?')) {
      try { await api.put(`/api/students/${id}`, { is_active: false }); load(); }
      catch (err) { setError(err.response?.data?.detail || 'Failed to deactivate student.'); }
    }
  };

  const createStudent = async () => {
    try {
      await api.post('/api/auth/register', newForm);
      setShowCreate(false); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create student.');
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.student_id || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.platform === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 28 }}>
      {error && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#1565C0' }}>Student management</h2>
        <button onClick={() => setShowCreate(true)} style={btn('#1565C0')}>+ New student</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input placeholder="Search by name, email, or ID…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }} />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}>
          <option value="all">All platforms</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: '#f5f5f5' }}>
            <tr>{['Name','Student ID','Email','Platform','Status','Actions'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#555', fontWeight: 600 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5', background: i%2?'#fafafa':'#fff' }}>
                <td style={{ padding: '10px 14px' }}><b>{s.full_name}</b></td>
                <td style={{ padding: '10px 14px' }}><code>{s.student_id || '—'}</code></td>
                <td style={{ padding: '10px 14px', color: '#666' }}>{s.email}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 12 }}>{s.platform === 'android' ? '🤖 Android' : s.platform === 'ios' ? '🍎 iOS' : '—'}</span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ background: s.is_active ? '#E8F5E9' : '#FFEBEE',
                    color: s.is_active ? '#2E7D32' : '#C62828', padding: '2px 10px',
                    borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => openDetail(s)} style={btn('#1565C0', true)}>View</button>
                  {s.is_active && <button onClick={() => deactivate(s.id)} style={{ ...btn('#C62828', true), marginLeft: 6 }}>Deactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Drawer title={`${selected.full_name} — ${selected.student_id}`} onClose={() => setSelected(null)}>
          <Section title="Reminder history">
            {reminders.length === 0 ? <Muted>No reminders yet</Muted> : reminders.slice(0,10).map(r => (
              <div key={r.id} style={{ padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span style={{ marginRight: 8 }}>{r.was_on_campus ? '✅ On campus' : '🏃 Off campus'}</span>
                <span style={{ color: '#888' }}>{r.class_date} — {r.sent_at?.slice(11,16)}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: r.fcm_delivered ? '#43A047' : '#E53935' }}>
                  {r.fcm_delivered ? 'Delivered' : 'Not delivered'}
                </span>
              </div>
            ))}
          </Section>
          <Section title="Survey responses">
            {surveys.length === 0 ? <Muted>No surveys submitted yet</Muted> : surveys.map(s => (
              <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <strong>Week {s.survey_week}</strong>
                <span style={{ marginLeft: 8, color: '#888' }}>
                  Punctuality: {s.q1_punctuality_rating}/5 | Missed: {s.q2_missed_classes} | Helpful: {s.q3_reminder_helpful ? 'Yes' : 'No'}
                </span>
                {s.q6_open_feedback && <div style={{ fontStyle: 'italic', color: '#666', marginTop: 4 }}>"{s.q6_open_feedback}"</div>}
              </div>
            ))}
          </Section>
        </Drawer>
      )}

      {showCreate && (
        <Modal title="Create student" onClose={() => setShowCreate(false)}>
          {['full_name','email','password','student_id'].map(f => (
            <div key={f} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.replace('_',' ')}</label>
              <input value={newForm[f]} onChange={e => setNewForm({...newForm, [f]: e.target.value})}
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setShowCreate(false)} style={btn('#888', true)}>Cancel</button>
            <button onClick={createStudent} style={btn('#1565C0')}>Create</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const btn = (bg, small) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', padding: small ? '5px 12px' : '9px 20px', fontWeight: 600, fontSize: small ? 12 : 14 });
const Section = ({ title, children }) => <div style={{ marginBottom: 20 }}><h4 style={{ margin: '0 0 8px', color: '#555' }}>{title}</h4>{children}</div>;
const Muted = ({ children }) => <p style={{ color: '#bbb', fontSize: 13 }}>{children}</p>;

function Drawer({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ background: '#fff', width: 480, height: '100%', overflowY: 'auto', padding: 28, boxShadow: '-4px 0 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
