import { Router } from "@/lib/router";
import { authMiddleware, attachUserIfAuthenticated } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";
import { subtypesController } from "./subtypes.controller";

export const subtypesRoutes = new Router();

// Leitura de subtipos: Pública (Listagem paginada e consulta por ID).
// Registros inativos só são retornados quando o token é de Administrador.
subtypesRoutes.get("/", attachUserIfAuthenticated, (req, ctx) =>
  subtypesController.list(req, ctx),
);
subtypesRoutes.get("/:id", attachUserIfAuthenticated, (req, ctx) =>
  subtypesController.getById(req, ctx),
);

// Mutações de subtipos: Exclusivas de Administrador (role = 3)
subtypesRoutes.post("/", authMiddleware, requireRole(ROLES.ADMIN), (req) =>
  subtypesController.create(req),
);

subtypesRoutes.put("/:id", authMiddleware, requireRole(ROLES.ADMIN), (req, ctx) =>
  subtypesController.update(req, ctx),
);

subtypesRoutes.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (req, ctx) => subtypesController.delete(req, ctx),
);

export default subtypesRoutes;
