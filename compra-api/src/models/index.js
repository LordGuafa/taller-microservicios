const { sequelize } = require("../config/database");
const Compra = require("./Compra");
const CompraDetalle = require("./CompraDetalle");

Compra.hasMany(CompraDetalle, {
  foreignKey: "compraId",
  as: "detalles",
  onDelete: "CASCADE"
});

CompraDetalle.belongsTo(Compra, {
  foreignKey: "compraId",
  as: "compra"
});

module.exports = {
  sequelize,
  Compra,
  CompraDetalle
};
