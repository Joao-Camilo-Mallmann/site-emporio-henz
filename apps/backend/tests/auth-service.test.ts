import { describe, expect, it } from "bun:test";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthRepository, UserAuthRecord } from "@/modules/auth/auth.repository";
import { AuthUserProfile } from "@/modules/auth/auth.types";
import { hashPassword } from "@/lib/password";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { validateLogin, validateRegister } from "@/modules/auth/auth.schema";

class MockAuthRepository extends AuthRepository {
  public users: Map<string, UserAuthRecord> = new Map();
  public clients: Map<string, { fullName: string; phone: string | null }> = new Map();

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    for (const user of this.users.values()) {
      if (user.email === email && user.deleted_at === null) {
        const client = this.clients.get(user.id);
        return {
          ...user,
          full_name: client?.fullName || "",
          phone: client?.phone || null,
        };
      }
    }
    return null;
  }

  async findById(id: string): Promise<AuthUserProfile | null> {
    const user = this.users.get(id);
    if (!user || user.deleted_at !== null) {
      return null;
    }
    const client = this.clients.get(id);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: client?.fullName || "",
      phone: client?.phone || null,
      city: user.city,
    };
  }

  async isEmailActive(email: string): Promise<boolean> {
    for (const user of this.users.values()) {
      if (user.email === email && user.deleted_at === null) {
        return true;
      }
    }
    return false;
  }

  async createCustomer(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    city?: string;
  }): Promise<AuthUserProfile> {
    const id = `user-${Date.now()}`;
    const userRecord: UserAuthRecord = {
      id,
      email: data.email,
      password_hash: data.passwordHash,
      role: 1,
      city: data.city || null,
      full_name: data.fullName,
      phone: data.phone || null,
      deleted_at: null,
    };

    this.users.set(id, userRecord);
    this.clients.set(id, { fullName: data.fullName, phone: data.phone || null });

    return {
      id,
      email: data.email,
      role: 1,
      fullName: data.fullName,
      phone: data.phone || null,
      city: data.city || null,
    };
  }
}

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
    mockRepo.users.set("user-deleted", {
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
});

describe("Validação de Schemas de Autenticação", () => {
  it("deve validar com sucesso payload de registro correto", () => {
    const { error, value } = validateRegister({
      fullName: "Nome Valido",
      email: "teste@valido.com",
      password: "123456",
    });

    expect(error).toBeUndefined();
    expect(value?.email).toBe("teste@valido.com");
  });

  it("deve rejeitar email inválido ou senha menor que 6 caracteres", () => {
    const invalidEmail = validateRegister({
      fullName: "Nome",
      email: "invalido",
      password: "123456",
    });
    expect(invalidEmail.error).toBeDefined();

    const shortPassword = validateRegister({
      fullName: "Nome",
      email: "valido@email.com",
      password: "123",
    });
    expect(shortPassword.error).toBeDefined();
  });

  it("deve validar payload de login", () => {
    const valid = validateLogin({
      email: "login@email.com",
      password: "qualquerSenha",
    });
    expect(valid.error).toBeUndefined();

    const invalid = validateLogin({});
    expect(invalid.error).toBeDefined();
  });
});
