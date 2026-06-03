// api.js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const r = await axios.post('/api/auth/refresh', null, { params: { refresh_token: refresh } });
          localStorage.setItem('access_token', r.data.access_token);
          localStorage.setItem('refresh_token', r.data.refresh_token);
          err.config.headers.Authorization = `Bearer ${r.data.access_token}`;
          return api(err.config);
        } catch (_) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
