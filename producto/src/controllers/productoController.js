const { Producto } = require("../models/producto");
const { HttpError } = require("../middlewares/errorHandler");

const MAX_BIGINT_PG = 9223372036854775807n;

function parseId(valor) {
  if (!/^\d+$/.test(valor)) {
    throw new HttpError(404, "Producto no encontrado");
  }

  const id = BigInt(valor);
  if (id <= 0n || id > MAX_BIGINT_PG) {
    throw new HttpError(404, "Producto no encontrado");
  }

  return id;
}

function normalizarProducto(producto) {
  return {
    ...producto,
    id: Number(producto.id),
    precio: Number(producto.precio)
  };
}

function validarDatosProducto(body) {
  const { nombre, precio, stock } = body ?? {};

  if (!nombre || precio === undefined || stock === undefined) {
    throw new HttpError(
      400,
      "Los campos 'nombre', 'precio' y 'stock' son obligatorios"
    );
  }

  return { nombre, precio, stock };
}

const productoController = {
  listar: async (_req, res, next) => {
    try {
      const productos = await Producto.listar();
      res.status(200).json(productos.map(normalizarProducto));
    } catch (error) {
      next(error);
    }
  },

  obtenerPorId: async (req, res, next) => {
    try {
      const producto = await Producto.obtenerPorId(parseId(req.params.id));

      if (!producto) {
        throw new HttpError(404, "Producto no encontrado");
      }

      res.status(200).json(normalizarProducto(producto));
    } catch (error) {
      next(error);
    }
  },

  crear: async (req, res, next) => {
    try {
      const producto = await Producto.crear(validarDatosProducto(req.body));
      res.status(201).json(normalizarProducto(producto));
    } catch (error) {
      next(error);
    }
  },

  actualizar: async (req, res, next) => {
    try {
      const producto = await Producto.actualizar(
        parseId(req.params.id),
        validarDatosProducto(req.body)
      );

      if (!producto) {
        throw new HttpError(404, "Producto no encontrado");
      }

      res.status(200).json(normalizarProducto(producto));
    } catch (error) {
      next(error);
    }
  },

  eliminar: async (req, res, next) => {
    try {
      const eliminado = await Producto.eliminar(parseId(req.params.id));

      if (!eliminado) {
        throw new HttpError(404, "Producto no encontrado");
      }

      res.status(200).json({ mensaje: "Producto eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = { productoController };
