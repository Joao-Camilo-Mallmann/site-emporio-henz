import { Router } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";
import { userSuppliersController } from "@/modules/user-suppliers/user-suppliers.controller";

export const userSuppliersRoutes = new Router();

// Todas as rotas de vínculo vendedor ↔ fornecedor exigem ADMIN (3)
userSuppliersRoutes.get(
  "/:userId/suppliers",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => userSuppliersController.list(req, ctx),
);

userSuppliersRoutes.post(
  "/:userId/suppliers",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => userSuppliersController.assign(req, ctx),
);

userSuppliersRoutes.delete(
  "/:userId/suppliers/:supplierId",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => userSuppliersController.revoke(req, ctx),
);

export default userSuppliersRoutes;
