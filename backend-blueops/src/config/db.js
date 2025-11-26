//db.js
const mysql = require("mysql2/promise");

let pool;

if (process.env.DB_URL) {
  pool = mysql.createPool({
    uri: process.env.DB_URL,
    waitForConnections: true,
    connectionLimit: 10
  });
} else {
  throw new Error("DB_URL no está definido en .env.production");
}

module.exports = { pool };
