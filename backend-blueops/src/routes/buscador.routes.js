//buscador.routes.js
const { Router } = require('express');
const { searchEmosEverything } = require('../controllers/buscador.controller');
const router = Router();

// GET /api/medico/buscador/emos?query=&page=1&pageSize=20
router.get('/emos', searchEmosEverything);

module.exports = router;
