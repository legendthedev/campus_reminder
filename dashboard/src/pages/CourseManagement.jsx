import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Modal } from '../components/shared/Modal';
import { Field, inputStyle } from '../components/shared/FormField';
import { btnStyle } from '../components/shared/styles';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ course_code: '', course_name: '', lecturer_id: '' });
  const [editId, setEditId] = useState(null);

  const load = async () => {
    const [c, u, s] = await Promise.all([api.get('/api/courses'), api.get('/api/students'), api.get('/api/students')]);
    setCourses(c.data);
    setStudents(s.data);
    // fetch lecturers separately - use students endpoint filtered by role
    try {
      const me = await api.get('/api/auth/me');
      if (me.data.role === 'admin') {
        // get all users by fetching known lecturers from courses
        const lecs = c.data.map(course => ({ id: course.lecturer_id }));
        setLecturers(lecs);
      }
    } catch (_) {}
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editId) await api.put(`/api/courses/${editId}`, form);
    else await api.post('/api/courses', form);
    setShowModal(false); setForm({ course_code: '', course_name: '', lecturer_id: '' });
    setEditId(null); load();
  };

  const del = async (id) => {
    if (window.confirm('Delete this course?')) { await api.delete(`/api/courses/${id}`); load(); }
  };

  const openEdit = (c) => {
    setForm({ course_code: c.course_code, course_name: c.course_name, lecturer_id: c.lecturer_id });
    setEditId(c.id); setShowModal(true);
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#1565C0' }}>Course management</h2>
        <button onClick={() => { setForm({ course_code:'', course_name:'', lecturer_id:'' }); setEditId(null); setShowModal(true); }}
          style={btnStyle('#1565C0')}>+ New course</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {courses.map(c => (
          <div key={c.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ background: '#E3F2FD', color: '#1565C0', fontWeight: 700, padding: '2px 10px',
                  borderRadius: 6, fontSize: 13, marginRight: 10 }}>{c.course_code}</span>
                <strong style={{ fontSize: 16 }}>{c.course_name}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(c)} style={btnStyle('#555', true)}>Edit</button>
                <button onClick={() => del(c.id)} style={btnStyle('#C62828', true)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editId ? 'Edit course' : 'New course'} onClose={() => setShowModal(false)}>
          {[['Course code','course_code'],['Course name','course_name']].map(([label, key]) => (
            <Field key={key} label={label}>
              <input value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} style={inputStyle} />
            </Field>
          ))}
          <Field label="Lecturer ID">
            <input value={form.lecturer_id} onChange={e => setForm({...form, lecturer_id:e.target.value})}
              placeholder="Paste lecturer UUID" style={inputStyle} />
          </Field>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 }}>
            <button onClick={() => setShowModal(false)} style={btnStyle('#888',true)}>Cancel</button>
            <button onClick={save} style={btnStyle('#1565C0')}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}


