require("dotenv").config();
require("temporal-polyfill/global");

const app = require("./src/app");
const { db, verificarConexion } = require("./src/config/database");

const PORT = Number(process.env.PORT || 3002);

async function iniciarServidor() {
  try {
    await verificarConexion();

    const server = app.listen(PORT, () => {
      console.log(`producto-api escuchando en el puerto ${PORT}`);
    });

    function apagar(signal) {
      console.log(`${signal} recibido, cerrando...`);
      server.close(async () => {
        await db.close();
        process.exit(0);
      });
    }

    process.on("SIGINT", () => apagar("SIGINT"));
    process.on("SIGTERM", () => apagar("SIGTERM"));
  } catch (error) {
    console.error("Error iniciando el servidor:", error);
    process.exit(1);
  }
}

iniciarServidor();
