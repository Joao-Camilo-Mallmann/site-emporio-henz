import { describe, expect, it } from "bun:test";
import { AuthService } from "@/modules/auth/auth.service";
import { hashPassword } from "@/lib/password";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { MockAuthRepository } from "../../mocks/auth.mock";

describe("Módulo de Autenticação (AuthService)", () => {
  it("deve cadastrar um novo cliente com sucesso e retornar token JWT", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    const result = await service.register({
      fullName: "João Silva",
      email: "joao@exemplo.com",
      password: "senhaSegura123",
      phone: "(51) 98888-7777",
      city: "Lajeado",
    });

    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("joao@exemplo.com");
    expect(result.user.role).toBe(1); // CUSTOMER
    expect(result.user.fullName).toBe("João Silva");
  });

  it("deve rejeitar autocadastro de e-mail duplicado com ConflictError", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    await service.register({
      fullName: "Primeiro Usuário",
      email: "duplicado@exemplo.com",
      password: "senhaSegura123",
    });

    await expect(
      service.register({
        fullName: "Segundo Usuário",
        email: "duplicado@exemplo.com",
        password: "outraSenha123",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("deve autenticar usuário existente com credenciais corretas", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    await service.register({
      fullName: "Maria Santos",
      email: "maria@exemplo.com",
      password: "senhaValida123",
    });

    const loginResult = await service.login({
      email: "maria@exemplo.com",
      password: "senhaValida123",
    });

    expect(loginResult.token).toBeDefined();
    expect(loginResult.user.email).toBe("maria@exemplo.com");
  });

  it("deve rejeitar login com senha incorreta com UnauthorizedError", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    await service.register({
      fullName: "Carlos Souza",
      email: "carlos@exemplo.com",
      password: "senhaCorreta123",
    });

    await expect(
      service.login({
        email: "carlos@exemplo.com",
        password: "senhaIncorreta",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("deve rejeitar login de usuário inativo ou excluído logicamente", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    const hash = await hashPassword("senhaValida123");
    mockRepo.users.push({
      id: "user-deleted",
      email: "deletado@exemplo.com",
      password_hash: hash,
      role: 1,
      city: null,
      full_name: "Deletado",
      phone: null,
      deleted_at: new Date(), // Soft deleted
    });

    await expect(
      service.login({
        email: "deletado@exemplo.com",
        password: "senhaValida123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("deve retornar o perfil autenticado com getProfile", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    const reg = await service.register({
      fullName: "Ana Lima",
      email: "ana@exemplo.com",
      password: "senhaValida123",
    });

    const profile = await service.getProfile(reg.user.id);
    expect(profile.email).toBe("ana@exemplo.com");
    expect(profile.fullName).toBe("Ana Lima");
  });

  it("deve lançar NotFoundError se usuário buscado no perfil não existir", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    await expect(service.getProfile("uuid-inexistente")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("deve atualizar os dados cadastrais do perfil próprio com sucesso", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    const reg = await service.register({
      fullName: "Nome Inicial",
      email: "cliente@exemplo.com",
      password: "SenhaInicial@123",
      city: "Cidade Antiga",
    });

    const updated = await service.updateProfile(reg.user.id, {
      fullName: "Nome Atualizado",
      phone: "(51) 99999-1111",
      city: "Nova Cidade",
    });

    expect(updated.id).toBe(reg.user.id);
    expect(updated.fullName).toBe("Nome Atualizado");
    expect(updated.phone).toBe("(51) 99999-1111");
    expect(updated.city).toBe("Nova Cidade");
    expect(updated.email).toBe("cliente@exemplo.com");
  });

  it("deve atualizar a senha com sucesso e permitir login com a nova senha", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    const reg = await service.register({
      fullName: "Usuario Senha",
      email: "senha@exemplo.com",
      password: "SenhaAntiga@123",
    });

    await service.updateProfile(reg.user.id, {
      fullName: "Usuario Senha",
      password: "NovaSenhaForte@456",
    });

    // Login com a nova senha deve ter sucesso
    const loginOk = await service.login({
      email: "senha@exemplo.com",
      password: "NovaSenhaForte@456",
    });
    expect(loginOk.token).toBeDefined();

    // Login com a senha antiga deve falhar
    await expect(
      service.login({
        email: "senha@exemplo.com",
        password: "SenhaAntiga@123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("deve impedir elevação de privilégios garantindo que o papel permaneça intacto", async () => {
    const mockRepo = new MockAuthRepository();
    const service = new AuthService(mockRepo);

    const reg = await service.register({
      fullName: "Cliente Normal",
      email: "cliente.role@exemplo.com",
      password: "SenhaValida@123",
    });

    expect(reg.user.role).toBe(1); // Role 1: Cliente

    const updated = await service.updateProfile(reg.user.id, {
      fullName: "Cliente Tentando Virar Admin",
      // UpdateProfileDto nem aceita role, e o repository não altera role
    });

    expect(updated.role).toBe(1);

    const profileCheck = await service.getProfile(reg.user.id);
    expect(profileCheck.role).toBe(1);
  });
});
