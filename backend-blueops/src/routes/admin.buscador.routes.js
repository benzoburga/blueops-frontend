// src/routes/admin.buscador.routes.js
const router = require('express').Router();
const { searchAdminEverything } = require('../controllers/admin.buscador.controller');

// GET /api/admin/buscador?query=&page=1&pageSize=200
router.get('/', searchAdminEverything);

module.exports = router;
