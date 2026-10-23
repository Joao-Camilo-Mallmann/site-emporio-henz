import { describe, expect, it } from "bun:test";
import { CategoriesService } from "@/modules/categories/categories.service";
import { CategoryDto } from "@/modules/categories/categories.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  ACTIVE_ID,
  uniqueViolation,
  MockCategoriesRepository,
} from "../../mocks/categories.mock";

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
    mockRepo.subtypes.push({
      id: "sub-1",
      categoryId: cat1.id,
      name: "Camas",
      slug: "camas",
      active: true,
      deleted: false,
    });

    const result = await service.listPaginated();
    expect(result.pagination.total).toBe(1);
    expect(result.data[0].name).toBe("Quarto");
    expect(result.data[0].subtypes?.length).toBe(1);
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
    mockRepo.subtypes.push({
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
    expect(mockRepo.subtypes.find((s) => s.id === "sub-1")?.deleted).toBe(true);
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
    mockRepo.categories.push({
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
