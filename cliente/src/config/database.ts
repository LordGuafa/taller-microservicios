import "dotenv/config";
// Prisma convierte las columnas de fecha (createdAt/updatedAt) con la API Temporal,
// que Node todavía no trae por defecto. Este polyfill la registra como global.
import "temporal-polyfill/global";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../../prisma/contract.d";
import contractJson from "../../prisma/contract.json" with { type: "json" };

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL no está definido en las variables de entorno");
}

export const db = postgres<Contract>({ contractJson, url });
