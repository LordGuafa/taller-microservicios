import express from "express";
import clientesRouter from "./routes/clientes.routes";
import { errorHandler, HttpError } from "./middlewares/errorHandler";

const app = express();
app.use(express.json());

// JSON no admite bigint (el id es BIGSERIAL). Se envía como texto, igual que lo
// hacía la versión con pg y como lo hace el servicio de productos.
app.set("json replacer", (_clave: string, valor: unknown) =>
  typeof valor === "bigint" ? valor.toString() : valor,
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/clientes", clientesRouter);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Recurso no encontrado"));
});

app.use(errorHandler);

export default app;