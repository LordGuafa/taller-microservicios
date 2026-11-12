import "dotenv/config";
import app from "./src/app";
import { db } from "./src/config/database";

const PORT = Number(process.env.PORT ?? 3001);

const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Cierre ordenado: deja de aceptar peticiones y cierra las conexiones a la BD
function apagar(signal: string): void {
  console.log(`${signal} recibido, cerrando...`);
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => apagar("SIGINT"));
process.on("SIGTERM", () => apagar("SIGTERM"));
