import { userFromToken } from "@/lib/jwt";
import { unauthorized } from "@/lib/response";
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

  const user = await userFromToken(token);
  if (!user) {
    return unauthorized("Token de autenticação inválido ou expirado.");
  }

  ctx.user = user;
};

// Rotas públicas que mudam de comportamento para usuários autenticados: anexa o
// usuário quando o token é válido e segue como visitante anônimo caso contrário.
export const attachUserIfAuthenticated: RouteHandler = async (
  req: Request,
  ctx: RequestContext,
) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return;
  }

  const user = await userFromToken(token);
  if (user) {
    ctx.user = user;
  }
};

export default authMiddleware;
