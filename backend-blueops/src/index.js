// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: FRONT_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// Limpieza de URL
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

// Log básico de /api
app.use('/api', (req, _res, next) => {
  console.log('[API HIT]', req.method, req.path);
  next();
});

// --- RUTAS (ORDEN IMPORTA) ---

// 1) Asignaciones
app.use('/api', require('./routes/asignaciones.routes'));

// 2) Buscador Admin (debe ir antes que otros /api para no ser interceptado)
app.use('/api/admin/buscador', require('./routes/admin.buscador.routes'));

// 3) Estructura (slugs -> IDs)
app.use('/api/estructura', require('./routes/estructura.routes'));

// 4) Archivos (después)
app.use('/api', require('./routes/archivos.routes'));

// 5) Buscadores médico
app.use('/api/medico/buscador', require('./routes/buscador.routes'));
app.use('/api/medico/buscador', require('./routes/medico.buscador.routes'));

// 6) El resto
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


// estáticos
app.use('/uploads', express.static('uploads'));

// 404
app.use((req, res) => {
  console.log('[404]', req.method, req.originalUrl);
  res.status(404).json({ msg: 'not found' });
});

app.listen(3000, () => {
  console.log('Servidor backend corriendo en http://localhost:3000');
});
