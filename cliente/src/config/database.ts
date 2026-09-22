import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "cliente_db",
  user: process.env.DB_USER || "cliente_user",
  password: process.env.DB_PASSWORD || "",
  max: 10,
});

export async function verificarConexion(): Promise<void> {
  await pool.query("SELECT 1");
  console.log("PostgreSQL conectado");
}