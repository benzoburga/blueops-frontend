// controllers/indicadores.controller.js
const { pool } = require("../config/db");

// GET /api/clientes/:ruc/indicadores
const obtenerIndicadoresPorCliente = async (req, res) => {
  const { ruc } = req.params;
  try {
    const [cli] = await pool.query("SELECT id FROM clientes WHERE ruc = ? LIMIT 1", [ruc]);
    if (!cli.length) return res.status(404).json({ message: "Cliente no encontrado" });

    const clienteId = cli[0].id;
    const [rows] = await pool.query(
      `SELECT periodo, num_trabajadores, num_pensionistas, num_prestadores
       FROM indicadores_cliente
       WHERE cliente_id = ?
       ORDER BY periodo ASC`,
      [clienteId]
    );
    res.json(rows);
  } catch (e) {
    console.error("Error al obtener indicadores:", e);
    res.status(500).json({ message: "Error al obtener indicadores" });
  }
};

// POST /api/clientes/:ruc/indicadores  (upsert; acepta 1 o varios)
const upsertIndicadores = async (req, res) => {
  const { ruc } = req.params;
  const payload = Array.isArray(req.body) ? req.body : [req.body];

  try {
    const [cli] = await pool.query("SELECT id FROM clientes WHERE ruc = ? LIMIT 1", [ruc]);
    if (!cli.length) return res.status(404).json({ message: "Cliente no encontrado" });
    const clienteId = cli[0].id;

    // Validación simple de formato YYYY-MM
    for (const it of payload) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(it.periodo)) {
        return res.status(400).json({ message: `Periodo inválido: ${it.periodo}` });
      }
    }

    // Armamos bulk insert ... on duplicate key update
    const values = [];
    for (const it of payload) {
      values.push([
        clienteId,
        it.periodo,
        it.num_trabajadores ?? 0,
        it.num_pensionistas ?? 0,
        it.num_prestadores ?? 0
      ]);
    }

    const sql = `
      INSERT INTO indicadores_cliente
        (cliente_id, periodo, num_trabajadores, num_pensionistas, num_prestadores)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        num_trabajadores = VALUES(num_trabajadores),
        num_pensionistas = VALUES(num_pensionistas),
        num_prestadores = VALUES(num_prestadores)
    `;

    // Nota: con mysql2 .query no acepta "VALUES ?" con array de arrays directamente.
    // Usamos .format para interpolar correctamente.
    const mysql = require('mysql2');
    const formatted = mysql.format(sql, [values]);

    await pool.query(formatted);
    res.json({ message: "Indicadores guardados correctamente" });
  } catch (e) {
    console.error("Error al upsert indicadores:", e);
    res.status(500).json({ message: "Error al guardar indicadores" });
  }
};

module.exports = { obtenerIndicadoresPorCliente, upsertIndicadores };
