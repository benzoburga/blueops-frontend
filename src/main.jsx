// src/main.jsx
import '@/services/api';      // << PRIMERO
import './api-shim';         // si lo necesitas, que no toque Authorization
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
