const express = require("express");
const router = express.Router();
const {
  listarCompras,
  obtenerComprasPorCliente,
  obtenerComprasPorProducto,
  obtenerDetallesCompra,
  obtenerCompraPorId,
  crearCompra,
  actualizarCompra,
  eliminarCompra
} = require("../controllers/compras.controller");

// ==========================================
// RUTAS GET
// ==========================================

// GET /compras - Listar todas las compras (con filtros opcionales por query params)
router.get("/", listarCompras);

// GET /compras/cliente/:clienteId - Obtener todas las compras de un cliente específico
router.get("/cliente/:clienteId", obtenerComprasPorCliente);

// GET /compras/producto/:productoId - Obtener todas las compras de un producto específico
router.get("/producto/:productoId", obtenerComprasPorProducto);

// GET /compras/:id/detalles - Obtener únicamente los detalles de una compra
router.get("/:id/detalles", obtenerDetallesCompra);

// GET /compras/:id - Obtener una compra por su id con sus detalles
router.get("/:id", obtenerCompraPorId);

// ==========================================
// RUTA POST
// ==========================================

// POST /compras - Crear una nueva compra
router.post("/", crearCompra);

// ==========================================
// RUTA PUT
// ==========================================

// PUT /compras/:id - Actualizar una compra existente
router.put("/:id", actualizarCompra);

// ==========================================
// RUTA DELETE
// ==========================================

// DELETE /compras/:id - Eliminar una compra existente
router.delete("/:id", eliminarCompra);

module.exports = router;
