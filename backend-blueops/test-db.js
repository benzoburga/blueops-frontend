require('dotenv').config({ path: '../.env.production' });
const mysql = require("mysql2/promise");

async function test() {
  try {
    console.log("Intentando conectar a Railway...");

    const pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      waitForConnections: true
    });

    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    console.log("Conectado exitosamente ✔");
    console.log(rows);

  } catch (err) {
    console.log("❌ Error conectando a la BD:");
    console.log(err);
  }
}

test();
