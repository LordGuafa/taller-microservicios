import "dotenv/config";
import connectDB from "./config/database";

const express = require("express");
const clientesRoutes = require("./routes/clientes.routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use("/clientes", clientesRoutes);

app.get("/", (req: any, res: any) => {
  res.status(200).json({ mensaje: "cliente-api activa" });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`cliente-api escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

startServer();
