require("dotenv").config();
const express = require("express");
const comprasRoutes = require("./routes/compras.routes");
const { verificarConexion } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use("/compras", comprasRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ mensaje: "compra-api activa" });
});

async function startServer() {
  try {
    await verificarConexion();

    app.listen(PORT, () => {
      console.log(`compra-api escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

startServer();
