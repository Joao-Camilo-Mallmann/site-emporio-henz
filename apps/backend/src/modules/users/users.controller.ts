import { badRequest, created, ok } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import { usersService, UsersService } from "@/modules/users/users.service";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserQuery,
} from "@/modules/users/users.schema";

export class UsersController {
  constructor(private service: UsersService = usersService) {}

  async list(_req: Request, ctx: RequestContext): Promise<Response> {
    const filters = validateUserQuery(ctx.url);
    const result = await this.service.list(filters);
    return ok(result);
  }

  async getById(_req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    const user = await this.service.getById(id);
    return ok(user);
  }

  async create(req: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateCreateUser(body);
    if (error || !value) {
      return badRequest(error || "Dados de usuário inválidos.");
    }

    const result = await this.service.create(value);
    return created(result);
  }

  async update(req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateUpdateUser(body);
    if (error || !value) {
      return badRequest(error || "Dados de atualização inválidos.");
    }

    const result = await this.service.update(id, value);
    return ok(result);
  }

  async delete(_req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    await this.service.delete(id);
    return ok({ message: "Usuário desativado com sucesso." });
  }
}

export const usersController = new UsersController();
export default usersController;
