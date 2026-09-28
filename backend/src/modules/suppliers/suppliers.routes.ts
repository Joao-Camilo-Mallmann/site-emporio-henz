import { Router } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";
import { suppliersController } from "@/modules/suppliers/suppliers.controller";

export const suppliersRoutes = new Router();

// Leitura: Permitida para ADMIN (3) e VENDEDOR (2)
suppliersRoutes.get(
  "/",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  () => suppliersController.list(),
);

suppliersRoutes.get(
  "/:id",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req, ctx) => suppliersController.getById(req, ctx),
);

// Escrita (Criação, Atualização, Exclusão Lógica): Exclusiva de ADMIN (3)
suppliersRoutes.post("/", authMiddleware, requireRole(ROLES.ADMIN), (req) =>
  suppliersController.create(req),
);

suppliersRoutes.put(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => suppliersController.update(req, ctx),
);

suppliersRoutes.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => suppliersController.delete(req, ctx),
);

export default suppliersRoutes;
