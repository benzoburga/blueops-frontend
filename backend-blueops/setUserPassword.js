// setUserPassword.js
const { pool } = require("./src/config/db");
const bcrypt = require("bcrypt");

(async () => {
  const [dni, plain] = process.argv.slice(2);
  if (!dni || !plain) {
    console.log("Uso: node setUserPassword.js <dni> <passwordPlano>");
    process.exit(1);
  }

  const hash = await bcrypt.hash(String(plain), 10);
  const [r] = await pool.query(
    "UPDATE usuarios SET password = ?, estado = 1 WHERE dni = ?",
    [hash, String(dni).trim()]
  );

  console.log(`OK. Filas afectadas: ${r.affectedRows}`);
  process.exit(0);
})();
