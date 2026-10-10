import { badRequest, created, ok } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import { isValidUuid } from "@/lib/slug";
import { isAdmin } from "@/middlewares/role";
import {
  validateCreateSubtype,
  validateSubtypeQuery,
  validateUpdateSubtype,
} from "./subtypes.schema";
import {
  subtypesService,
  SubtypesService,
} from "./subtypes.service";

const INVALID_ID_MESSAGE = "Identificador do subtipo inválido.";

export class SubtypesController {
  constructor(private service: SubtypesService = subtypesService) {}

  async list(req: Request, ctx: RequestContext): Promise<Response> {
    const url = new URL(req.url);
    const filters = validateSubtypeQuery(url);
    const result = await this.service.listPaginated(filters, isAdmin(ctx));
    return ok(result);
  }

  async getById(_req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    if (!isValidUuid(id)) {
      return badRequest(INVALID_ID_MESSAGE);
    }

    const subtype = await this.service.getById(id, isAdmin(ctx));
    return ok(subtype);
  }

  async create(req: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateCreateSubtype(body);
    if (error || !value) {
      return badRequest(error || "Dados do subtipo inválidos.");
    }

    const subtype = await this.service.create(value);
    return created(subtype);
  }

  async update(req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    if (!isValidUuid(id)) {
      return badRequest(INVALID_ID_MESSAGE);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateUpdateSubtype(body);
    if (error || !value) {
      return badRequest(error || "Dados de atualização do subtipo inválidos.");
    }

    const subtype = await this.service.update(id, value);
    return ok(subtype);
  }

  async delete(_req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    if (!isValidUuid(id)) {
      return badRequest(INVALID_ID_MESSAGE);
    }

    await this.service.delete(id);
    return ok({ message: "Subtipo desativado com sucesso." });
  }
}

export const subtypesController = new SubtypesController();
export default subtypesController;
