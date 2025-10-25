// routes/indicadores.routes.js
const express = require("express");
const router = express.Router();
const {
  obtenerIndicadoresPorCliente,
  upsertIndicadores
} = require("../controllers/indicadores.controller");

router.get("/clientes/:ruc/indicadores", obtenerIndicadoresPorCliente);
router.post("/clientes/:ruc/indicadores", upsertIndicadores);

module.exports = router;
