const express = require('express');
const router = express.Router();
const {
  getTrabajadoresPorCliente,
  getMisTrabajadores,
  getTrabajadorById,
  createTrabajador,
  getPuestosByCliente,
  getCatalogosTrabajador,
  getPerfilClienteUsuario,
  getTrabajadoresTodosMedico,
  createTrabajadoresBulk,           // 👈 importar
} = require('../controllers/trabajadores.controller');
const auth = require('../middlewares/auth');
const maybe = (mw) => (req, res, next) =>
  process.env.USE_AUTH === 'true' ? mw(req, res, next) : next();

// 👇 Logger de router (primero)
router.use((req, _res, next) => {
  console.log('[TRAB ROUTER]', req.method, req.path);
  next();
});

router.get(
  '/_debug/perfil',
  maybe(auth),
  (req, res) => res.json({ ok: true, from: 'trabajadores.routes' })
);

router.get(
  '/cliente-usuario/perfil',
  maybe(auth),
  (req, res, next) => { console.log('HIT /cliente-usuario/perfil en trabajadores.routes'); next(); },
  getPerfilClienteUsuario
);

router.get('/trabajadores', maybe(auth), getMisTrabajadores);                 // usa token
router.get('/clientes/:cliente_id/trabajadores', maybe(auth), getTrabajadoresPorCliente);
router.get('/trabajadores/cliente/:cliente_id', maybe(auth), getTrabajadoresPorCliente); // compat
router.get('/trabajadores/:id', maybe(auth), getTrabajadorById);
router.post('/clientes/:cliente_id/trabajadores', maybe(auth), createTrabajador);

// 🔥 NUEVO: creación en lote
router.post('/clientes/:cliente_id/trabajadores/bulk', maybe(auth), createTrabajadoresBulk);

router.get('/clientes/:cliente_id/puestos_trabajo', maybe(auth), getPuestosByCliente);
router.get('/clientes/:cliente_id/catalogos/trabajador', maybe(auth), getCatalogosTrabajador);
router.get('/medico/trabajadores', maybe(auth), getTrabajadoresTodosMedico);

module.exports = router;
