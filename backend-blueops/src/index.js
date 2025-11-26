// backend-blueops/src/index.js
const path = require('path');

// Solo cargamos .env.production cuando NO estamos en producción real (Render)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env.production'),
  });
}

const express = require('express');
const cors = require('cors');

const app = express();

/* ====== ENV ====== */
const PORT = process.env.PORT || 4000;
const FRONT_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:4000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'backend-blueops/uploads';
const UPLOADS_DIR_ABS = path.isAbsolute(UPLOADS_DIR)
  ? UPLOADS_DIR
  : path.resolve(__dirname, '../', UPLOADS_DIR.includes('backend-blueops') ? UPLOADS_DIR.split('backend-blueops/')[1] : '..', 'uploads');

/* ====== Middlewares base ====== */
app.use(cors({
  origin: FRONT_ORIGINS.length ? FRONT_ORIGINS : true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

/* Limpieza de URL */
app.use((req, res, next) => {
  const orig = req.url;
  const decoded = decodeURIComponent(orig);
  const cleaned = decoded.replace(/\s+$/g, '');
  if (decoded !== cleaned) {
    req.url = encodeURI(cleaned);
    console.log('[URL CLEAN] corrigiendo', orig, '->', req.url);
  }
  next();
});

/* Healthcheck */
app.get('/health', (_req, res) => res.send('OK'));

/* Logs básicos para /api */
app.use('/api', (req, _res, next) => {
  console.log('[API HIT]', req.method, req.path);
  next();
});

/* ====== RUTAS API (ORDEN IMPORTA) ====== */
// 1) Asignaciones
app.use('/api', require('./routes/asignaciones.routes'));

// 2) Buscador Admin
app.use('/api/admin/buscador', require('./routes/admin.buscador.routes'));

// 3) Estructura
app.use('/api/estructura', require('./routes/estructura.routes'));

// 4) Archivos
app.use('/api', require('./routes/archivos.routes'));

// 5) Buscadores médico
app.use('/api/medico/buscador', require('./routes/buscador.routes'));
app.use('/api/medico/buscador', require('./routes/medico.buscador.routes'));

// 6) Resto
app.use('/api/apartados', require('./routes/apartados.routes'));
app.use('/api', require('./routes/trabajadores.routes'));
app.use('/api', require('./routes/auth.routes'));
app.use('/api', require('./routes/cliente.routes'));
app.use('/api/carpetas', require('./routes/carpetas.routes'));
app.use('/api/subcarpetas', require('./routes/subcarpetas.routes'));
app.use('/api', require('./routes/representantes.routes'));
app.use('/api', require('./routes/tipos_identificacion.routes'));
app.use('/api', require('./routes/indicadores.routes'));
app.use('/api', require('./routes/catalogos.routes'));
app.use('/api', require('./routes/movimientos.routes'));

/* ====== ESTÁTICOS ====== */
const UPLOADS_ABS = path.resolve(__dirname, '../uploads');
// Archivos subidos (solo lectura) en /files
app.use('/files',   express.static(UPLOADS_ABS));
app.use('/uploads', express.static(UPLOADS_ABS)); 
// Si prefieres honrar UPLOADS_DIR: 
// app.use('/files', express.static(UPLOADS_DIR_ABS));

/* ====== FRONTEND (SPA) ====== */
// Servir el build de Vite (dist/) desde la raíz del repo
const DIST_DIR = path.resolve(__dirname, '../../dist');
app.use(express.static(DIST_DIR));

// Fallback: cualquier ruta no-API manda index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});


/* ====== 404 final para API ====== */
app.use((req, res) => {
  console.log('[404]', req.method, req.originalUrl);
  res.status(404).json({ msg: 'not found' });
});

/* ====== START ====== */
app.listen(PORT, () => {
  console.log(`BlueOps corriendo en http://localhost:${PORT}`);
});
