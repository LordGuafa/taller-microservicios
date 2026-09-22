import "dotenv/config";
import { pool } from "./config/database";

const express = require("express");
const clientesRoutes = require("./routes/clientes.routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use("/clientes", clientesRoutes);

app.get("/", (req: any, res: any) => {
  res.status(200).json({ mensaje: "cliente-api activa" });
});

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL conectado");

    app.listen(PORT, () => {
      console.log(`cliente-api escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

startServer();