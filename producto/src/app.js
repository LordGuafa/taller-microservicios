const express = require("express");
const productoRoutes = require("./routes/productoRoutes");
const { HttpError, errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(express.json());

app.set("json replacer", (_clave, valor) =>
  typeof valor === "bigint" ? valor.toString() : valor
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.status(200).json({ mensaje: "producto-api activa" });
});

app.use("/productos", productoRoutes);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Recurso no encontrado"));
});

app.use(errorHandler);

module.exports = app;
