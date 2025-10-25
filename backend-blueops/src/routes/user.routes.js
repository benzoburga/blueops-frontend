// src/routes/user.routes.js
const express = require('express');
const router = express.Router();

const { obtenerUsuarios } = require('../controllers/user.controller');

// Ruta GET /api/usuarios
router.get('/usuarios', obtenerUsuarios);

router.get('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT id, nombre, email, cliente_id FROM usuarios WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ msg: 'No existe usuario' });
  res.json(rows[0]);
});

module.exports = router;
