import { describe, expect, it } from "bun:test";
import { SuppliersService } from "@/modules/suppliers/suppliers.service";
import { NotFoundError } from "@/lib/errors";
import { AuthenticatedUser } from "@/lib/router";
import { ROLES } from "@/middlewares/rbac";
import { validateSupplierQuery } from "@/modules/suppliers/suppliers.schema";
import { MockSuppliersRepository } from "../../mocks/suppliers.mock";

const adminActor: AuthenticatedUser = {
  id: "admin-1",
  role: ROLES.ADMIN,
  email: "admin@henz.com.br",
};

const sellerActor: AuthenticatedUser = {
  id: "seller-1",
  role: ROLES.SELLER,
  email: "vendedor@henz.com.br",
};

const customerActor: AuthenticatedUser = {
  id: "customer-1",
  role: ROLES.CUSTOMER,
  email: "cliente@henz.com.br",
};

describe("Módulo de Fornecedores (SuppliersService)", () => {
  it("deve criar um fornecedor e listá-lo com sucesso", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    const created = await service.create({
      name: "Madeiras Henz Sul",
      contact: "comercial@henz.com.br",
      active: true,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Madeiras Henz Sul");

    const list = await service.list({}, adminActor);
    expect(list.pagination.total).toBe(1);
    expect(list.data[0].name).toBe("Madeiras Henz Sul");
    expect(list.data[0].contact).toBe("comercial@henz.com.br");
  });

  it("deve paginar e filtrar a listagem de fornecedores para ADMIN", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    await service.create({ name: "Alfa Móveis" });
    await service.create({ name: "Beta Estofados", active: false });
    await service.create({ name: "Gama Decor" });

    const firstPage = await service.list({ page: 1, limit: 2 }, adminActor);
    expect(firstPage.data.map((s) => s.name)).toEqual([
      "Alfa Móveis",
      "Beta Estofados",
    ]);
    expect(firstPage.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });

    const secondPage = await service.list({ page: 2, limit: 2 }, adminActor);
    expect(secondPage.data.map((s) => s.name)).toEqual(["Gama Decor"]);

    const onlyActive = await service.list({ active: true }, adminActor);
    expect(onlyActive.pagination.total).toBe(2);

    const searched = await service.list({ search: "beta" }, adminActor);
    expect(searched.data.map((s) => s.name)).toEqual(["Beta Estofados"]);
  });

  it("deve aplicar os padrões de paginação na query da listagem", () => {
    const parse = (qs: string) =>
      validateSupplierQuery(new URL(`http://localhost/suppliers${qs}`));

    expect(parse("")).toEqual({
      page: 1,
      limit: 20,
      search: undefined,
      active: undefined,
    });
    expect(parse("?page=3&limit=50&search=%20henz%20&active=false")).toEqual({
      page: 3,
      limit: 50,
      search: "henz",
      active: false,
    });
    expect(parse("?page=0&limit=101")).toMatchObject({ page: 1, limit: 20 });
    expect(parse("?page=abc&limit=1.5")).toMatchObject({ page: 1, limit: 20 });
  });

  it("deve restringir acesso público e de cliente a fornecedores ativos sem expor contact", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    const serra = await service.create({
      name: "Móveis Serra Gaúcha Ltda",
      contact: "comercial@serragaucha.ind.br",
      active: true,
    });
    await service.create({
      name: "Fábrica Inativa",
      contact: "inativa@exemplo.com",
      active: false,
    });
    const estofados = await service.create({
      name: "Estofados Vale do Taquari",
      contact: "vendas@estofadosvt.com.br",
      active: true,
    });

    // Visitante anônimo tentando forçar active=false ainda recebe apenas ativos e contact=null
    const publicList = await service.list({ active: false });
    expect(publicList.pagination.total).toBe(2);
    expect(publicList.data.map((s) => s.id)).toEqual([estofados.id, serra.id]);
    expect(publicList.data.every((s) => s.active && s.contact === null)).toBe(
      true,
    );

    // Cliente autenticado recebe a mesma visão pública
    const customerList = await service.list({ active: false }, customerActor);
    expect(customerList.data.map((s) => s.id)).toEqual([
      estofados.id,
      serra.id,
    ]);
    expect(customerList.data.every((s) => s.contact === null)).toBe(true);

    // Busca pública por nome funciona, mas busca por contact não retorna nada
    const searchedByName = await service.list(
      validateSupplierQuery(
        new URL("http://localhost/suppliers?search=SERRA_GAUCHA"),
      ),
    );
    expect(searchedByName.data.map((s) => s.id)).toEqual([serra.id]);

    const searchedByContact = await service.list(
      validateSupplierQuery(
        new URL("http://localhost/suppliers?search=comercial"),
      ),
    );
    expect(searchedByContact.data).toEqual([]);
  });

  it("deve restringir VENDEDOR aos fornecedores vinculados com contact preservado", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    const serra = await service.create({
      name: "Móveis Serra Gaúcha Ltda",
      contact: "comercial@serragaucha.ind.br",
      active: true,
    });
    await service.create({
      name: "Outro Fornecedor",
      contact: "outro@exemplo.com",
      active: true,
    });

    mockRepo.links.push({ userId: sellerActor.id, supplierId: serra.id });

    const sellerList = await service.list({}, sellerActor);
    expect(sellerList.data.map((s) => s.id)).toEqual([serra.id]);
    expect(sellerList.data[0].contact).toBe("comercial@serragaucha.ind.br");
  });

  it("deve buscar fornecedor por id e atualizar seus dados", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    const supplier = await service.create({
      name: "Fábrica Antiga",
    });

    const updated = await service.update(supplier.id, {
      name: "Fábrica Nova",
      active: false,
    });

    expect(updated.name).toBe("Fábrica Nova");
    expect(updated.active).toBe(false);

    const fetched = await service.getById(supplier.id);
    expect(fetched.name).toBe("Fábrica Nova");
  });

  it("deve aplicar soft delete no fornecedor e não listá-lo mais", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    const supplier = await service.create({
      name: "Para Desativar",
    });

    await service.delete(supplier.id);

    const list = await service.list({}, adminActor);
    expect(list.pagination.total).toBe(0);

    await expect(service.getById(supplier.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
