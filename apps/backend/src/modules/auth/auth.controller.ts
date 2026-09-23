import { badRequest, created, ok, unauthorized } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import { authService, AuthService } from "@/modules/auth/auth.service";
import { validateLogin, validateRegister } from "@/modules/auth/auth.schema";

export class AuthController {
  constructor(private service: AuthService = authService) {}

  async register(req: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateRegister(body);
    if (error || !value) {
      return badRequest(error || "Dados inválidos.");
    }

    const result = await this.service.register(value);
    return created(result);
  }

  async login(req: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateLogin(body);
    if (error || !value) {
      return badRequest(error || "Dados inválidos.");
    }

    const result = await this.service.login(value);
    return ok(result);
  }

  async me(_req: Request, ctx: RequestContext): Promise<Response> {
    if (!ctx.user) {
      return unauthorized("Usuário não autenticado.");
    }

    const user = await this.service.getProfile(ctx.user.id);
    return ok(user);
  }
}

export const authController = new AuthController();
export default authController;
