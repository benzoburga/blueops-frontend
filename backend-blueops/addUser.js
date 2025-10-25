// addUser.js
const { pool } = require("./src/config/db");
const bcrypt = require("bcrypt");

(async () => {
  const [dni, nombre, rol, plain, clienteId = null, trabajadorId = null] = process.argv.slice(2);
  if (!dni || !nombre || !rol || !plain) {
    console.log('Uso: node addUser.js <dni> "<nombre>" <rol> <passwordPlano> [clienteId] [trabajadorId]');
    process.exit(1);
  }
  const hash = await bcrypt.hash(String(plain), 10);
  const [ins] = await pool.query(
    `INSERT INTO usuarios (dni, nombre, email, rol, password, estado, cliente_id, trabajador_id)
     VALUES (?, ?, NULL, ?, ?, 1, ?, ?)`,
    [String(dni).trim(), nombre.trim(), rol, hash, clienteId, trabajadorId]
  );
  console.log("Usuario creado id:", ins.insertId);
  process.exit(0);
})();
