import { forbidden, unauthorized } from "@/lib/response";
import { RequestContext, RouteHandler } from "@/lib/router";

export const ROLES = {
  CUSTOMER: 1,
  SELLER: 2,
  ADMIN: 3,
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export function isAdmin(ctx: RequestContext): boolean {
  return ctx.user?.role === ROLES.ADMIN;
}

export function requireRole(...allowedRoles: number[]): RouteHandler {
  return (_req: Request, ctx: RequestContext) => {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    // Administradores têm acesso global, independentemente dos papéis permitidos.
    if (ctx.user.role === ROLES.ADMIN) {
      return;
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      return forbidden("Você não possui permissão para executar esta ação.");
    }
  };
}

export default requireRole;
