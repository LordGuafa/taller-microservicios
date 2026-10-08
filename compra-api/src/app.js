const express = require("express");
const comprasRoutes = require("./routes/compras.routes");

const app = express();

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

module.exports = app;
