import express from "express";
import mongoose from "mongoose";
import { ClienteModel } from "../model/clientes";

const router = express.Router();

// GET /clientes - listar todos
router.get("/", async (_req, res) => {
  try {
    const clientes = await ClienteModel.find();
    res.status(200).json(clientes);
  } catch (error) {
    console.error("Error listando clientes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /clientes/:id - obtener por id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    const cliente = await ClienteModel.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.status(200).json(cliente);
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// POST /clientes - crear
router.post("/", async (req, res) => {
  try {
    const { nombre, email } = req.body;

    if (!nombre || !email) {
      return res
        .status(400)
        .json({ mensaje: "Los campos 'nombre' y 'email' son obligatorios" });
    }

    const nuevoCliente = await ClienteModel.create({ nombre, email });
    res.status(201).json(nuevoCliente);
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ mensaje: "El email ya está registrado" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ mensaje: error.message });
    }
    console.error("Error creando cliente:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
