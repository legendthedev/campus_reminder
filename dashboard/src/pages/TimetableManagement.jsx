import React, { useEffect, useState } from 'react';
import api from '../services/api';

const DAYS = ['monday','tuesday','wednesday','thursday','friday'];
const DAY_LABELS = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri' };

const emptyForm = { course_id: '', day_of_week: 'monday', start_time: '09:00', end_time: '11:00', room_name: '', building_name: '' };

export default function TimetableManagement() {
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [activeDay, setActiveDay] = useState('monday');

  const load = async () => {
    const [t, c] = await Promise.all([api.get('/api/timetable'), api.get('/api/courses')]);
    setEntries(t.data); setCourses(c.data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editId) await api.put(`/api/timetable/${editId}`, form);
    else await api.post('/api/timetable', form);
    setShowModal(false); setForm(emptyForm); setEditId(null);
    load();
  };

  const del = async (id) => {
    if (window.confirm('Delete this timetable entry?')) {
      await api.delete(`/api/timetable/${id}`); load();
    }
  };

  const openEdit = (e) => {
    setForm({ course_id: e.course_id, day_of_week: e.day_of_week,
      start_time: e.start_time, end_time: e.end_time,
      room_name: e.room_name, building_name: e.building_name });
    setEditId(e.id); setShowModal(true);
  };

  const dayEntries = entries.filter(e => e.day_of_week === activeDay)
    .sort((a,b) => a.start_time.localeCompare(b.start_time));

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#1565C0' }}>Timetable management</h2>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowModal(true); }} style={btnStyle('#1565C0')}>
          + Add entry
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {DAYS.map(d => (
          <button key={d} onClick={() => setActiveDay(d)}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: activeDay === d ? '#1565C0' : '#e0e0e0',
              color: activeDay === d ? '#fff' : '#333', fontWeight: 600 }}>
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>

      {dayEntries.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#bbb', padding: 40 }}>No classes on {activeDay}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dayEntries.map(e => {
            const course = courses.find(c => c.id === e.course_id);
            return (
              <div key={e.id} style={{ background: '#fff', border: '1px solid #e0e0e0',
                borderRadius: 10, padding: '14px 20px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ background: '#E3F2FD', color: '#1565C0', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 6, fontSize: 12, marginRight: 10 }}>
                    {course?.course_code || '—'}
                  </span>
                  <strong>{course?.course_name || '—'}</strong>
                  <span style={{ color: '#888', fontSize: 13, marginLeft: 12 }}>
                    {e.start_time} – {e.end_time} | {e.room_name}, {e.building_name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(e)} style={btnStyle('#555', true)}>Edit</button>
                  <button onClick={() => del(e.id)} style={btnStyle('#C62828', true)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editId ? 'Edit entry' : 'Add timetable entry'} onClose={() => setShowModal(false)}>
          <Field label="Course">
            <select value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})} style={inputStyle}>
              <option value="">Select course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} – {c.course_name}</option>)}
            </select>
          </Field>
          <Field label="Day">
            <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})} style={inputStyle}>
              {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Start time">
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} style={inputStyle} />
            </Field>
            <Field label="End time">
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} style={inputStyle} />
            </Field>
          </div>
          <Field label="Room name">
            <input value={form.room_name} onChange={e => setForm({...form, room_name: e.target.value})} style={inputStyle} placeholder="e.g. Lab 101" />
          </Field>
          <Field label="Building name">
            <input value={form.building_name} onChange={e => setForm({...form, building_name: e.target.value})} style={inputStyle} placeholder="e.g. CS Block" />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button onClick={() => setShowModal(false)} style={btnStyle('#888', true)}>Cancel</button>
            <button onClick={save} style={btnStyle('#1565C0')}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#444' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '9px 10px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' };
const btnStyle = (bg, small) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', padding: small ? '6px 14px' : '9px 20px', fontWeight: 600, fontSize: small ? 13 : 14 });
