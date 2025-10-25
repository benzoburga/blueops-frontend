const express = require("express");
const router = express.Router();
const { obtenerRepresentantesPorCliente, crearRepresentante } = require("../controllers/representante.controller");

router.get("/clientes/:ruc/representantes", obtenerRepresentantesPorCliente);
router.post("/clientes/:ruc/representantes", crearRepresentante);

module.exports = router;
