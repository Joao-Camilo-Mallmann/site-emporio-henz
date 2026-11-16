import { Router } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";
import { atendimentoController } from "@/modules/atendimento/atendimento.controller";

export const atendimentoRoutes = new Router();

// Só equipe da loja (vendedor e administrador) consulta as listas de um cliente
atendimentoRoutes.get(
  "/cliente",
  authMiddleware,
  requireRole(ROLES.SELLER, ROLES.ADMIN),
  (req) => atendimentoController.findClient(req),
);

export default atendimentoRoutes;
