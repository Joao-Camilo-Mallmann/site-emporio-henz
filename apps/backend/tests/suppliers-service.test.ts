import { describe, expect, it } from "bun:test";
import { SuppliersService } from "@/modules/suppliers/suppliers.service";
import { SuppliersRepository } from "@/modules/suppliers/suppliers.repository";
import {
  CreateSupplierDto,
  SupplierDto,
  UpdateSupplierDto,
} from "@/modules/suppliers/suppliers.types";
import { NotFoundError } from "@/lib/errors";
import {
  validateCreateSupplier,
  validateUpdateSupplier,
} from "@/modules/suppliers/suppliers.schema";

class MockSuppliersRepository extends SuppliersRepository {
  public suppliers: Map<string, SupplierDto & { deleted: boolean }> = new Map();

  async list(): Promise<SupplierDto[]> {
    return Array.from(this.suppliers.values())
      .filter((s) => !s.deleted)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<SupplierDto | null> {
    const s = this.suppliers.get(id);
    if (!s || s.deleted) {
      return null;
    }
    return {
      id: s.id,
      name: s.name,
      contact: s.contact,
      active: s.active,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  async create(data: CreateSupplierDto): Promise<SupplierDto> {
    const id = `supp-${Date.now()}-${Math.random()}`;
    const s = {
      id,
      name: data.name,
      contact: data.contact || null,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    this.suppliers.set(id, s);
    return s;
  }

  async update(id: string, data: UpdateSupplierDto): Promise<SupplierDto | null> {
    const s = this.suppliers.get(id);
    if (!s || s.deleted) {
      return null;
    }
    if (data.name !== undefined) s.name = data.name;
    if (data.contact !== undefined) s.contact = data.contact;
    if (data.active !== undefined) s.active = data.active;
    s.updatedAt = new Date().toISOString();
    return s;
  }

  async softDelete(id: string): Promise<boolean> {
    const s = this.suppliers.get(id);
    if (!s || s.deleted) {
      return false;
    }
    s.deleted = true;
    return true;
  }
}

describe("Módulo de Fornecedores (SuppliersService)", () => {
  it("deve criar um fornecedor e listá-lo com sucesso", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    const created = await service.create({
      name: "Madeiras Henz Sul",
      contact: "comercial@henz.com.br",
      active: true,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Madeiras Henz Sul");

    const list = await service.list();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("Madeiras Henz Sul");
  });

  it("deve buscar fornecedor por id e atualizar seus dados", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    const supplier = await service.create({
      name: "Fábrica Antiga",
    });

    const updated = await service.update(supplier.id, {
      name: "Fábrica Nova",
      active: false,
    });

    expect(updated.name).toBe("Fábrica Nova");
    expect(updated.active).toBe(false);

    const fetched = await service.getById(supplier.id);
    expect(fetched.name).toBe("Fábrica Nova");
  });

  it("deve aplicar soft delete no fornecedor e não listá-lo mais", async () => {
    const mockRepo = new MockSuppliersRepository();
    const service = new SuppliersService(mockRepo);

    const supplier = await service.create({
      name: "Para Desativar",
    });

    await service.delete(supplier.id);

    const list = await service.list();
    expect(list.length).toBe(0);

    await expect(service.getById(supplier.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("Validação de Schemas de Fornecedores", () => {
  it("deve validar dados válidos de fornecedor", () => {
    const valid = validateCreateSupplier({
      name: "Fábrica de Cadeiras Estrela",
      contact: "51 9999-0000",
      active: true,
    });

    expect(valid.error).toBeUndefined();
    expect(valid.value?.name).toBe("Fábrica de Cadeiras Estrela");
  });

  it("deve rejeitar nome menor que 2 caracteres", () => {
    const invalid = validateCreateSupplier({
      name: "A",
    });

    expect(invalid.error).toBeDefined();
  });

  it("deve exigir ao menos um campo no update", () => {
    const empty = validateUpdateSupplier({});
    expect(empty.error).toBeDefined();
  });
});
