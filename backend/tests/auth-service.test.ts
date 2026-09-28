import { describe, expect, it } from "bun:test";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthRepository, UserAuthRecord } from "@/modules/auth/auth.repository";
import { AuthUserProfile, UpdateProfileDto } from "@/modules/auth/auth.types";
import { hashPassword } from "@/lib/password";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import {
  validateLogin,
  validateRegister,
  validateUpdateProfile,
} from "@/modules/auth/auth.schema";

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

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
    passwordHash?: string,
  ): Promise<AuthUserProfile | null> {
    const user = this.users.get(userId);
    if (!user || user.deleted_at !== null) {
      return null;
    }

    if (passwordHash) {
      user.password_hash = passwordHash;
    }
    if (data.city !== undefined) {
      user.city = data.city ?? null;
    }

    let client = this.clients.get(userId);
    if (client) {
      client.fullName = data.fullName;
      if (data.phone !== undefined) {
        client.phone = data.phone ?? null;
      }
    } else {
      client = {
        fullName: data.fullName,
        phone: data.phone ?? null,
      };
      this.clients.set(userId, client);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: client.fullName,
      phone: client.phone,
      city: user.city,
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

describe("Validação de Schemas de Autenticação", () => {
  it("deve validar com sucesso payload de registro correto", () => {
    const { error, value } = validateRegister({
      fullName: "Nome Valido",
      email: "teste@valido.com",
      password: "senhaValida123",
    });

    expect(error).toBeUndefined();
    expect(value?.email).toBe("teste@valido.com");
  });

  it("deve rejeitar email inválido ou senha menor que 8 caracteres", () => {
    const invalidEmail = validateRegister({
      fullName: "Nome",
      email: "invalido",
      password: "senhaSegura123",
    });
    expect(invalidEmail.error).toBeDefined();

    const shortPassword = validateRegister({
      fullName: "Nome",
      email: "valido@email.com",
      password: "1234567",
    });
    expect(shortPassword.error).toBeDefined();
    expect(shortPassword.error).toContain("8 caracteres");
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

  it("deve validar com sucesso payload de atualização de perfil com senha forte", () => {
    const { error, value } = validateUpdateProfile({
      fullName: "Cliente Atualizado",
      phone: "(51) 98888-7777",
      city: "Lajeado",
      password: "SenhaForte@2026",
    });

    expect(error).toBeUndefined();
    expect(value?.fullName).toBe("Cliente Atualizado");
    expect(value?.phone).toBe("(51) 98888-7777");
    expect(value?.city).toBe("Lajeado");
    expect(value?.password).toBe("SenhaForte@2026");
  });

  it("deve validar payload de atualização de perfil sem senha (opcional)", () => {
    const { error, value } = validateUpdateProfile({
      fullName: "Apenas Mudando Nome",
    });

    expect(error).toBeUndefined();
    expect(value?.fullName).toBe("Apenas Mudando Nome");
    expect(value?.password).toBeUndefined();
  });

  it("deve rejeitar atualização com senha fraca nos 5 critérios de segurança", () => {
    // Menos de 8 caracteres
    const r1 = validateUpdateProfile({ fullName: "Nome", password: "Ab1!" });
    expect(r1.error).toContain("mínimo 8 caracteres");

    // Sem maiúscula
    const r2 = validateUpdateProfile({
      fullName: "Nome",
      password: "senhasemmaiuscula@1",
    });
    expect(r2.error).toContain("letra maiúscula");

    // Sem minúscula
    const r3 = validateUpdateProfile({
      fullName: "Nome",
      password: "SENHASEMMINUSCULA@1",
    });
    expect(r3.error).toContain("letra minúscula");

    // Sem número
    const r4 = validateUpdateProfile({
      fullName: "Nome",
      password: "SenhaSemNumero!@",
    });
    expect(r4.error).toContain("número");

    // Sem caractere especial
    const r5 = validateUpdateProfile({
      fullName: "Nome",
      password: "SenhaSemEspecial123",
    });
    expect(r5.error).toContain("caractere especial");
  });

  it("deve rejeitar atualização com nome completo menor que 2 caracteres", () => {
    const { error } = validateUpdateProfile({ fullName: "A" });
    expect(error).toBeDefined();
    expect(error).toContain("pelo menos 2 caracteres");
  });

  it("deve descartar campos role e email no retorno de validateUpdateProfile para evitar elevação", () => {
    const rawPayload = {
      fullName: "Usuário Hacker",
      role: 3,
      email: "admin@invasor.com",
    };

    const { error, value } = validateUpdateProfile(rawPayload);
    expect(error).toBeUndefined();
    expect(value?.fullName).toBe("Usuário Hacker");
    expect((value as unknown as Record<string, unknown>).role).toBeUndefined();
    expect((value as unknown as Record<string, unknown>).email).toBeUndefined();
  });
});
