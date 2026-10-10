import { describe, expect, it } from "bun:test";
import { SubtypesService } from "@/modules/subtypes/subtypes.service";
import { SubtypesRepository } from "@/modules/subtypes/subtypes.repository";
import { CategoriesRepository } from "@/modules/categories/categories.repository";
import {
  CreateSubtypeDto,
  PaginatedSubtypesResult,
  SubtypeDto,
  SubtypeQueryFilters,
  UpdateSubtypeDto,
} from "@/modules/subtypes/subtypes.types";
import { CategoryDto } from "@/modules/categories/categories.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { RequestContext } from "@/lib/router";
import { ROLES } from "@/middlewares/role";
import { SubtypesController } from "@/modules/subtypes/subtypes.controller";
import {
  validateCreateSubtype,
  validateSubtypeQuery,
  validateUpdateSubtype,
} from "@/modules/subtypes/subtypes.schema";

function buildCtx(id: string, role?: number): RequestContext {
  return {
    params: { id },
    url: new URL(`http://localhost/api/v1/subtipos/${id}`),
    user: role ? { id: "user-1", email: "user@emporio.com.br", role } : undefined,
  };
}

class MockCategoriesRepoForSubtypes extends CategoriesRepository {
  public categories: Map<string, CategoryDto & { deleted: boolean }> = new Map();

  async findCategoryById(id: string): Promise<CategoryDto | null> {
    const c = this.categories.get(id);
    if (!c || c.deleted) return null;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      active: c.active,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}

class MockSubtypesRepository extends SubtypesRepository {
  public subtypes: Map<string, SubtypeDto & { deleted: boolean }> = new Map();

  // Categorias inativas, para simular o JOIN de visibilidade pública do repositório.
  public inactiveCategoryIds: Set<string> = new Set();

  private isVisible(s: SubtypeDto): boolean {
    return s.active && !this.inactiveCategoryIds.has(s.categoryId);
  }

  async listPaginated(
    filters: SubtypeQueryFilters = {},
    visibleOnly = false,
  ): Promise<PaginatedSubtypesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const search = filters.search?.toLowerCase() || null;
    const categoryId = filters.categoryId || null;

    let items = Array.from(this.subtypes.values()).filter(
      (s) =>
        !s.deleted &&
        (!visibleOnly || this.isVisible(s)) &&
        (filters.active === undefined || s.active === filters.active) &&
        (!categoryId || s.categoryId === categoryId) &&
        (!search || s.name.toLowerCase().includes(search)),
    );

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    items = items.slice(offset, offset + limit);

