const express = require("express");
const router = express.Router();
const { sequelize, Compra, CompraDetalle } = require("../models");
const { obtenerCliente } = require("../services/clienteService");
const { obtenerProducto } = require("../services/productoService");

function parseId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function normalizarCompra(compra) {
  if (!compra) return null;
  const plain = compra.toJSON ? compra.toJSON() : compra;

  const resultado = {
    id: Number(plain.id),
    clienteId: Number(plain.clienteId ?? plain.cliente_id),
    productoId: Number(plain.productoId ?? plain.producto_id),
    cantidad: Number(plain.cantidad),
    total: Number(plain.total),
    fecha: plain.fecha
  };

  if (Array.isArray(plain.detalles)) {
    resultado.detalles = plain.detalles.map((detalle) => ({
      id: Number(detalle.id),
      compraId: Number(detalle.compraId ?? detalle.compra_id),
      productoId: Number(detalle.productoId ?? detalle.producto_id),
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precioUnitario ?? detalle.precio_unitario)
    }));
  }

  return resultado;
}

// ==========================================
// RUTAS GET
// ==========================================

// GET /compras - Listar todas las compras (con filtros opcionales por query params)
router.get("/", async (req, res) => {
  try {
    const where = {};

    if (req.query.clienteId) {
      const clienteId = parseId(req.query.clienteId);
      if (!clienteId) {
        return res.status(400).json({ mensaje: "El parámetro 'clienteId' debe ser un entero positivo" });
      }
      where.clienteId = clienteId;
    }

    if (req.query.productoId) {
      const productoId = parseId(req.query.productoId);
      if (!productoId) {
        return res.status(400).json({ mensaje: "El parámetro 'productoId' debe ser un entero positivo" });
      }
      where.productoId = productoId;
    }

    const compras = await Compra.findAll({
      where,
      include: [{ model: CompraDetalle, as: "detalles" }],
      order: [["id", "ASC"]]
    });

    res.status(200).json(compras.map(normalizarCompra));
  } catch (error) {
    console.error("Error listando compras:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /compras/cliente/:clienteId - Obtener todas las compras de un cliente específico
router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const clienteId = parseId(req.params.clienteId);
    if (!clienteId) {
      return res.status(400).json({ mensaje: "El id del cliente debe ser un entero positivo" });
    }

    const compras = await Compra.findAll({
      where: { clienteId },
      include: [{ model: CompraDetalle, as: "detalles" }],
      order: [["id", "ASC"]]
    });

    res.status(200).json(compras.map(normalizarCompra));
  } catch (error) {
    console.error("Error obteniendo compras por cliente:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /compras/producto/:productoId - Obtener todas las compras de un producto específico
router.get("/producto/:productoId", async (req, res) => {
  try {
    const productoId = parseId(req.params.productoId);
    if (!productoId) {
      return res.status(400).json({ mensaje: "El id del producto debe ser un entero positivo" });
    }

    const compras = await Compra.findAll({
      where: { productoId },
      include: [{ model: CompraDetalle, as: "detalles" }],
      order: [["id", "ASC"]]
    });

    res.status(200).json(compras.map(normalizarCompra));
  } catch (error) {
    console.error("Error obteniendo compras por producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /compras/:id/detalles - Obtener únicamente los detalles de una compra
router.get("/:id/detalles", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const compra = await Compra.findByPk(id);
    if (!compra) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const detalles = await CompraDetalle.findAll({
      where: { compraId: id },
      order: [["id", "ASC"]]
    });

    res.status(200).json(
      detalles.map((d) => ({
        id: Number(d.id),
        compraId: Number(d.compraId),
        productoId: Number(d.productoId),
        cantidad: Number(d.cantidad),
        precioUnitario: Number(d.precioUnitario)
      }))
    );
  } catch (error) {
    console.error("Error obteniendo detalles de compra:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /compras/:id - Obtener una compra por su id con sus detalles
router.get("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const compra = await Compra.findByPk(id, {
      include: [{ model: CompraDetalle, as: "detalles" }]
    });

    if (!compra) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    res.status(200).json(normalizarCompra(compra));
  } catch (error) {
    console.error("Error obteniendo compra:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// ==========================================
// RUTA POST
// ==========================================

// POST /compras - Crear una nueva compra
router.post("/", async (req, res) => {
  try {
    const { clienteId, productoId, cantidad } = req.body ?? {};

    if (!clienteId || !productoId || cantidad === undefined || cantidad === null) {
      return res.status(400).json({
        mensaje: "Los campos 'clienteId', 'productoId' y 'cantidad' son obligatorios"
      });
    }

    const cId = parseId(clienteId);
    const pId = parseId(productoId);
    const cant = parseId(cantidad);

    if (!cId || !pId || !cant) {
      return res.status(400).json({
        mensaje: "Los campos 'clienteId', 'productoId' y 'cantidad' deben ser enteros positivos"
      });
    }

    let cliente;
    let producto;

    try {
      cliente = await obtenerCliente(cId);
      producto = await obtenerProducto(pId);
    } catch (error) {
      return res.status(503).json({
        mensaje: "No se pudo validar la compra porque uno de los servicios no respondió",
        detalle: error.message
      });
    }

    if (!cliente) {
      return res.status(404).json({ mensaje: `El cliente ${cId} no existe` });
    }

    if (!producto) {
      return res.status(404).json({ mensaje: `El producto ${pId} no existe` });
    }

    if (producto.stock < cant) {
      return res.status(400).json({
        mensaje: `Stock insuficiente. Disponible: ${producto.stock}, solicitado: ${cant}`
      });
    }

    const total = Number(producto.precio) * cant;

    const nuevaCompra = await sequelize.transaction(async (t) => {
      const compraCreada = await Compra.create(
        {
          clienteId: cId,
          productoId: pId,
          cantidad: cant,
          total,
          fecha: new Date()
        },
        { transaction: t }
      );

      await CompraDetalle.create(
        {
          compraId: compraCreada.id,
          productoId: pId,
          cantidad: cant,
          precioUnitario: producto.precio
        },
        { transaction: t }
      );

      return await Compra.findByPk(compraCreada.id, {
        include: [{ model: CompraDetalle, as: "detalles" }],
        transaction: t
      });
    });

    res.status(201).json(normalizarCompra(nuevaCompra));
  } catch (error) {
    console.error("Error creando compra:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// ==========================================
// RUTA PUT
// ==========================================

// PUT /compras/:id - Actualizar una compra existente
router.put("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const compra = await Compra.findByPk(id, {
      include: [{ model: CompraDetalle, as: "detalles" }]
    });

    if (!compra) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const { clienteId, productoId, cantidad } = req.body ?? {};

    if (clienteId === undefined && productoId === undefined && cantidad === undefined) {
      return res.status(400).json({ mensaje: "No hay campos para actualizar" });
    }

    const nuevoClienteId = clienteId !== undefined ? parseId(clienteId) : Number(compra.clienteId);
    if (clienteId !== undefined && !nuevoClienteId) {
      return res.status(400).json({ mensaje: "El campo 'clienteId' debe ser un entero positivo" });
    }

    const nuevoProductoId = productoId !== undefined ? parseId(productoId) : Number(compra.productoId);
    if (productoId !== undefined && !nuevoProductoId) {
      return res.status(400).json({ mensaje: "El campo 'productoId' debe ser un entero positivo" });
    }

    const nuevaCantidad = cantidad !== undefined ? parseId(cantidad) : Number(compra.cantidad);
    if (cantidad !== undefined && !nuevaCantidad) {
      return res.status(400).json({ mensaje: "El campo 'cantidad' debe ser un entero positivo" });
    }

    let cliente;
    let producto;

    try {
      cliente = await obtenerCliente(nuevoClienteId);
      producto = await obtenerProducto(nuevoProductoId);
    } catch (error) {
      return res.status(503).json({
        mensaje: "No se pudo validar la actualización porque uno de los servicios no respondió",
        detalle: error.message
      });
    }

    if (!cliente) {
      return res.status(404).json({ mensaje: `El cliente ${nuevoClienteId} no existe` });
    }

    if (!producto) {
      return res.status(404).json({ mensaje: `El producto ${nuevoProductoId} no existe` });
    }

    if (producto.stock < nuevaCantidad) {
      return res.status(400).json({
        mensaje: `Stock insuficiente. Disponible: ${producto.stock}, solicitado: ${nuevaCantidad}`
      });
    }

    const nuevoTotal = Number(producto.precio) * nuevaCantidad;

    const compraActualizada = await sequelize.transaction(async (t) => {
      await compra.update(
        {
          clienteId: nuevoClienteId,
          productoId: nuevoProductoId,
          cantidad: nuevaCantidad,
          total: nuevoTotal
        },
        { transaction: t }
      );

      // Reemplazar o actualizar los detalles de la compra
      await CompraDetalle.destroy({
        where: { compraId: id },
        transaction: t
      });

      await CompraDetalle.create(
        {
          compraId: id,
          productoId: nuevoProductoId,
          cantidad: nuevaCantidad,
          precioUnitario: producto.precio
        },
        { transaction: t }
      );

      return await Compra.findByPk(id, {
        include: [{ model: CompraDetalle, as: "detalles" }],
        transaction: t
      });
    });

    res.status(200).json(normalizarCompra(compraActualizada));
  } catch (error) {
    console.error("Error actualizando compra:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// ==========================================
// RUTA DELETE
// ==========================================

// DELETE /compras/:id - Eliminar una compra existente
router.delete("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const compra = await Compra.findByPk(id);
    if (!compra) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    await sequelize.transaction(async (t) => {
      await CompraDetalle.destroy({
        where: { compraId: id },
        transaction: t
      });

      await compra.destroy({ transaction: t });
    });

    res.status(200).json({
      mensaje: "Compra eliminada correctamente",
      id
    });
  } catch (error) {
    console.error("Error eliminando compra:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
