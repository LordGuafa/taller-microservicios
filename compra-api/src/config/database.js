const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize(
      process.env.DB_NAME || "compra_db",
      process.env.DB_USER || "compra_user",
      process.env.DB_PASSWORD || "compra_pass_123",
      {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        dialect: "postgres",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

async function verificarConexion() {
  await sequelize.authenticate();
  console.log("PostgreSQL conectado con Sequelize");
}

module.exports = { sequelize, verificarConexion };
