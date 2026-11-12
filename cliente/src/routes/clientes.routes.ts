import { Router } from "express";
import { clientesController } from "../controllers/clientes.controller";

const router = Router();

router.get("/", clientesController.listar);
router.get("/:id", clientesController.obtenerPorId);
router.post("/", clientesController.crear);
router.put("/:id", clientesController.actualizar);
router.delete("/:id", clientesController.eliminar);

export default router;
