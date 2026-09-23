require("dotenv").config();
const express = require("express");
const productosRoutes = require("./routes/productos.routes");
const { verificarConexion } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use("/productos", productosRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ mensaje: "producto-api activa" });
});

async function startServer() {
  try {
    await verificarConexion();

    app.listen(PORT, () => {
      console.log(`producto-api escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

startServer();