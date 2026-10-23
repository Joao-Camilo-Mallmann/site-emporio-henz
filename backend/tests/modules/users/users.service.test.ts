import { ConflictError, NotFoundError } from "@/lib/errors";
import { UsersService } from "@/modules/users/users.service";
import { describe, expect, it } from "bun:test";
import { MockUsersRepository } from "../../mocks/users.mock";

describe("Módulo de Usuários (UsersService)", () => {
  it("deve criar um novo usuário com papel designado (ADMIN, SELLER, CUSTOMER)", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    const user = await service.create({
      fullName: "Vendedor Teste",
      email: "vendedor@emporio.com.br",
      password: "senhaSegura123",
      role: 2, // SELLER
      city: "Estrela",
    });

    expect(user.id).toBeDefined();
    expect(user.role).toBe(2);
    expect(user.fullName).toBe("Vendedor Teste");
  });

  it("deve rejeitar criação com e-mail duplicado", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    await service.create({
      fullName: "Primeiro",
      email: "repetido@teste.com",
      password: "senhaSegura123",
      role: 1,
    });

    await expect(
      service.create({
        fullName: "Segundo",
        email: "repetido@teste.com",
        password: "senhaSegura123",
        role: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("deve listar usuários com paginação e busca por termo", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    await service.create({
      fullName: "Alberto Roberto",
      email: "alberto@teste.com",
      password: "senhaSegura123",
      role: 2,
    });

    await service.create({
      fullName: "Bruna Biancardi",
      email: "bruna@teste.com",
      password: "senhaSegura123",
      role: 1,
    });

    const listAll = await service.list({});
    expect(listAll.pagination.total).toBe(2);

    const searchAlberto = await service.list({ search: "alberto" });
    expect(searchAlberto.pagination.total).toBe(1);
    expect(searchAlberto.data[0].fullName).toBe("Alberto Roberto");

    const filterRole2 = await service.list({ role: 2 });
    expect(filterRole2.pagination.total).toBe(1);
    expect(filterRole2.data[0].role).toBe(2);
  });

  it("deve atualizar os dados de um usuário existente", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    const created = await service.create({
      fullName: "Nome Antigo",
      email: "antigo@teste.com",
      password: "senhaAntiga123",
      role: 1,
    });

    const updated = await service.update(created.id, {
      fullName: "Nome Novo",
      role: 2,
    });

    expect(updated.fullName).toBe("Nome Novo");
    expect(updated.role).toBe(2);
  });

  it("deve realizar soft delete do usuário e impedir retorno na busca posterior", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    const user = await service.create({
      fullName: "Para Deletar",
      email: "deletar@teste.com",
      password: "senhaSegura123",
      role: 1,
    });

    await service.delete(user.id);

    await expect(service.getById(user.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
