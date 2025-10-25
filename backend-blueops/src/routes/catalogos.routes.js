// routes/catalogos.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.get('/catalogos', async (_req, res) => {
  try {
    const [tipos] = await pool.query('SELECT id, nombre FROM tipos_contribuyente WHERE activo=1 ORDER BY orden, nombre');
    const [estados] = await pool.query('SELECT id, nombre FROM estados_contribuyente WHERE activo=1 ORDER BY orden, nombre');
    const [condiciones] = await pool.query('SELECT id, nombre FROM condiciones_contribuyente WHERE activo=1 ORDER BY orden, nombre');
    const [sistemas] = await pool.query('SELECT id, nombre FROM sistemas_contabilidad WHERE activo=1 ORDER BY orden, nombre');

    console.log('[CATALOGOS] lens =>', {
      tipos: tipos.length, estados: estados.length, condiciones: condiciones.length, sistemas: sistemas.length
    });

    res.json({ tipos, estados, condiciones, sistemas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error cargando catálogos' });
  }
});

module.exports = router;
