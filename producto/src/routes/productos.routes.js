const express = require("express");
const router = express.Router();
const { Producto } = require("../models/productos");

function normalizarProducto(producto) {
  return {
    ...producto,
    id: Number(producto.id),
    precio: Number(producto.precio)
  };
}

// GET /productos
router.get("/", async (_req, res) => {
  try {
    const productos = await Producto.listar();
    res.status(200).json(productos.map(normalizarProducto));
  } catch (error) {
    console.error("Error listando productos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /productos/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    const producto = await Producto.obtenerPorId(BigInt(id));

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.status(200).json(normalizarProducto(producto));
  } catch (error) {
    console.error("Error obteniendo producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// POST /productos
router.post("/", async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body ?? {};

    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({
        mensaje: "Los campos 'nombre', 'precio' y 'stock' son obligatorios"
      });
    }

    const producto = await Producto.crear({ nombre, precio, stock });

    res.status(201).json(normalizarProducto(producto));
  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});
// PUT /productos/:id
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, precio, stock } = req.body ?? {};

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({
        mensaje: "Los campos 'nombre', 'precio' y 'stock' son obligatorios"
      });
    }

    const producto = await Producto.actualizar(BigInt(id), {
      nombre,
      precio,
      stock
    });

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.status(200).json(normalizarProducto(producto));
  } catch (error) {
    console.error("Error actualizando producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// DELETE /productos/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    const eliminado = await Producto.eliminar(BigInt(id));

    if (!eliminado) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.status(200).json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;