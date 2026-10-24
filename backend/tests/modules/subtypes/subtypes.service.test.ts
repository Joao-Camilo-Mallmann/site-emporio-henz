import { describe, expect, it } from "bun:test";
import { SubtypesService } from "@/modules/subtypes/subtypes.service";
import { SubtypeDto } from "@/modules/subtypes/subtypes.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  MockCategoriesRepoForSubtypes,
  MockSubtypesRepository,
} from "../../mocks/subtypes.mock";

describe("Módulo de Subtipos (SubtypesService)", () => {
  it("deve criar subtipo vinculado a uma categoria existente e gerar slug", async () => {
    const catRepo = new MockCategoriesRepoForSubtypes();
    const subRepo = new MockSubtypesRepository();
    const service = new SubtypesService(subRepo, catRepo);

    catRepo.categories.push({
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

    catRepo.categories.push({
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

    catRepo.categories.push({
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

    catRepo.categories.push({
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

    ["cat-1", "cat-2"].forEach((id) => {
      catRepo.categories.push({
        id,
        name: id,
        slug: id,
        active: true,
        deleted: false,
      });
    });

    const visivel = await service.create({ categoryId: "cat-1", name: "Camas" });
    const inativo = await service.create({
      categoryId: "cat-1",
      name: "Roupeiros",
      active: false,
    });
    const orfao = await service.create({ categoryId: "cat-2", name: "Pias" });
    subRepo.inactiveCategoryIds.push("cat-2");

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
    catRepo.categories.push({
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
