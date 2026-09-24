import { forbidden, unauthorized } from "@/lib/response";
import { RequestContext, RouteHandler } from "@/lib/router";

export const ROLES = {
  CUSTOMER: 1,
  SELLER: 2,
  ADMIN: 3,
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export function requireRole(...allowedRoles: number[]): RouteHandler {
  return (_req: Request, ctx: RequestContext) => {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    // Papel ADMIN (3) tem bypass/permissão em todos os endpoints administrativos
    if (ctx.user.role === ROLES.ADMIN) {
      return;
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      return forbidden("Você não possui permissão para executar esta ação.");
    }
  };
}

export default requireRole;
