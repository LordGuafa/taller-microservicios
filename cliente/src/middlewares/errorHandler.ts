import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

interface ErrorDeCliente {
    status: number;
    message: string;
    type?: string;
}

function esErrorDeCliente(err: unknown): err is ErrorDeCliente {
    if (typeof err !== "object" || err === null) return false;
    const { status, expose } = err as { status?: unknown; expose?: unknown };
    return (
        typeof status === "number" &&
        status >= 400 &&
        status < 500 &&
        expose === true
    );
}

// Errores de PostgreSQL que Prisma reenvía con el código SQLSTATE
function esViolacionDeUnicidad(
    err: unknown,
): err is { sqlState: "23505"; constraint?: string } {
    return (
        typeof err === "object" &&
        err !== null &&
        (err as { sqlState?: unknown }).sqlState === "23505"
    );
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof HttpError) {
        res.status(err.status).json({ mensaje: err.message });
        return
    }
    // Errores de express.json() (body-parser): cuerpo mal formado, demasiado grande, etc.
    // Traen un status 4xx y `type` que describe el problema.
    if (esErrorDeCliente(err)) {
        const mensaje =
            err.type === "entity.parse.failed"
                ? "El cuerpo de la petición no es un JSON válido"
                : err.message;
        res.status(err.status).json({ mensaje });
        return
    }
    // 23505 = unique_violation: la tabla clientes tiene un índice único sobre email
    if (esViolacionDeUnicidad(err)) {
        const mensaje =
            err.constraint === "idx_clientes_email"
                ? "El email ya está registrado"
                : "Ya existe un registro con esos datos";
        res.status(409).json({ mensaje });
        return
    }
    console.error(err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
}