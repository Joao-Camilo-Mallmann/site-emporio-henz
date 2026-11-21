import { Router } from "@/lib/router";
import { attachUserIfAuthenticated, authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/rbac";
import { suppliersController } from "@/modules/suppliers/suppliers.controller";

export const suppliersRoutes = new Router();

// Leitura pública da listagem de fornecedores.
// Visitantes/CLIENTES recebem apenas fornecedores ativos (sem contato);
// VENDEDOR (2) recebe apenas fornecedores vinculados (RF16); ADMIN (3) recebe todos.
suppliersRoutes.get("/", attachUserIfAuthenticated, (req, ctx) =>
  suppliersController.list(req, ctx),
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
