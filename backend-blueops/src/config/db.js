//db.js
const mysql = require("mysql2/promise");
const { DiBackbone } = require("react-icons/di");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "blueops_db",
  connectionLimit: 10,
  // 👇 importante
  charset: 'utf8mb4'
});

pool.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

module.exports = { pool };
