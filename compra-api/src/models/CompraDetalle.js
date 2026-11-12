const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CompraDetalle = sequelize.define(
  "CompraDetalle",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    compraId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "compra_id",
      validate: {
        notNull: { msg: "El campo compraId es obligatorio" }
      }
    },
    productoId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "producto_id",
      validate: {
        notNull: { msg: "El campo productoId es obligatorio" }
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "La cantidad en el detalle debe ser mayor a 0"
        }
      }
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "precio_unitario",
      validate: {
        min: {
          args: [0.01],
          msg: "El precio unitario debe ser mayor a 0"
        }
      }
    }
  },
  {
    tableName: "compra_detalle",
    timestamps: false
  }
);

module.exports = CompraDetalle;
