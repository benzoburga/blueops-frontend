// src/routes/movimientos.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { listMovimientos } = require('../controllers/movimientos.controller');

// Feed
router.get('/movimientos', auth, listMovimientos);

module.exports = router;
