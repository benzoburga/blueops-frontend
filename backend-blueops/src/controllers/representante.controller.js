const { pool } = require("../config/db");

const obtenerRepresentantesPorCliente = async (req, res) => {
  const { ruc } = req.params;
  try {
    const [rowsCliente] = await pool.query("SELECT id FROM clientes WHERE ruc = ?", [ruc]);
    if (rowsCliente.length === 0) return res.status(404).json({ message: "Cliente no encontrado" });

    const clienteId = rowsCliente[0].id;
    console.log("🟢 clienteId:", clienteId);

    const [rows] = await pool.query(
      `SELECT 
         rl.id,
         rl.numero_documento,
         rl.nombre,
         rl.cargo,
         rl.fecha_desde,
         ti.nombre AS tipo_documento
       FROM representantes_legales rl
       JOIN tipos_identificacion ti ON rl.tipo_documento_id = ti.id
       WHERE rl.cliente_id = ?`,
      [clienteId]
    );

    console.log("🟢 representantes:", rows);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener representantes:", error);
    res.status(500).json({ message: "Error al obtener representantes" });
  }
};

const crearRepresentante = async (req, res) => {
  const { ruc } = req.params;
  const { tipo_documento_id, numero_documento, nombre, cargo, fecha_desde } = req.body;

  try {
    const [rowsCliente] = await pool.query("SELECT id FROM clientes WHERE ruc = ?", [ruc]);
    if (rowsCliente.length === 0) return res.status(404).json({ message: "Cliente no encontrado" });

    const clienteId = rowsCliente[0].id;
    await pool.query(
      "INSERT INTO representantes_legales (cliente_id, tipo_documento_id, numero_documento, nombre, cargo, fecha_desde) VALUES (?, ?, ?, ?, ?, ?)",
      [clienteId, tipo_documento_id, numero_documento, nombre, cargo, fecha_desde]
    );

    res.json({ message: "Representante agregado correctamente" });
  } catch (error) {
    console.error("Error al crear representante:", error.message);
    res.status(500).json({ message: "Error al crear representante" });
  }
};

module.exports = { obtenerRepresentantesPorCliente, crearRepresentante };
