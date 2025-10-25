// routes/cliente.routes.js
const express = require("express");
const router = express.Router();
const {
  obtenerClientes,
  obtenerClientePorRUC,
  crearCliente,
  archivarCliente,
  restaurarCliente
} = require("../controllers/cliente.controller"); // ⬅️ incluye las nuevas

router.get("/clientes", obtenerClientes);
router.get("/clientes/:ruc", obtenerClientePorRUC);
router.post("/clientes", crearCliente);
router.post("/clientes/:id/archivar", archivarCliente);
router.post("/clientes/:id/restaurar", restaurarCliente);


module.exports = router;
