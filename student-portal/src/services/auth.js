import api from './api';

export const login = async (email, password) => {
  const res = await api.post('/api/auth/login', { email, password });
  localStorage.setItem('access_token', res.data.access_token);
  localStorage.setItem('refresh_token', res.data.refresh_token);
  const me = await api.get('/api/auth/me');
  localStorage.setItem('user', JSON.stringify(me.data));
  return me.data;
};

export const register = async (fields) => {
  await api.post('/api/auth/register', fields);
  return login(fields.email, fields.password);
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
};

export const isLoggedIn = () => !!localStorage.getItem('access_token');
