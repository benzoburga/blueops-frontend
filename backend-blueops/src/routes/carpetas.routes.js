//carpetas.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const {
  crearCarpeta,
  actualizarOrdenCarpeta,
  actualizarNombreCarpeta,
  eliminarCarpeta
} = require('../controllers/carpetas.controller');

const { medicoGetOrCreateRoot } = require('../controllers/carpetas.controller');
// ✅ Primero van las rutas más específicas (para que no las capture el .get de abajo)
router.put('/nombre/:id', actualizarNombreCarpeta);
router.put('/:id', actualizarOrdenCarpeta);
router.post('/', crearCarpeta);

router.delete('/:id', eliminarCarpeta);
// ✅ Esta ruta debe ir al final porque captura parámetros dinámicos
router.get('/:clienteNombre/:apartadoNombre', async (req, res) => {
  const { clienteNombre, apartadoNombre } = req.params;

  const decodedClient = decodeURIComponent(clienteNombre);
  const decodedSection = decodeURIComponent(apartadoNombre);

  function capitalizar(texto) {
    return texto
      .split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  const finalSection = capitalizar(decodedSection.replace(/-/g, ' '));

  try {
    const [carpetas] = await pool.query(`
      SELECT 
        c.id AS carpeta_id,
        c.nombre AS carpeta_nombre,
        c.apartado_cliente_id,
        c.orden
      FROM carpetas c
      JOIN apartados_cliente ac ON c.apartado_cliente_id = ac.id
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
      ORDER BY c.orden ASC
    `, [decodedClient, finalSection]);

    console.log("✅ Carpetas encontradas:", carpetas);
    res.json(carpetas);
  } catch (error) {
    console.error('❌ Error al obtener carpetas:', error);
    res.status(500).json({ error: 'Error al obtener carpetas' });
  }
});

router.get('/medico/trabajadores/:trabajadorId/root', medicoGetOrCreateRoot);

module.exports = router;
