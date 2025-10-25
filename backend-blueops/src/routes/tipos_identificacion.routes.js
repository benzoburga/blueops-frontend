// routes/tiposIdentificacion.routes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");

router.get("/tipos-identificacion", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tipos_identificacion");
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener tipos de identificación:", err.message);
    res.status(500).json({ message: "Error al obtener tipos de identificación" });
  }
});

module.exports = router;
