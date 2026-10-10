import { describe, expect, it } from "bun:test";
import { CategoriesService } from "@/modules/categories/categories.service";
import { CategoriesRepository } from "@/modules/categories/categories.repository";
import {
  CategoryDto,
  CategoryQueryFilters,
  CreateCategoryDto,
  PaginatedCategoriesResult,
  UpdateCategoryDto,
} from "@/modules/categories/categories.types";
import { SubtypeDto } from "@/modules/subtypes/subtypes.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { escapeLike } from "@/lib/pagination";
import { RequestContext } from "@/lib/router";
import { ROLES } from "@/middlewares/role";
import { CategoriesController } from "@/modules/categories/categories.controller";
import {
  slugify,
  validateCategoryQuery,
  validateCreateCategory,
  validateUpdateCategory,
} from "@/modules/categories/categories.schema";

const ACTIVE_ID = "11111111-1111-4111-a111-111111111111";
const INACTIVE_ID = "22222222-2222-4222-a222-222222222222";

function uniqueViolation(): Error {
  return Object.assign(
    new Error(
      'duplicate key value violates unique constraint "idx_categories_slug_active"',
    ),
    { code: "ERR_POSTGRES_SERVER_ERROR", errno: "23505" },
  );
}

function buildCtx(id: string, role?: number): RequestContext {
  return {
    params: { id },
    url: new URL(`http://localhost/api/v1/categorias/${id}`),
    user: role ? { id: "user-1", email: "user@emporio.com.br", role } : undefined,
  };
}

class MockCategoriesRepository extends CategoriesRepository {
  public categories: Map<string, CategoryDto & { deleted: boolean }> = new Map();
  public subtypes: Map<string, SubtypeDto & { deleted: boolean }> = new Map();

  async listHierarchy(activeOnly = true): Promise<CategoryDto[]> {
    const activeCats = Array.from(this.categories.values())
      .filter((c) => !c.deleted && (!activeOnly || c.active))
      .sort((a, b) => a.name.localeCompare(b.name));

    return activeCats.map((cat) => {
      const subs = Array.from(this.subtypes.values())
        .filter(
          (s) =>
            s.categoryId === cat.id && !s.deleted && (!activeOnly || s.active),
        )
        .sort((a, b) => a.name.localeCompare(b.name));
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        active: cat.active,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        subtypes: subs,
      };
    });
  }

  async listPaginated(
    filters: CategoryQueryFilters = {},
  ): Promise<PaginatedCategoriesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const search = filters.search?.toLowerCase() || null;

    let items = Array.from(this.categories.values()).filter(
      (c) =>
        !c.deleted &&
        (filters.active === undefined || c.active === filters.active) &&
        (!search || c.name.toLowerCase().includes(search)),
    );

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    items = items.slice(offset, offset + limit);

    return {
      data: items.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        active: c.active,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

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

  async existsCategorySlugActive(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    for (const c of this.categories.values()) {
      if (!c.deleted && c.slug === slug && c.id !== excludeId) {
        return true;
      }
    }
    return false;
  }

  async createCategory(
    data: CreateCategoryDto & { slug: string },
  ): Promise<CategoryDto> {
    const id = `cat-${Date.now()}-${Math.random()}`;
    const c = {
      id,
      name: data.name,
      slug: data.slug,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
      subtypes: [],
    };
    this.categories.set(id, c);
    return c;
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryDto,
  ): Promise<CategoryDto | null> {
    const c = this.categories.get(id);
    if (!c || c.deleted) return null;
    if (data.name !== undefined) c.name = data.name;
    if (data.slug !== undefined) c.slug = data.slug;
    if (data.active !== undefined) c.active = data.active;
    c.updatedAt = new Date().toISOString();
    return c;
  }

  async softDeleteCategoryWithCascade(id: string): Promise<boolean> {
    const c = this.categories.get(id);
    if (!c || c.deleted) return false;
    c.deleted = true;

    for (const s of this.subtypes.values()) {
      if (s.categoryId === id && !s.deleted) {
        s.deleted = true;
      }
    }
    return true;
  }
}

