// src/services/api.js
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
    delete axios.defaults.headers.common.Authorization;
  }
}

export function getTokenFromStorage() {
  try {
    const a = localStorage.getItem('authUser');
    const b = sessionStorage.getItem('authUser');
    const saved = (a && JSON.parse(a)) || (b && JSON.parse(b)) || null;
    return saved?.token || localStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

export function hydrateAuthFromStorage() {
  setAuthToken(getTokenFromStorage());
}

// hidrata al cargar el módulo
hydrateAuthFromStorage();

// << clave: garantiza token FRESCO en cada request >>
api.interceptors.request.use((config) => {
  const t = getTokenFromStorage();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// (opcional) manejo de 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    // if (err?.response?.status === 401) window.location.href = '/';
    return Promise.reject(err);
  }
);

export default api;
