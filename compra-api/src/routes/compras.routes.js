const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { obtenerCliente } = require("../services/clienteService");
const { obtenerProducto } = require("../services/productoService");

const SELECT_COMPRAS = "SELECT id, cliente_id, producto_id, cantidad, total, fecha FROM compras";

function normalizarCompra(compra) {
  return {
    id: Number(compra.id),
    clienteId: Number(compra.cliente_id),
    productoId: Number(compra.producto_id),
    cantidad: Number(compra.cantidad),
    total: Number(compra.total),
    fecha: compra.fecha
  };
}

// GET /compras
router.get("/", async (_req, res) => {
  try {
    const resultado = await pool.query(`${SELECT_COMPRAS} ORDER BY id`);
    res.status(200).json(resultado.rows.map(normalizarCompra));
  } catch (error) {
    console.error("Error listando compras:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /compras/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const resultado = await pool.query(`${SELECT_COMPRAS} WHERE id = $1`, [id]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    res.status(200).json(normalizarCompra(resultado.rows[0]));
  } catch (error) {
    console.error("Error obteniendo compra:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// POST /compras
router.post("/", async (req, res) => {
  try {
    const { clienteId, productoId, cantidad } = req.body ?? {};

    if (!clienteId || !productoId || !cantidad) {
      return res.status(400).json({
        mensaje: "Los campos 'clienteId', 'productoId' y 'cantidad' son obligatorios"
      });
    }

    if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
      return res.status(400).json({
        mensaje: "El campo 'cantidad' debe ser un número entero positivo"
      });
    }

    let cliente;
    let producto;

    try {
      cliente = await obtenerCliente(clienteId);
      producto = await obtenerProducto(productoId);
    } catch (error) {
      return res.status(503).json({
        mensaje: "No se pudo validar la compra porque uno de los servicios no respondió",
        detalle: error.message
      });
    }

    if (!cliente) {
      return res.status(404).json({ mensaje: `El cliente ${clienteId} no existe` });
    }

    if (!producto) {
      return res.status(404).json({ mensaje: `El producto ${productoId} no existe` });
    }

    if (producto.stock < cantidad) {
      return res.status(400).json({
        mensaje: `Stock insuficiente. Disponible: ${producto.stock}, solicitado: ${cantidad}`
      });
    }

    const total = Number(producto.precio) * Number(cantidad);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertCompra = await client.query(
        "INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, cliente_id, producto_id, cantidad, total, fecha",
        [clienteId, productoId, cantidad, total]
      );

      const nuevaCompra = insertCompra.rows[0];

      await client.query(
        "INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)",
        [nuevaCompra.id, productoId, cantidad, producto.precio]
      );

      await client.query("COMMIT");

      res.status(201).json(normalizarCompra(nuevaCompra));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creando compra:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
