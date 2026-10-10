import { describe, expect, it } from "bun:test";
import { SuppliersService } from "@/modules/suppliers/suppliers.service";
import { SuppliersRepository } from "@/modules/suppliers/suppliers.repository";
import {
  CreateSupplierDto,
  PaginatedSuppliersResult,
  SupplierDto,
  SupplierQueryFilters,
  UpdateSupplierDto,
} from "@/modules/suppliers/suppliers.types";
import { NotFoundError } from "@/lib/errors";
import { paginate, resolvePagination } from "@/lib/pagination";
import {
  validateCreateSupplier,
  validateSupplierQuery,
  validateUpdateSupplier,
} from "@/modules/suppliers/suppliers.schema";

class MockSuppliersRepository extends SuppliersRepository {
  public suppliers: Map<string, SupplierDto & { deleted: boolean }> = new Map();

  async list(
    filters: SupplierQueryFilters = {},
  ): Promise<PaginatedSuppliersResult> {
    const { page, limit, offset } = resolvePagination(filters);
    const search = filters.search?.toLowerCase();
    const items = Array.from(this.suppliers.values())
      .filter((s) => !s.deleted)
      .filter((s) => filters.active === undefined || s.active === filters.active)
      .filter((s) => !search || s.name.toLowerCase().includes(search))
      .sort((a, b) => a.name.localeCompare(b.name));

    return paginate(items.slice(offset, offset + limit), items.length, {
      page,
      limit,
    });
  }

  async findById(id: string): Promise<SupplierDto | null> {
    const s = this.suppliers.get(id);
    if (!s || s.deleted) {
      return null;
    }
    return {
      id: s.id,
      name: s.name,
      contact: s.contact,
      active: s.active,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  async create(data: CreateSupplierDto): Promise<SupplierDto> {
    const id = `supp-${Date.now()}-${Math.random()}`;
    const s = {
      id,
      name: data.name,
      contact: data.contact || null,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    this.suppliers.set(id, s);
    return s;
  }

  async update(id: string, data: UpdateSupplierDto): Promise<SupplierDto | null> {
    const s = this.suppliers.get(id);
    if (!s || s.deleted) {
      return null;
    }
    if (data.name !== undefined) s.name = data.name;
    if (data.contact !== undefined) s.contact = data.contact;
    if (data.active !== undefined) s.active = data.active;
    s.updatedAt = new Date().toISOString();
    return s;
  }

  async softDelete(id: string): Promise<boolean> {
    const s = this.suppliers.get(id);
    if (!s || s.deleted) {
      return false;
    }
    s.deleted = true;
    return true;
  }
}

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

    const list = await service.list();
    expect(list.pagination.total).toBe(1);
    expect(list.data[0].name).toBe("Madeiras Henz Sul");
  });

  it("deve paginar e filtrar a listagem de fornecedores", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    await service.create({ name: "Alfa Móveis" });
    await service.create({ name: "Beta Estofados", active: false });
    await service.create({ name: "Gama Decor" });

    const firstPage = await service.list({ page: 1, limit: 2 });
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

    const secondPage = await service.list({ page: 2, limit: 2 });
    expect(secondPage.data.map((s) => s.name)).toEqual(["Gama Decor"]);

    const onlyActive = await service.list({ active: true });
    expect(onlyActive.pagination.total).toBe(2);

    const searched = await service.list({ search: "beta" });
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

    const list = await service.list();
    expect(list.pagination.total).toBe(0);

    await expect(service.getById(supplier.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("Validação de Schemas de Fornecedores", () => {
  it("deve validar dados válidos de fornecedor", () => {
    const valid = validateCreateSupplier({
      name: "Fábrica de Cadeiras Estrela",
      contact: "51 9999-0000",
      active: true,
    });

    expect(valid.error).toBeUndefined();
    expect(valid.value?.name).toBe("Fábrica de Cadeiras Estrela");
  });

  it("deve rejeitar nome menor que 2 caracteres", () => {
    const invalid = validateCreateSupplier({
      name: "A",
    });

    expect(invalid.error).toBeDefined();
  });

  it("deve exigir ao menos um campo no update", () => {
    const empty = validateUpdateSupplier({});
    expect(empty.error).toBeDefined();
  });
});
