import { badRequest, created, ok } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import { suppliersService, SuppliersService } from "@/modules/suppliers/suppliers.service";
import {
  validateCreateSupplier,
  validateUpdateSupplier,
} from "@/modules/suppliers/suppliers.schema";

export class SuppliersController {
  constructor(private service: SuppliersService = suppliersService) {}

  async list(): Promise<Response> {
    const suppliers = await this.service.list();
    return ok(suppliers);
  }

  async getById(_req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    const supplier = await this.service.getById(id);
    return ok(supplier);
  }

  async create(req: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateCreateSupplier(body);
    if (error || !value) {
      return badRequest(error || "Dados de fornecedor inválidos.");
    }

    const supplier = await this.service.create(value);
    return created(supplier);
  }

  async update(req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateUpdateSupplier(body);
    if (error || !value) {
      return badRequest(error || "Dados de atualização inválidos.");
    }

    const supplier = await this.service.update(id, value);
    return ok(supplier);
  }

  async delete(_req: Request, ctx: RequestContext): Promise<Response> {
    const { id } = ctx.params;
    await this.service.delete(id);
    return ok({ message: "Fornecedor desativado com sucesso." });
  }
}

export const suppliersController = new SuppliersController();
export default suppliersController;
