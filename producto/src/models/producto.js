const { db } = require("../config/database");

const Producto = {
  crear: (datos) => db.orm.public.Producto.create(datos),

  listar: () => db.orm.public.Producto.all(),

  obtenerPorId: (id) => db.orm.public.Producto.where({ id }).first(),

  actualizar: async (id, datos) => {
    const producto = await db.orm.public.Producto.where({ id }).first();

    if (!producto) return null;

    return db.orm.public.Producto.where({ id }).update(datos);
  },

  eliminar: async (id) => {
    const producto = await db.orm.public.Producto.where({ id }).first();

    if (!producto) return false;

    await db.orm.public.Producto.where({ id }).delete();
    return true;
  }
};

module.exports = { Producto };
