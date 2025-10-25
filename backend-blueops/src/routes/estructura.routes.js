// src/routes/estructura.routes.js
const router = require('express').Router();
const { getEstructuraBySlugs } = require('../controllers/estructura.controller');

// GET /api/estructura/:clienteSlug/:apartadoSlug
router.get('/:clienteSlug/:apartadoSlug', getEstructuraBySlugs);

module.exports = router;
