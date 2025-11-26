// src/controllers/auth.controller.js
const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ⚠️ No congeles el secreto al cargar el módulo
function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    // En prod no permitimos fallback: evita tokens mal firmados
    throw new Error("JWT_SECRET no configurado");
  }
  return s;
}

const login = async (req, res) => {
  const dni = String(req.body.dni ?? "").trim();
  const password = String(req.body.password ?? "");

  try {
    const [rows] = await pool.query(
      `SELECT id, dni, nombre, email, rol, password, estado, cliente_id, trabajador_id
       FROM usuarios WHERE dni = ? LIMIT 1`,
      [dni]
    );

    if (rows.length === 0) return res.status(401).json({ msg: "DNI no encontrado" });

    const user = rows[0];
    if (user.estado !== 1) return res.status(403).json({ msg: "Usuario inactivo" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ msg: "Contraseña incorrecta" });

    // 1) Resolver cliente_id
    let resolvedClienteId = user.cliente_id ?? null;
    if (!resolvedClienteId && user.trabajador_id) {
      const [tRows] = await pool.query(
        `SELECT cliente_id FROM trabajadores WHERE id = ? LIMIT 1`,
        [user.trabajador_id]
      );
      if (tRows.length) resolvedClienteId = tRows[0].cliente_id ?? null;
    }
    if (resolvedClienteId != null) resolvedClienteId = Number(resolvedClienteId);

    // 2) Datos del cliente (opcional)
    let ruc_cliente = null;
    let cliente_nombre = null;
    if (resolvedClienteId) {
      const [cliRows] = await pool.query(
        `SELECT * FROM clientes WHERE id = ? LIMIT 1`,
        [resolvedClienteId]
      );
      if (cliRows.length) {
        const cli = cliRows[0];
        ruc_cliente =
          cli?.ruc ?? cli?.numero_documento ?? cli?.num_documento ?? cli?.documento ?? cli?.ruc_cliente ?? null;
        cliente_nombre =
          cli?.nombre ?? cli?.nombre_comercial ?? cli?.razon_social ?? null;
      }
    }

    const safeUser = {
      id: user.id,
      cliente_id: resolvedClienteId,
      trabajador_id: user.trabajador_id ?? null,
      dni: user.dni,
      email: user.email ?? null,
      rol: user.rol,
      nombre: user.nombre,
      ruc_cliente,
      cliente_nombre,
    };

    // 3) Firmar JWT con el secreto ACTUAL del entorno
    const token = jwt.sign(
      {
        id: safeUser.id,
        cliente_id: safeUser.cliente_id,
        dni: safeUser.dni,
        email: safeUser.email,
        rol: safeUser.rol,
        nombre: safeUser.nombre,
      },
      getJwtSecret(),                // 👈 ya no usamos constante congelada
      { expiresIn: "12h" }
    );

    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

module.exports = { login };
