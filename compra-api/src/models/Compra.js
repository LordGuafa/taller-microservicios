const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Compra = sequelize.define(
  "Compra",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    clienteId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "cliente_id",
      validate: {
        notNull: { msg: "El campo clienteId es obligatorio" }
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
      defaultValue: 1,
      validate: {
        min: {
          args: [1],
          msg: "La cantidad debe ser mayor a 0"
        }
      }
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "El total no puede ser negativo"
        }
      }
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "fecha"
    }
  },
  {
    tableName: "compras",
    timestamps: false
  }
);

module.exports = Compra;
