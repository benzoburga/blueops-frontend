import axios from 'axios';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// (opcional) baseURL para no repetirla en cada llamada
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Restaura el token guardado al iniciar la app
try {
  const saved =
    JSON.parse(localStorage.getItem('authUser') || 'null') ||
    JSON.parse(sessionStorage.getItem('authUser') || 'null') ||
    {};
  if (saved?.token) {
    axios.defaults.headers.common.Authorization = `Bearer ${saved.token}`;
  }
} catch (e) { /* noop */ }

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);