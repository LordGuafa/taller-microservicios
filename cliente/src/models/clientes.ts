import { db } from "../config/database";
import type { Models } from "../../prisma/contract.d";
import type { Scalars } from "@prisma/orm-postgres/family-contract/types";

export type ClienteRow = Scalars<Models.public_Cliente>;
export type NuevoCliente = Omit<ClienteRow, "id" | "createdAt" | "updatedAt">;
export type ActualizarCliente = Partial<NuevoCliente>;

export const Cliente = {
  crear: (datos: NuevoCliente) => db.orm.public.Cliente.create(datos),

  listar: () => db.orm.public.Cliente.all(),

  obtenerPorId: (id: bigint) => db.orm.public.Cliente.where({ id }).first(),

  actualizar: async (id: bigint, datos: ActualizarCliente) => {
    const cliente = await db.orm.public.Cliente.where({ id }).first();

    if (!cliente) return null;

    return db.orm.public.Cliente.where({ id }).update(datos);
  },

  eliminar: async (id: bigint): Promise<boolean> => {
    const existente = await db.orm.public.Cliente.where({ id }).first();

    if (!existente) return false;

    await db.orm.public.Cliente.where({ id }).delete();
    return true;
  },
};
