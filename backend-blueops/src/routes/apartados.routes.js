const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const maybe = (mw) => (req, res, next) =>
  process.env.USE_AUTH === 'true' ? mw(req, res, next) : next();

const {
  crearApartado,
  eliminarApartadoCliente,
  getApartadosPorCliente,
  getMisApartados,
} = require('../controllers/apartados.controller');

// --- Sanity check de montaje del router
router.get('/ping', (req, res) => {
  console.log('>>> /api/apartados/ping');
  res.json({ ok: true, path: req.path, user: req.user ?? null });
});

// ⚠️ SOLO UNA definición para /cliente-usuario
router.get(
  '/cliente-usuario',
  maybe(auth),
  (req, _res, next) => {
    console.log('>>> RUTA /apartados/cliente-usuario handler getMisApartados');
    next();
  },
  getMisApartados
);

// Consulta por id explícito
router.get('/cliente/:cliente_id', maybe(auth), getApartadosPorCliente);

// Crear / eliminar
router.post('/crear', maybe(auth), crearApartado);
router.delete('/:cliente_id/:tipo_apartado_id', maybe(auth), eliminarApartadoCliente);

// ⚠️ Ruta “slug” al FINAL (no antes)
router.get('/:clienteNombre/:tipoApartado', async (req, res) => {
  const { pool } = require('../config/db');
  const { clienteNombre, tipoApartado } = req.params;
  const decodedClient = decodeURIComponent(clienteNombre);
  const decodedSection = decodeURIComponent(tipoApartado);

  try {
    const [result] = await pool.query(`
      SELECT ac.id
      FROM apartados_cliente ac
      JOIN clientes cl ON ac.cliente_id = cl.id
      JOIN tipos_apartado ta ON ac.tipo_apartado_id = ta.id
      WHERE 
        LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(cl.nombre_comercial,
          'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N')) = 
        LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(?,
          'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N'))
      AND LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ta.nombre,
          'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N')) = 
        LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(?,
          'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N'))
    `, [decodedClient, decodedSection]);

    if (!result.length) return res.status(404).json({ error: 'Apartado no encontrado' });
    res.json({ id: result[0].id });
  } catch (error) {
    console.error('❌ Error al obtener apartado_cliente_id:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
