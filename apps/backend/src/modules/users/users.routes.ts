import { Router } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";
import { usersController } from "@/modules/users/users.controller";

export const usersRoutes = new Router();

// Todas as rotas de gerenciamento de usuários exigem autenticação e perfil ADMIN (3)
usersRoutes.get("/", authMiddleware, requireRole(ROLES.ADMIN), (req, ctx) =>
  usersController.list(req, ctx),
);

usersRoutes.post("/", authMiddleware, requireRole(ROLES.ADMIN), (req) =>
  usersController.create(req),
);

usersRoutes.get("/:id", authMiddleware, requireRole(ROLES.ADMIN), (req, ctx) =>
  usersController.getById(req, ctx),
);

usersRoutes.put("/:id", authMiddleware, requireRole(ROLES.ADMIN), (req, ctx) =>
  usersController.update(req, ctx),
);

usersRoutes.delete("/:id", authMiddleware, requireRole(ROLES.ADMIN), (req, ctx) =>
  usersController.delete(req, ctx),
);

export default usersRoutes;
