class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = "HttpError";
    this.status = status;
  }
}

function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ mensaje: "El cuerpo debe contener JSON válido" });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ mensaje: error.message });
  }

  console.error("Error interno del servidor:", error);
  return res.status(500).json({ mensaje: "Error interno del servidor" });
}

module.exports = { HttpError, errorHandler };
