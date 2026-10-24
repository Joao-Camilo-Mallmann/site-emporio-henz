import { describe, expect, it } from "bun:test";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserQuery,
} from "@/modules/users/users.schema";

describe("Validação de Schemas do Módulo de Usuários", () => {
  it("deve validar payload de criação de usuário", () => {
    const valid = validateCreateUser({
      fullName: "Admin Chefe",
      email: "chefe@admin.com",
      password: "senhaForte123",
      role: 3,
    });

    expect(valid.error).toBeUndefined();
    expect(valid.value?.role).toBe(3);
  });

  it("deve validar payload de atualização de usuário", () => {
    const valid = validateUpdateUser({
      fullName: "Nome Alterado",
      city: "Lajeado",
    });
    expect(valid.error).toBeUndefined();
    expect(valid.value?.fullName).toBe("Nome Alterado");

    const empty = validateUpdateUser({});
    expect(empty.error).toBeDefined();
  });

  it("deve rejeitar role inválido (ex: role 4)", () => {
    const invalid = validateCreateUser({
      fullName: "Admin Chefe",
      email: "chefe@admin.com",
      password: "senhaForte123",
      role: 4,
    });

    expect(invalid.error).toBeDefined();
  });

  it("deve validar parâmetros de paginação e filtros", () => {
    const url = new URL("http://localhost/api/v1/users?page=2&limit=10&search=maria&role=1");
    const filters = validateUserQuery(url);

    expect(filters.page).toBe(2);
    expect(filters.limit).toBe(10);
    expect(filters.search).toBe("maria");
    expect(filters.role).toBe(1);
  });
});
