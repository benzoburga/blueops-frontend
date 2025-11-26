// src/api-shim.js
import axios from 'axios';

// Base por defecto: mismo origen (sirve en dev con proxy y en prod)
// Reescribe URLs "duras" a relativo (soporta 3000, 4000 y 5173 por si acaso)
const HOSTS_A_REEMPLAZAR = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5173',
];

axios.interceptors.request.use((config) => {
  if (typeof config.url === 'string') {
    for (const host of HOSTS_A_REEMPLAZAR) {
      if (config.url.startsWith(host + '/')) {
        // de "/api/..." -> "/api/..."
        config.url = config.url.replace(host, '');
        break;
      }
    }
  }
  return config;
});
