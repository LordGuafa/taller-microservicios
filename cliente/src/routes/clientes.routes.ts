import express from "express";
import { pool } from "../config/database";
import type Cliente from "../model/clientes";

const router = express.Router();

const SELECT_CLIENTES = "SELECT id, nombre, email, created_at, updated_at FROM clientes";

// GET /clientes - listar todos
router.get("/", async (_req, res) => {
  try {
    const resultado = await pool.query<Cliente>(
      `${SELECT_CLIENTES} ORDER BY id`
    );
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error("Error listando clientes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /clientes/:id - obtener por id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    const resultado = await pool.query<Cliente>(
      `${SELECT_CLIENTES} WHERE id = $1`,
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// POST /clientes - crear
router.post("/", async (req, res) => {
  try {
    const { nombre, email } = req.body ?? {};

    if (!nombre || !email) {
      return res
        .status(400)
        .json({ mensaje: "Los campos 'nombre' y 'email' son obligatorios" });
    }

    const resultado = await pool.query<Cliente>(
      "INSERT INTO clientes (nombre, email) VALUES ($1, $2) RETURNING id, nombre, email, created_at, updated_at",
      [nombre, email]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error: any) {
    // Código 23505 = unique_violation (email duplicado en PostgreSQL)
    if (error?.code === "23505") {
      return res.status(409).json({ mensaje: "El email ya está registrado" });
    }
    console.error("Error creando cliente:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;