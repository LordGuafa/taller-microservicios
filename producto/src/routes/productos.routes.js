const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");

const SELECT_PRODUCTOS = "SELECT id, nombre, precio, stock FROM productos";

function normalizarProducto(producto) {
  return {
    ...producto,
    precio: Number(producto.precio)
  };
}

// GET /productos
router.get("/", async (_req, res) => {
  try {
    const resultado = await pool.query(`${SELECT_PRODUCTOS} ORDER BY id`);
    res.status(200).json(resultado.rows.map(normalizarProducto));
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

    const resultado = await pool.query(`${SELECT_PRODUCTOS} WHERE id = $1`, [id]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.status(200).json(normalizarProducto(resultado.rows[0]));
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

    const resultado = await pool.query(
      "INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING id, nombre, precio, stock",
      [nombre, precio, stock]
    );

    res.status(201).json(normalizarProducto(resultado.rows[0]));
  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;