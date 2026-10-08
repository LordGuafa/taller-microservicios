require("dotenv").config();
const app = require("./app");
const { verificarConexion, sequelize } = require("./config/database");

const PORT = process.env.PORT || 3003;

async function startServer() {
  try {
    await verificarConexion();

    const server = app.listen(PORT, () => {
      console.log(`compra-api escuchando en el puerto ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} recibido, cerrando servidor...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log("Conexión a la base de datos cerrada.");
          process.exit(0);
        } catch (err) {
          console.error("Error cerrando conexión a la base de datos:", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

startServer();
