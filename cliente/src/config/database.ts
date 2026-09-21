import mongoose from "mongoose";

async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI no está definida en el .env");
  }

  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || "clientes",
  });
  console.log(`MongoDB conectado: ${mongoose.connection.name}`);
}

export default connectDB;