describe("Módulo de Categorias (CategoriesService)", () => {
  it("deve criar categoria e gerar slug automaticamente", async () => {
    const mockRepo = new MockCategoriesRepository();
    const service = new CategoriesService(mockRepo);

    const cat = await service.createCategory({
      name: "Área Externa & Piscina",
    });

    expect(cat.id).toBeDefined();
    expect(cat.name).toBe("Área Externa & Piscina");
    expect(cat.slug).toBe("area-externa-piscina");
  });

  it("deve rejeitar categoria com slug duplicado ativo com ConflictError", async () => {
    const mockRepo = new MockCategoriesRepository();
    const service = new CategoriesService(mockRepo);

    await service.createCategory({
      name: "Sala de Estar",
      slug: "sala-de-estar",
    });

    await expect(
      service.createCategory({
        name: "Sala de Estar Duplicada",
        slug: "sala-de-estar",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("deve permitir reutilizar slug se registro anterior estiver deletado logicamente", async () => {
    const mockRepo = new MockCategoriesRepository();
    const service = new CategoriesService(mockRepo);

    const cat = await service.createCategory({
      name: "Jardim de Inverno",
      slug: "jardim-inverno",
    });

    await service.deleteCategory(cat.id);

    const recriada = await service.createCategory({
      name: "Jardim de Inverno Novo",
      slug: "jardim-inverno",
    });

    expect(recriada.id).toBeDefined();
    expect(recriada.slug).toBe("jardim-inverno");
  });

  it("deve listar hierarquia completa de categorias com subtipos aninhados", async () => {
    const mockRepo = new MockCategoriesRepository();
    const service = new CategoriesService(mockRepo);

    const cat1 = await service.createCategory({ name: "Quarto" });
    mockRepo.subtypes.set("sub-1", {
      id: "sub-1",
      categoryId: cat1.id,
      name: "Camas",
      slug: "camas",
      active: true,
      deleted: false,
    });

    const hierarchy = await service.listHierarchy();
    expect(hierarchy.length).toBe(1);
    expect(hierarchy[0].name).toBe("Quarto");
    expect(hierarchy[0].subtypes?.length).toBe(1);
  });

  it("deve listar categorias com paginação e busca por termo", async () => {
    const mockRepo = new MockCategoriesRepository();
    const service = new CategoriesService(mockRepo);

    await service.createCategory({ name: "Cozinha" });
    await service.createCategory({ name: "Quarto" });
    await service.createCategory({ name: "Sala de Estar" });

    const result = await service.listPaginated({
      page: 1,
      limit: 2,
      search: "a",
    });

    expect(result.pagination.total).toBe(3);
    expect(result.pagination.limit).toBe(2);
    expect(result.data.length).toBe(2);
  });

  it("deve aplicar soft delete em cascata lógica nos subtipos ao deletar categoria", async () => {
    const mockRepo = new MockCategoriesRepository();
    const service = new CategoriesService(mockRepo);

    const cat = await service.createCategory({ name: "Escritório" });
    mockRepo.subtypes.set("sub-1", {
      id: "sub-1",
      categoryId: cat.id,
      name: "Cadeiras Presidente",
      slug: "cadeiras-presidente",
      active: true,
      deleted: false,
    });

    await service.deleteCategory(cat.id);

    await expect(service.getCategoryById(cat.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(mockRepo.subtypes.get("sub-1")?.deleted).toBe(true);
  });

  it("deve ocultar categoria inativa do público e exibi-la ao Administrador", async () => {
    const mockRepo = new MockCategoriesRepository();
    const service = new CategoriesService(mockRepo);

    await service.createCategory({ name: "Cozinha" });
    const inativa = await service.createCategory({
      name: "Banheiro",
      active: false,
    });

    await expect(service.getCategoryById(inativa.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect((await service.getCategoryById(inativa.id, true)).id).toBe(
      inativa.id,
    );

    // O filtro `active=false` vindo do público é ignorado.
    const publica = await service.listPaginated({ page: 1, active: false });
    expect(publica.data.map((c) => c.name)).toEqual(["Cozinha"]);

    const admin = await service.listPaginated({ page: 1 }, true);
    expect(admin.pagination.total).toBe(2);
  });

  it("deve converter violação concorrente do índice único de slug em ConflictError", async () => {
    class RacingRepository extends MockCategoriesRepository {
      async createCategory(): Promise<CategoryDto> {
        throw uniqueViolation();
      }
      async updateCategory(): Promise<CategoryDto | null> {
        throw uniqueViolation();
      }
    }

    const mockRepo = new RacingRepository();
    const service = new CategoriesService(mockRepo);
    mockRepo.categories.set(ACTIVE_ID, {
      id: ACTIVE_ID,
      name: "Quarto",
      slug: "quarto",
      active: true,
      deleted: false,
    });

    await expect(
      service.createCategory({ name: "Sala de Estar" }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      service.updateCategory(ACTIVE_ID, { slug: "sala-de-estar" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("Controller de Categorias (CategoriesController)", () => {
  function buildController() {
    const mockRepo = new MockCategoriesRepository();
    mockRepo.categories.set(ACTIVE_ID, {
      id: ACTIVE_ID,
      name: "Quarto",
      slug: "quarto",
      active: true,
      deleted: false,
    });
    mockRepo.categories.set(INACTIVE_ID, {
      id: INACTIVE_ID,
      name: "Banheiro",
      slug: "banheiro",
      active: false,
      deleted: false,
    });
    return new CategoriesController(new CategoriesService(mockRepo));
  }

  it("deve responder 400 para :id que não seja UUID em GET, PUT e DELETE", async () => {
    const controller = buildController();
    const ctx = buildCtx("abc", ROLES.ADMIN);
    const req = new Request(ctx.url, {
      method: "PUT",
      body: JSON.stringify({ name: "Novo Nome" }),
    });

    expect((await controller.getCategoryById(req, ctx)).status).toBe(400);
    expect((await controller.updateCategory(req, ctx)).status).toBe(400);
    expect((await controller.deleteCategory(req, ctx)).status).toBe(400);
  });

  it("deve responder 404 para categoria inativa a visitantes e não administradores", async () => {
    const controller = buildController();
    const req = new Request("http://localhost/api/v1/categorias");

    await expect(
      controller.getCategoryById(req, buildCtx(INACTIVE_ID)),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      controller.getCategoryById(req, buildCtx(INACTIVE_ID, ROLES.SELLER)),
    ).rejects.toBeInstanceOf(NotFoundError);

    const res = await controller.getCategoryById(
      req,
      buildCtx(INACTIVE_ID, ROLES.ADMIN),
    );
    expect(res.status).toBe(200);
  });

  it("deve listar inativas na paginação somente para o Administrador", async () => {
    const controller = buildController();
    const req = new Request("http://localhost/api/v1/categorias?page=1");

    const publicRes = await controller.list(req, buildCtx(""));
    const publicBody = (await publicRes.json()) as PaginatedCategoriesResult;
    expect(publicBody.data.map((c) => c.id)).toEqual([ACTIVE_ID]);

    const adminRes = await controller.list(req, buildCtx("", ROLES.ADMIN));
    const adminBody = (await adminRes.json()) as PaginatedCategoriesResult;
    expect(adminBody.pagination.total).toBe(2);
  });
});

describe("Validação de Schemas de Categorias", () => {
  it("deve converter textos complexos e acentuados em slugs corretos", () => {
    expect(slugify("Sala de Estar & Jantar")).toBe("sala-de-estar-jantar");
    expect(slugify("Móveis Rústicos 100% Madeira")).toBe(
      "moveis-rusticos-100-madeira",
    );
    expect(slugify("  --Área Externa--  ")).toBe("area-externa");
  });

  it("deve validar payload de criação de categoria", () => {
    const valid = validateCreateCategory({
      name: "Quarto Infantil",
    });
    expect(valid.error).toBeUndefined();
    expect(valid.value?.slug).toBe("quarto-infantil");
  });

  it("deve rejeitar criação de categoria com nome vazio", () => {
    const invalid = validateCreateCategory({
      name: "",
    });
    expect(invalid.error).toBeDefined();
  });

  it("deve exigir ao menos um campo no update de categoria", () => {
    const empty = validateUpdateCategory({});
    expect(empty.error).toBeDefined();
  });

  it("deve validar parâmetros de query para listagem paginada", () => {
    const url = new URL("http://localhost/api/v1/categorias?page=2&limit=15&search=cozinha");
    const query = validateCategoryQuery(url);
    expect(query.page).toBe(2);
    expect(query.limit).toBe(15);
    expect(query.search).toBe("cozinha");
  });

  it("deve cair nos padrões quando page ou limit não forem inteiros dentro dos limites", () => {
    for (const qs of [
      "page=1.5&limit=10.5",
      "page=1e30&limit=1e30",
      "page=-1&limit=0",
      "page=abc&limit=101",
    ]) {
      const query = validateCategoryQuery(
        new URL(`http://localhost/api/v1/categorias?${qs}`),
      );
      expect(query.page).toBe(1);
      expect(query.limit).toBe(20);
    }
  });

  it("deve truncar o termo de busca em 100 caracteres", () => {
    const url = new URL(
      `http://localhost/api/v1/categorias?search=${"a".repeat(500)}`,
    );
    expect(validateCategoryQuery(url).search?.length).toBe(100);
  });

  it("deve rejeitar nome que não gera slug e escapar curingas da busca", () => {
    expect(validateCreateCategory({ name: "!!!" }).error).toBeDefined();
    expect(validateCreateCategory({ name: "家具" }).error).toBeDefined();
    expect(
      validateCreateCategory({ name: "家具", slug: "moveis" }).error,
    ).toBeUndefined();

    expect(escapeLike("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });

  it("deve rejeitar nome e slug acima de 255 caracteres", () => {
    const longo = "a".repeat(256);

    expect(validateCreateCategory({ name: longo }).error).toBeDefined();
    expect(
      validateCreateCategory({ name: "Quarto", slug: longo }).error,
    ).toBeDefined();
    expect(validateUpdateCategory({ name: longo }).error).toBeDefined();
    expect(validateUpdateCategory({ slug: longo }).error).toBeDefined();
    expect(
      validateCreateCategory({ name: "a".repeat(255) }).error,
    ).toBeUndefined();
  });
});