    return {
      data: items.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        name: s.name,
        slug: s.slug,
        active: s.active,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findById(id: string, visibleOnly = false): Promise<SubtypeDto | null> {
    const s = this.subtypes.get(id);
    if (!s || s.deleted) return null;
    if (visibleOnly && !this.isVisible(s)) return null;
    return {
      id: s.id,
      categoryId: s.categoryId,
      name: s.name,
      slug: s.slug,
      active: s.active,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  async existsSlugActive(slug: string, excludeId?: string): Promise<boolean> {
    for (const s of this.subtypes.values()) {
      if (!s.deleted && s.slug === slug && s.id !== excludeId) {
        return true;
      }
    }
    return false;
  }

  async create(
    data: CreateSubtypeDto & { slug: string },
  ): Promise<SubtypeDto | null> {
    const id = `sub-${Date.now()}-${Math.random()}`;
    const s = {
      id,
      categoryId: data.categoryId,
      name: data.name,
      slug: data.slug,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    this.subtypes.set(id, s);
    return s;
  }

  async update(
    id: string,
    data: UpdateSubtypeDto,
  ): Promise<SubtypeDto | null> {
    const s = this.subtypes.get(id);
    if (!s || s.deleted) return null;
    if (data.categoryId !== undefined) s.categoryId = data.categoryId;
    if (data.name !== undefined) s.name = data.name;
    if (data.slug !== undefined) s.slug = data.slug;
    if (data.active !== undefined) s.active = data.active;
    s.updatedAt = new Date().toISOString();
    return s;
  }

  async softDelete(id: string): Promise<boolean> {
    const s = this.subtypes.get(id);
    if (!s || s.deleted) return false;
    s.deleted = true;
    return true;
  }
}

describe("Módulo de Subtipos (SubtypesService)", () => {
  it("deve criar subtipo vinculado a uma categoria existente e gerar slug", async () => {
    const catRepo = new MockCategoriesRepoForSubtypes();
    const subRepo = new MockSubtypesRepository();
    const service = new SubtypesService(subRepo, catRepo);

    catRepo.categories.set("cat-1", {
      id: "cat-1",
      name: "Cozinha",
      slug: "cozinha",
      active: true,
      deleted: false,
    });

    const sub = await service.create({
      categoryId: "cat-1",
      name: "Bancadas Gourmet",
    });

    expect(sub.id).toBeDefined();
    expect(sub.categoryId).toBe("cat-1");
    expect(sub.slug).toBe("bancadas-gourmet");
  });

  it("deve rejeitar criação de subtipo para categoria inexistente", async () => {
    const catRepo = new MockCategoriesRepoForSubtypes();
    const subRepo = new MockSubtypesRepository();
    const service = new SubtypesService(subRepo, catRepo);

    await expect(
      service.create({
        categoryId: "inexistente",
        name: "Bancadas",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deve rejeitar subtipo com slug duplicado ativo com ConflictError", async () => {
    const catRepo = new MockCategoriesRepoForSubtypes();
    const subRepo = new MockSubtypesRepository();
    const service = new SubtypesService(subRepo, catRepo);

    catRepo.categories.set("cat-1", {
      id: "cat-1",
      name: "Quarto",
      slug: "quarto",
      active: true,
      deleted: false,
    });

    await service.create({
      categoryId: "cat-1",
      name: "Camas Casal",
      slug: "camas-casal",
    });

    await expect(
      service.create({
        categoryId: "cat-1",
        name: "Camas Casal Duplicada",
        slug: "camas-casal",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("deve listar subtipos paginados com filtros de busca e categoria", async () => {
    const catRepo = new MockCategoriesRepoForSubtypes();
    const subRepo = new MockSubtypesRepository();
    const service = new SubtypesService(subRepo, catRepo);

    catRepo.categories.set("cat-1", {
      id: "cat-1",
      name: "Quarto",
      slug: "quarto",
      active: true,
      deleted: false,
    });

    await service.create({ categoryId: "cat-1", name: "Camas" });
    await service.create({ categoryId: "cat-1", name: "Roupeiros" });
    await service.create({ categoryId: "cat-1", name: "Cabeceiras" });

    const paginated = await service.listPaginated({
      categoryId: "cat-1",
      page: 1,
      limit: 2,
    });

    expect(paginated.pagination.total).toBe(3);
    expect(paginated.pagination.totalPages).toBe(2);
    expect(paginated.data.length).toBe(2);
  });

  it("deve atualizar e aplicar soft delete individual em subtipo", async () => {
    const catRepo = new MockCategoriesRepoForSubtypes();
    const subRepo = new MockSubtypesRepository();
    const service = new SubtypesService(subRepo, catRepo);

    catRepo.categories.set("cat-1", {
      id: "cat-1",
      name: "Sala de Estar",
      slug: "sala-de-estar",
      active: true,
      deleted: false,
    });

    const sub = await service.create({
      categoryId: "cat-1",
      name: "Puff",
    });

    const updated = await service.update(sub.id, {
      name: "Puff Redondo",
    });
    expect(updated.name).toBe("Puff Redondo");

    await service.delete(sub.id);
    await expect(service.getById(sub.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deve ocultar do público subtipo inativo ou de categoria inativa", async () => {
    const catRepo = new MockCategoriesRepoForSubtypes();
    const subRepo = new MockSubtypesRepository();
    const service = new SubtypesService(subRepo, catRepo);

    for (const id of ["cat-1", "cat-2"]) {
      catRepo.categories.set(id, {
        id,
        name: id,
        slug: id,
        active: true,
        deleted: false,
      });
    }

    const visivel = await service.create({ categoryId: "cat-1", name: "Camas" });
    const inativo = await service.create({
      categoryId: "cat-1",
      name: "Roupeiros",
      active: false,
    });
    const orfao = await service.create({ categoryId: "cat-2", name: "Pias" });
    subRepo.inactiveCategoryIds.add("cat-2");

    await expect(service.getById(inativo.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.getById(orfao.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect((await service.getById(inativo.id, true)).id).toBe(inativo.id);

    // O filtro `active=false` vindo do público é ignorado.
    const publica = await service.listPaginated({ active: false });
    expect(publica.data.map((s) => s.id)).toEqual([visivel.id]);

    const admin = await service.listPaginated({}, true);
    expect(admin.pagination.total).toBe(3);
  });

  it("deve converter violação concorrente do índice único de slug em ConflictError", async () => {
    class RacingRepository extends MockSubtypesRepository {
      async create(): Promise<SubtypeDto> {
        throw Object.assign(new Error("duplicate key value"), {
          code: "ERR_POSTGRES_SERVER_ERROR",
          errno: "23505",
        });
      }
    }

    const catRepo = new MockCategoriesRepoForSubtypes();
    const service = new SubtypesService(new RacingRepository(), catRepo);
    catRepo.categories.set("cat-1", {
      id: "cat-1",
      name: "Quarto",
      slug: "quarto",
      active: true,
      deleted: false,
    });

    await expect(
      service.create({ categoryId: "cat-1", name: "Camas" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("Corrida com exclusão da categoria (SubtypesService)", () => {
  it("deve responder NotFoundError quando a categoria é deletada durante a escrita", async () => {
    class CategoryGoneRepository extends MockSubtypesRepository {
      async create(): Promise<SubtypeDto | null> {
        return null;
      }
    }

    const catRepo = new MockCategoriesRepoForSubtypes();
    const service = new SubtypesService(new CategoryGoneRepository(), catRepo);
    catRepo.categories.set("cat-1", {
      id: "cat-1",
      name: "Quarto",
      slug: "quarto",
      active: true,
      deleted: false,
    });

    await expect(
      service.create({ categoryId: "cat-1", name: "Camas" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("Controller de Subtipos (SubtypesController)", () => {
  it("deve responder 400 para :id que não seja UUID em GET, PUT e DELETE", async () => {
    const controller = new SubtypesController(
      new SubtypesService(
        new MockSubtypesRepository(),
        new MockCategoriesRepoForSubtypes(),
      ),
    );
    const ctx = buildCtx("abc", ROLES.ADMIN);
    const req = new Request(ctx.url, {
      method: "PUT",
      body: JSON.stringify({ name: "Novo Nome" }),
    });

    expect((await controller.getById(req, ctx)).status).toBe(400);
    expect((await controller.update(req, ctx)).status).toBe(400);
    expect((await controller.delete(req, ctx)).status).toBe(400);
  });
});

describe("Validação de Schemas de Subtipos", () => {
  it("deve validar payload de criação de subtipo com UUID", () => {
    const valid = validateCreateSubtype({
      categoryId: "11111111-1111-4111-a111-111111111111",
      name: "Poltronas do Papai",
    });
    expect(valid.error).toBeUndefined();
    expect(valid.value?.slug).toBe("poltronas-do-papai");
  });

  it("deve rejeitar criação de subtipo com categoryId inválido", () => {
    const invalid = validateCreateSubtype({
      categoryId: "123-invalido",
      name: "Poltronas",
    });
    expect(invalid.error).toBeDefined();
  });

  it("deve exigir ao menos um campo no update de subtipo", () => {
    const empty = validateUpdateSubtype({});
    expect(empty.error).toBeDefined();
  });

  it("deve validar parâmetros de query para listagem paginada de subtipos", () => {
    const url = new URL(
      "http://localhost/api/v1/subtipos?page=2&limit=10&categoryId=11111111-1111-4111-a111-111111111111&search=mesa",
    );
    const query = validateSubtypeQuery(url);
    expect(query.page).toBe(2);
    expect(query.limit).toBe(10);
    expect(query.categoryId).toBe("11111111-1111-4111-a111-111111111111");
    expect(query.search).toBe("mesa");
  });

  it("deve limitar paginação, busca, nome e slug de subtipos", () => {
    const query = validateSubtypeQuery(
      new URL(
        `http://localhost/api/v1/subtipos?page=1e30&limit=10.5&search=${"a".repeat(500)}`,
      ),
    );
    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
    expect(query.search?.length).toBe(100);

    const categoryId = "11111111-1111-4111-a111-111111111111";
    const longo = "a".repeat(256);
    expect(validateCreateSubtype({ categoryId, name: longo }).error).toBeDefined();
    expect(
      validateCreateSubtype({ categoryId, name: "Camas", slug: longo }).error,
    ).toBeDefined();
    expect(validateUpdateSubtype({ name: longo }).error).toBeDefined();
    expect(validateUpdateSubtype({ slug: longo }).error).toBeDefined();
  });
});
