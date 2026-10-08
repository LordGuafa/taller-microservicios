require("dotenv").config();
const express = require("express");
const comprasRoutes = require("./routes/compras.routes");
const { verificarConexion } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "compra-api" });
});

app.get("/", (_req, res) => {
  res.status(200).json({ mensaje: "compra-api activa" });
});

app.use("/compras", comprasRoutes);

app.use((_req, res) => {
  res.status(404).json({ mensaje: "Recurso no encontrado" });
});

async function startServer() {
  try {
    await verificarConexion();

    app.listen(PORT, () => {
      console.log(`compra-api escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

startServer();
