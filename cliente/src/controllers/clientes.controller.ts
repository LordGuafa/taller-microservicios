import type { NextFunction, Request, Response } from "express";
import type { Varchar } from "@prisma/orm-postgres/target/codec-types";
import {
  Cliente,
  type ActualizarCliente,
  type NuevoCliente,
} from "../models/clientes";
import { HttpError } from "../middlewares/errorHandler";

// Funciones auxiliares

// ---------- Validación de entrada (los tipos de TS no existen en runtime) ----------

// La columna id es BIGSERIAL (int8), así que Prisma trabaja con bigint.
const MAX_BIGINT_PG = 9223372036854775807n;

function parseId(valor: string): bigint {
  if (!/^\d+$/.test(valor)) {
    throw new HttpError(400, "El id debe ser un entero positivo");
  }
  const id = BigInt(valor);
  if (id <= 0n || id > MAX_BIGINT_PG) {
    throw new HttpError(400, "El id debe ser un entero positivo");
  }
  return id;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

// Prisma tipa las columnas VARCHAR(N) como Varchar<N>: un string "marcado" que
// solo se obtiene después de comprobar que cabe en la columna.
function textoValido<N extends number>(
  valor: unknown,
  campo: string,
  maximo: N,
): Varchar<N> {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new HttpError(400, `"${campo}" es obligatorio y debe ser texto`);
  }
  const texto = valor.trim();
  if (texto.length > maximo) {
    throw new HttpError(400, `"${campo}" no puede superar ${maximo} caracteres`);
  }
  return texto as Varchar<N>;
}

// Longitudes de las columnas en la tabla clientes
const MAX_NOMBRE = 100 as const;
const MAX_EMAIL = 255 as const;

function parseNuevoCliente(body: unknown): NuevoCliente {
  if (!esObjeto(body)) {
    throw new HttpError(400, "El cuerpo debe ser un objeto JSON");
  }
  return {
    nombre: textoValido(body.nombre, "nombre", MAX_NOMBRE),
    email: textoValido(body.email, "email", MAX_EMAIL),
  };
}

function parseActualizarCliente(body: unknown): ActualizarCliente {
  if (!esObjeto(body)) {
    throw new HttpError(400, "El cuerpo debe ser un objeto JSON");
  }
  const datos: ActualizarCliente = {};
  if ("nombre" in body) datos.nombre = textoValido(body.nombre, "nombre", MAX_NOMBRE);
  if ("email" in body) datos.email = textoValido(body.email, "email", MAX_EMAIL);

  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, "No hay campos para actualizar");
  }
  return datos;
}

export const clientesController = {
  listar: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.json(await Cliente.listar());
    } catch (error) {
      next(error);
    }
  },

  obtenerPorId: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const cliente = await Cliente.obtenerPorId(parseId(req.params.id));
      if (!cliente) {
        throw new HttpError(404, "Cliente no encontrado");
      }
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  },

  crear: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const cliente = await Cliente.crear(parseNuevoCliente(req.body));
      res.status(201).json(cliente);
    } catch (error) {
      next(error);
    }
  },

  actualizar: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = parseId(req.params.id);
      const cliente = await Cliente.actualizar(
        id,
        parseActualizarCliente(req.body),
      );
      if (!cliente) {
        throw new HttpError(404, "Cliente no encontrado");
      }
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  },

  eliminar: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const eliminado = await Cliente.eliminar(parseId(req.params.id));
      if (!eliminado) {
        throw new HttpError(404, "Cliente no encontrado");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
