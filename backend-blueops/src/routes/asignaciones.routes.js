//asignaciones.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const {
  asignarArchivoAUsuarios,
  getArbolAsignadoParaUsuario,
  getArchivosAsignadosClienteUsuario,
} = require('../controllers/asignaciones.controller');

// POST /api/asignaciones
router.post('/asignaciones', auth, asignarArchivoAUsuarios);

// GET /api/asignaciones/usuario/:usuario_id/arbol
router.get('/asignaciones/usuario/:usuario_id/arbol', auth, getArbolAsignadoParaUsuario);

// ✅ Ruta que usa el frontend (Cliente Admin y Cliente Usuario)
router.get('/asignaciones/cliente-usuario', auth, getArchivosAsignadosClienteUsuario);

module.exports = router;
