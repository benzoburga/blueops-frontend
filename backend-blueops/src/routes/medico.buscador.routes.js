//medico.buscador.routes.js
const router = require('express').Router();
const { resolveEmoTarget } = require('../controllers/medico.buscador.controller');

router.get('/resolve', resolveEmoTarget);

module.exports = router;
