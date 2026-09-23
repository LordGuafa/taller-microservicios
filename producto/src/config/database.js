const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "producto_db",
  user: process.env.DB_USER || "producto_user",
  password: process.env.DB_PASSWORD || "producto_pass_123",
  max: 10
});

async function verificarConexion() {
  await pool.query("SELECT 1");
  console.log("PostgreSQL conectado");
}

module.exports = { pool, verificarConexion };
