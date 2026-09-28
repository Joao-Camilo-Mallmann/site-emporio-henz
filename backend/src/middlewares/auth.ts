import { unauthorized } from "@/lib/response";
import { verifyJwt } from "@/lib/jwt";
import { RequestContext, RouteHandler } from "@/lib/router";

export const authMiddleware: RouteHandler = async (
  req: Request,
  ctx: RequestContext,
) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized("Token de autenticação não fornecido.");
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return unauthorized("Token de autenticação ausente.");
  }

  const payload = await verifyJwt(token);
  if (!payload || !payload.id || !payload.email || typeof payload.role !== "number") {
    return unauthorized("Token de autenticação inválido ou expirado.");
  }

  ctx.user = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };
};

export default authMiddleware;
