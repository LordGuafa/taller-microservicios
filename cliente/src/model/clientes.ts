import mongoose from "mongoose";

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Atributos persistidos en Mongo (el `id` se deriva de `_id` en el transform de toJSON)
export type ClientePersistido = Omit<Cliente, "id">;

const clienteSchema = new mongoose.Schema<ClientePersistido>(
  {
    nombre: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const ClienteModel = mongoose.model<ClientePersistido>(
  "Cliente",
  clienteSchema,
);
