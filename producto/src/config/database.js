require("dotenv").config();
require("temporal-polyfill/global");

const postgres = require("@prisma/orm-postgres/runtime").default;
const contractJson = require("../../prisma/contract.json");

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL no está definido en las variables de entorno");
}

const db = postgres({ contractJson, url });

async function verificarConexion() {
  await db.orm.public.Producto.all();
  console.log("PostgreSQL conectado");
}

module.exports = { db, verificarConexion };
