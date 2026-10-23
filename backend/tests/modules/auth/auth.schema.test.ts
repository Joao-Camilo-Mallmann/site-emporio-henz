import { describe, expect, it } from "bun:test";
import {
  validateLogin,
  validateRegister,
  validateUpdateProfile,
} from "@/modules/auth/auth.schema";

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
