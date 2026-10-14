import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { handleRequest } from "@/app";
import { env } from "@/config/env";
import { signJwt } from "@/lib/jwt";
import { ROLES } from "@/middlewares/role";
import { usersRepository } from "@/modules/users/users.repository";
import { userSuppliersRepository } from "@/modules/user-suppliers/user-suppliers.repository";
import { suppliersRepository } from "@/modules/suppliers/suppliers.repository";
import { PaginatedUsersResult, UserDto, UserQueryFilters } from "@/modules/users/users.types";
import { PaginatedAssignedSuppliersResult, UserSupplierLinkDto, UserSupplierQueryFilters } from "@/modules/user-suppliers/user-suppliers.types";
import { SupplierDto } from "@/modules/suppliers/suppliers.types";
import { paginate, resolvePagination } from "@/lib/pagination";

describe("Rotas HTTP de Vendedores (/api/v1/vendedores)", () => {
  let adminToken: string;
  let sellerToken: string;
  let customerToken: string;

  // Armazena métodos originais para restauração
  const originalUsersFindById = usersRepository.findById;
  const originalUsersList = usersRepository.list;
  const originalUserSuppliersList = userSuppliersRepository.listByUserId;
  const originalUserSuppliersFind = userSuppliersRepository.findExistingLink;
  const originalUserSuppliersCreate = userSuppliersRepository.createLink;
  const originalUserSuppliersReactivate = userSuppliersRepository.reactivateLink;
  const originalUserSuppliersRevoke = userSuppliersRepository.revokeLink;
  const originalSuppliersFindById = suppliersRepository.findById;

  // Estado em memória para simular o banco
  const usersDb = new Map<string, UserDto>();
  const suppliersDb = new Map<string, SupplierDto>();
  const linksDb = new Map<string, { id: string; userId: string; supplierId: string; deleted: boolean; createdAt: string }>();

  const validSellerId = "11111111-1111-4111-a111-111111111111";
  const validAdminId = "22222222-2222-4222-a222-222222222222";
  const validCustomerId = "33333333-3333-4333-a333-333333333333";
  const nonExistentUserId = "99999999-9999-4999-a999-999999999999";
  const validSupplierId = "55555555-5555-4555-a555-555555555555";

  beforeAll(async () => {
    adminToken = await signJwt(
      { id: validAdminId, email: "admin@emporio.com.br", role: ROLES.ADMIN },
      env.JWT_SECRET,
    );
    sellerToken = await signJwt(
      { id: validSellerId, email: "vendedor@emporio.com.br", role: ROLES.SELLER },
      env.JWT_SECRET,
    );
    customerToken = await signJwt(
      { id: validCustomerId, email: "cliente@emporio.com.br", role: ROLES.CUSTOMER },
      env.JWT_SECRET,
    );

    usersDb.set(validSellerId, {
      id: validSellerId,
      email: "vendedor@emporio.com.br",
      role: ROLES.SELLER,
      fullName: "Carlos Vendedor",
      phone: "5199999999",
      city: "Estrela",
    });

    usersDb.set(validAdminId, {
      id: validAdminId,
      email: "admin@emporio.com.br",
      role: ROLES.ADMIN,
      fullName: "Adriana Admin",
      phone: null,
      city: "Cruzeiro do Sul",
    });

    usersDb.set(validCustomerId, {
      id: validCustomerId,
      email: "cliente@emporio.com.br",
      role: ROLES.CUSTOMER,
      fullName: "Clara Cliente",
      phone: null,
      city: "Lajeado",
    });

    suppliersDb.set(validSupplierId, {
      id: validSupplierId,
      name: "Fornecedor Parceiro",
      contact: "fornecedor@teste.com",
      active: true,
    });

    // Mocks nos repositórios
    usersRepository.findById = async (id: string): Promise<UserDto | null> => {
      return usersDb.get(id) || null;
    };

    usersRepository.list = async (filters: UserQueryFilters): Promise<PaginatedUsersResult> => {
      let items = Array.from(usersDb.values());
      if (filters.role) {
        items = items.filter((u) => u.role === filters.role);
      }
      const { page, limit, offset } = resolvePagination(filters);
      return paginate(items.slice(offset, offset + limit), items.length, { page, limit });
    };

    userSuppliersRepository.listByUserId = async (
      userId: string,
      filters: UserSupplierQueryFilters = {},
    ): Promise<PaginatedAssignedSuppliersResult> => {
      const { page, limit, offset } = resolvePagination(filters);
      const assigned: { id: string; name: string; contact: string | null; active: boolean; linkedAt: string }[] = [];
      for (const link of linksDb.values()) {
        if (link.userId === userId && !link.deleted) {
          const supp = suppliersDb.get(link.supplierId);
          if (supp) {
            assigned.push({
              id: supp.id,
              name: supp.name,
              contact: supp.contact,
              active: supp.active,
              linkedAt: link.createdAt,
            });
          }
        }
      }
      return paginate(assigned.slice(offset, offset + limit), assigned.length, { page, limit });
    };

    userSuppliersRepository.findExistingLink = async (userId: string, supplierId: string) => {
      for (const link of linksDb.values()) {
        if (link.userId === userId && link.supplierId === supplierId) {
          return {
            id: link.id,
            user_id: link.userId,
            supplier_id: link.supplierId,
            created_at: new Date(link.createdAt),
            updated_at: new Date(),
            deleted_at: link.deleted ? new Date() : null,
          };
        }
      }
      return null;
    };

    userSuppliersRepository.createLink = async (userId: string, supplierId: string): Promise<UserSupplierLinkDto> => {
      const id = `link-${linksDb.size + 1}`;
      const item = {
        id,
        userId,
        supplierId,
        deleted: false,
        createdAt: new Date().toISOString(),
      };
      linksDb.set(id, item);
      return {
        id: item.id,
        userId: item.userId,
        supplierId: item.supplierId,
        createdAt: item.createdAt,
      };
    };

    userSuppliersRepository.reactivateLink = async (id: string): Promise<UserSupplierLinkDto> => {
      const item = linksDb.get(id);
      if (item) {
        item.deleted = false;
      }
      return {
        id: item!.id,
        userId: item!.userId,
        supplierId: item!.supplierId,
        createdAt: item!.createdAt,
      };
    };

    userSuppliersRepository.revokeLink = async (userId: string, supplierId: string): Promise<boolean> => {
      for (const link of linksDb.values()) {
        if (link.userId === userId && link.supplierId === supplierId && !link.deleted) {
          link.deleted = true;
          return true;
        }
      }
      return false;
    };

    suppliersRepository.findById = async (id: string): Promise<SupplierDto | null> => {
      return suppliersDb.get(id) || null;
    };
  });

  afterAll(() => {
    usersRepository.findById = originalUsersFindById;
    usersRepository.list = originalUsersList;
    userSuppliersRepository.listByUserId = originalUserSuppliersList;
    userSuppliersRepository.findExistingLink = originalUserSuppliersFind;
    userSuppliersRepository.createLink = originalUserSuppliersCreate;
    userSuppliersRepository.reactivateLink = originalUserSuppliersReactivate;
    userSuppliersRepository.revokeLink = originalUserSuppliersRevoke;
    suppliersRepository.findById = originalSuppliersFindById;
  });

  describe("RBAC de Administrador em Todas as 4 Rotas (403 / 401)", () => {
    it("deve retornar 401 Unauthorized se requisição não contiver token", async () => {
      const routes = [
        { method: "GET", path: "/api/v1/vendedores" },
        { method: "GET", path: `/api/v1/vendedores/${validSellerId}/fornecedores` },
        { method: "POST", path: `/api/v1/vendedores/${validSellerId}/fornecedores` },
        { method: "DELETE", path: `/api/v1/vendedores/${validSellerId}/fornecedores/${validSupplierId}` },
      ];

      for (const r of routes) {
        const req = new Request(`http://localhost:3001${r.path}`, { method: r.method });
        const res = await handleRequest(req);
        expect(res.status).toBe(401);
      }
    });

    it("deve retornar 403 Forbidden para usuário Vendedor (role=2) em todas as rotas", async () => {
      const routes = [
        { method: "GET", path: "/api/v1/vendedores" },
        { method: "GET", path: `/api/v1/vendedores/${validSellerId}/fornecedores` },
        { method: "POST", path: `/api/v1/vendedores/${validSellerId}/fornecedores`, body: JSON.stringify({ supplierId: validSupplierId }) },
        { method: "DELETE", path: `/api/v1/vendedores/${validSellerId}/fornecedores/${validSupplierId}` },
      ];

      for (const r of routes) {
        const req = new Request(`http://localhost:3001${r.path}`, {
          method: r.method,
          headers: {
            Authorization: `Bearer ${sellerToken}`,
            "Content-Type": "application/json",
          },
          body: r.body,
        });
        const res = await handleRequest(req);
        expect(res.status).toBe(403);
        const data = (await res.json()) as { error: string };
        expect(data.error).toBe("Forbidden");
      }
    });

    it("deve retornar 403 Forbidden para usuário Cliente (role=1) em todas as rotas", async () => {
      const routes = [
        { method: "GET", path: "/api/v1/vendedores" },
        { method: "GET", path: `/api/v1/vendedores/${validSellerId}/fornecedores` },
        { method: "POST", path: `/api/v1/vendedores/${validSellerId}/fornecedores`, body: JSON.stringify({ supplierId: validSupplierId }) },
        { method: "DELETE", path: `/api/v1/vendedores/${validSellerId}/fornecedores/${validSupplierId}` },
      ];

      for (const r of routes) {
        const req = new Request(`http://localhost:3001${r.path}`, {
          method: r.method,
          headers: {
            Authorization: `Bearer ${customerToken}`,
            "Content-Type": "application/json",
          },
          body: r.body,
        });
        const res = await handleRequest(req);
        expect(res.status).toBe(403);
      }
    });
  });

  describe("Validação de Vendedor Ativo nas Rotas /vendedores/:id/... (404 Not Found)", () => {
    it("deve retornar 400 quando o :id não é um UUID válido", async () => {
      const req = new Request("http://localhost:3001/api/v1/vendedores/abc/fornecedores", {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.message).toBe("ID de vendedor inválido.");
    });    it("deve retornar 404 quando o :id não existe", async () => {
      const req = new Request(`http://localhost:3001/api/v1/vendedores/${nonExistentUserId}/fornecedores`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(404);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.error).toBe("Not Found");
      expect(data.message).toBe("Vendedor não encontrado.");
    });

    it("deve retornar 404 quando o :id pertence a um Administrador (role=3)", async () => {
      const req = new Request(`http://localhost:3001/api/v1/vendedores/${validAdminId}/fornecedores`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(404);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.message).toBe("Vendedor não encontrado.");
    });

    it("deve retornar 404 quando o :id pertence a um Cliente (role=1)", async () => {
      const req = new Request(`http://localhost:3001/api/v1/vendedores/${validCustomerId}/fornecedores`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(404);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.message).toBe("Vendedor não encontrado.");
    });

    it("deve retornar 404 ao tentar revogar um vínculo inexistente", async () => {
      const req = new Request(
        `http://localhost:3001/api/v1/vendedores/${validSellerId}/fornecedores/88888888-8888-4888-a888-888888888888`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      const res = await handleRequest(req);
      expect(res.status).toBe(404);
    });
  });

  describe("Listagens Paginadas e Operações de Vínculo com Sucesso (200 / 201)", () => {
    it("deve listar vendedores com paginação correta no GET /api/v1/vendedores", async () => {
      const req = new Request("http://localhost:3001/api/v1/vendedores?page=1&limit=10", {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = (await res.json()) as {
        data: UserDto[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
      expect(json.pagination).toBeDefined();
      expect(json.pagination.page).toBe(1);
      expect(json.pagination.limit).toBe(10);
      expect(json.pagination.total).toBe(1);
      expect(json.data[0].id).toBe(validSellerId);
      expect(json.data[0].role).toBe(ROLES.SELLER);
    });

    it("deve criar vínculo de fornecedor via POST /api/v1/vendedores/:id/fornecedores", async () => {
      const req = new Request(`http://localhost:3001/api/v1/vendedores/${validSellerId}/fornecedores`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ supplierId: validSupplierId }),
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(201);
      const json = (await res.json()) as UserSupplierLinkDto;
      expect(json.userId).toBe(validSellerId);
      expect(json.supplierId).toBe(validSupplierId);
    });

    it("deve listar fornecedores vinculados com paginação no GET /api/v1/vendedores/:id/fornecedores", async () => {
      const req = new Request(`http://localhost:3001/api/v1/vendedores/${validSellerId}/fornecedores`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = (await res.json()) as {
        data: { id: string; name: string }[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
      expect(json.pagination.total).toBe(1);
      expect(json.data[0].id).toBe(validSupplierId);
    });
  });

  describe("Garantia de Soft Delete e Exclusão Imediata (Critério 3 da issue)", () => {
    it("deve revogar vínculo via DELETE e certificar que a listagem subsequente não inclui o fornecedor", async () => {
      // 1. Confirma que o fornecedor está vinculado
      const getBefore = new Request(`http://localhost:3001/api/v1/vendedores/${validSellerId}/fornecedores`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const resBefore = await handleRequest(getBefore);
      const jsonBefore = (await resBefore.json()) as { data: { id: string }[] };
      expect(jsonBefore.data.some((s) => s.id === validSupplierId)).toBe(true);

      // 2. Executa a revogação (soft delete)
      const deleteReq = new Request(
        `http://localhost:3001/api/v1/vendedores/${validSellerId}/fornecedores/${validSupplierId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      const resDelete = await handleRequest(deleteReq);
      expect(resDelete.status).toBe(200);

      // 3. Consulta imediatamente a lista e comprova que o vínculo revogado foi ignorado
      const getAfter = new Request(`http://localhost:3001/api/v1/vendedores/${validSellerId}/fornecedores`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const resAfter = await handleRequest(getAfter);
      const jsonAfter = (await resAfter.json()) as { data: { id: string }[]; pagination: { total: number } };
      expect(jsonAfter.pagination.total).toBe(0);
      expect(jsonAfter.data.some((s) => s.id === validSupplierId)).toBe(false);
    });
  });
});
