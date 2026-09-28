import { badRequest, created, ok } from "@/lib/response";
import { RequestContext } from "@/lib/router";
import {
  userSuppliersService,
  UserSuppliersService,
} from "@/modules/user-suppliers/user-suppliers.service";
import { validateAssignSupplier } from "@/modules/user-suppliers/user-suppliers.schema";

export class UserSuppliersController {
  constructor(
    private service: UserSuppliersService = userSuppliersService,
  ) {}

  async list(_req: Request, ctx: RequestContext): Promise<Response> {
    const { userId } = ctx.params;
    const suppliers = await this.service.listUserSuppliers(userId);
    return ok(suppliers);
  }

  async assign(req: Request, ctx: RequestContext): Promise<Response> {
    const { userId } = ctx.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Corpo da requisição deve ser um JSON válido.");
    }

    const { error, value } = validateAssignSupplier(body);
    if (error || !value) {
      return badRequest(error || "Dados de vínculo inválidos.");
    }

    const link = await this.service.assignSupplier(userId, value.supplierId);
    return created(link);
  }

  async revoke(_req: Request, ctx: RequestContext): Promise<Response> {
    const { userId, supplierId } = ctx.params;
    await this.service.revokeSupplier(userId, supplierId);
    return ok({ message: "Vínculo revogado com sucesso." });
  }
}

export const userSuppliersController = new UserSuppliersController();
export default userSuppliersController;
