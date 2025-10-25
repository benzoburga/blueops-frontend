//subcarpetas.routes.js
const express = require('express');
const router = express.Router();
const {
  obtenerSubcarpetas,
  crearSubcarpeta,
  actualizarOrdenSubcarpeta,
  getSubcarpetasRecursivas,
  actualizarNombreSubcarpeta,
  obtenerTodasLasSubcarpetas,
  eliminarSubcarpeta
} = require('../controllers/subcarpetas.controller');

const { crearSubcarpetaMedico } = require('../controllers/subcarpetas.controller');

// 🟢 Las rutas MÁS ESPECÍFICAS primero
router.put('/nombre/:id', actualizarNombreSubcarpeta);
router.get('/subcarpetas-recursivas/:carpetaId', getSubcarpetasRecursivas);
router.delete('/:id', eliminarSubcarpeta);

// 🟠 Luego las genéricas
router.get('/:carpetaId', obtenerSubcarpetas);
router.put('/:id', actualizarOrdenSubcarpeta);
router.post('/', crearSubcarpeta);
router.post('/medico/trabajadores/:trabajadorId/carpetas', crearSubcarpetaMedico);

module.exports = router;
