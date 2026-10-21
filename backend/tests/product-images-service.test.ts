import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { handleRequest } from "@/app";
import { env } from "@/config/env";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { ACCEPTED_FORMATS_MESSAGE, readImageMetadata } from "@/lib/images";
import { signJwt } from "@/lib/jwt";
import { ROLES } from "@/middlewares/role";
import { ProductImagesRepository } from "@/modules/product-images/product-images.repository";
import {
  productImagesService,
  ProductImagesService,
} from "@/modules/product-images/product-images.service";
import { InsertProductImageInput } from "@/modules/product-images/product-images.types";
import { ProductsRepository } from "@/modules/products/products.repository";
import { ProductsService } from "@/modules/products/products.service";
import {
  ProductDto,
  ProductImageDto,
  ProductVariationDto,
} from "@/modules/products/products.types";
import { buildMultipartRequest } from "./multipart.test";

const SUP_A_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const SUP_B_ID = "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb";
const PROD_A_ID = "dddddddd-dddd-4ddd-addd-dddddddddddd";
const PROD_B_ID = "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee";
const PROD_DELETED_ID = "11111111-2222-4333-8444-555555555555";
const VAR_A_ID = "ffffffff-ffff-4fff-afff-ffffffffffff";
const VAR_B_ID = "99999999-9999-4999-a999-999999999999";
const VAR_A_DELETED_ID = "77777777-7777-4777-a777-777777777777";

const adminActor = { id: "admin-1", email: "admin@emporio.com", role: ROLES.ADMIN };
const sellerActor = { id: "seller-1", email: "vendedor@emporio.com", role: ROLES.SELLER };
const unlinkedSellerActor = { id: "seller-2", email: "novo@emporio.com", role: ROLES.SELLER };
const customerActor = { id: "customer-1", email: "cliente@emporio.com", role: ROLES.CUSTOMER };

const FIXTURES_DIR = path.join(import.meta.dir, "fixtures");
async function fixture(name: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(
    await Bun.file(path.join(FIXTURES_DIR, name)).arrayBuffer(),
  );
}

function product(id: string, supplierId: string): ProductDto {
  const now = new Date().toISOString();
  return {
    id,
    categoryId: "11111111-1111-4111-a111-111111111111",
    subtypeId: null,
    supplierId,
    name: `Produto ${id.slice(0, 4)}`,
    slug: `produto-${id.slice(0, 4)}`,
    collectionLine: null,
    mainMaterial: null,
    referencePrice: 1000,
    maxInstallments: 1,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 100,
    widthMm: 100,
    depthMm: 100,
    description: null,
    specifications: {},
    active: true,
    thumbnailUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

function variation(id: string, productId: string): ProductVariationDto {
  const now = new Date().toISOString();
  return {
    id,
    productId,
    name: "Carvalho",
    variationType: "WOOD",
    colorsHex: [],
    sampleImageUrl: null,
    finishDetails: {},
    sortOrder: 0,
    inStock: true,
    createdAt: now,
    updatedAt: now,
  };
}

// Só o necessário para assertCanManageProduct: produto ativo e vínculos do vendedor.
class FakeProductsRepository extends ProductsRepository {
  products = new Map<string, ProductDto>([
    [PROD_A_ID, product(PROD_A_ID, SUP_A_ID)],
    [PROD_B_ID, product(PROD_B_ID, SUP_B_ID)],
  ]);
  sellerSuppliers = new Map<string, string[]>([[sellerActor.id, [SUP_A_ID]]]);

  async findManageableById(id: string) {
    return this.products.get(id) ?? null;
  }

  async findActiveSupplierIdsByUserId(userId: string): Promise<string[]> {
    return this.sellerSuppliers.get(userId) ?? [];
  }
}

class FakeProductImagesRepository extends ProductImagesRepository {
  variations = new Map<string, ProductVariationDto & { deleted: boolean }>([
    [VAR_A_ID, { ...variation(VAR_A_ID, PROD_A_ID), deleted: false }],
    [VAR_A_DELETED_ID, { ...variation(VAR_A_DELETED_ID, PROD_A_ID), deleted: true }],
    [VAR_B_ID, { ...variation(VAR_B_ID, PROD_B_ID), deleted: false }],
  ]);
  images: (ProductImageDto & { deleted: boolean; thumbnailPath: string })[] = [];
  failInsert = false;
  insertCalls = 0;

  async findActiveVariation(productId: string, variationId: string) {
    const v = this.variations.get(variationId);
    if (!v || v.deleted || v.productId !== productId) return null;
    const { deleted, ...dto } = v;
    void deleted;
    return dto;
  }

  async insertImage(input: InsertProductImageInput): Promise<ProductImageDto> {
    this.insertCalls++;
    if (this.failInsert) {
      throw new Error("connection refused");
    }
    const active = this.images.filter((i) => i.productId === input.productId && !i.deleted);
    const sortOrder = active.reduce((max, i) => Math.max(max, i.sortOrder), -1) + 1;
    const dto: ProductImageDto = {
      id: input.id,
      productId: input.productId,
      variationId: input.variationId,
      thumbnailUrl: `/api/v1/uploads/${input.thumbnailPath}`,
      fullImageUrl: `/api/v1/uploads/${input.fullImagePath}`,
      sortOrder,
      createdAt: new Date().toISOString(),
    };
    this.images.push({ ...dto, deleted: false, thumbnailPath: input.thumbnailPath });
    return dto;
  }

  async softDeleteImage(productId: string, imageId: string): Promise<boolean> {
    const img = this.images.find((i) => i.id === imageId);
    if (!img || img.deleted || img.productId !== productId) return false;
    img.deleted = true;
    return true;
  }

  async updateVariationSample(productId: string, variationId: string, samplePath: string | null) {
    const v = this.variations.get(variationId);
    if (!v || v.deleted || v.productId !== productId) return null;
    v.sampleImageUrl = samplePath ? `/api/v1/uploads/${samplePath}` : null;
    const { deleted, ...dto } = v;
    void deleted;
    return dto;
  }
}

function listFiles(relativeDir: string): string[] {
  const absolute = path.join(env.UPLOADS_DIR, relativeDir);
  return existsSync(absolute) ? readdirSync(absolute).sort() : [];
}

const UPLOAD_URL = (productId: string) =>
  `http://localhost:3001/api/v1/produtos/${productId}/imagens`;
const SAMPLE_URL = (productId: string, variationId: string) =>
  `http://localhost:3001/api/v1/produtos/${productId}/variacoes/${variationId}/amostra`;

describe("Módulo product-images (US-BE-10)", () => {
  const originalUploadsDir = env.UPLOADS_DIR;
  let tmpDir: string;
  let imagesRepo: FakeProductImagesRepository;
  let service: ProductImagesService;
  let jpeg: Uint8Array<ArrayBuffer>;

  beforeAll(async () => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "emporio-product-images-"));
    env.UPLOADS_DIR = tmpDir;
    jpeg = await fixture("sofa-exif.jpg");
  });

  afterAll(() => {
    env.UPLOADS_DIR = originalUploadsDir;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    imagesRepo = new FakeProductImagesRepository();
    service = new ProductImagesService(
      imagesRepo,
      new ProductsService(new FakeProductsRepository()),
    );
  });

  describe("uploadProductImage", () => {
    it("Vendedor sem vínculo ou de outro fornecedor recebe 403 antes de o corpo ser lido", async () => {
      const unlinked = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
        files: [{ field: "file", bytes: jpeg }],
      });
      expect(
        service.uploadProductImage(PROD_A_ID, unlinkedSellerActor, unlinked),
      ).rejects.toThrow(ForbiddenError);
      await Bun.sleep(0);
      expect(unlinked.bodyUsed).toBeFalse();

      const otherSupplier = await buildMultipartRequest(UPLOAD_URL(PROD_B_ID), {
        files: [{ field: "file", bytes: jpeg }],
      });
      expect(
        service.uploadProductImage(PROD_B_ID, sellerActor, otherSupplier),
      ).rejects.toThrow(ForbiddenError);
      await Bun.sleep(0);
      expect(otherSupplier.bodyUsed).toBeFalse();
      expect(imagesRepo.insertCalls).toBe(0);
      expect(listFiles(`products/${PROD_B_ID}`)).toEqual([]);
    });

    it("produto inexistente ou desativado responde 404 sem gravar arquivo", async () => {
      const req = await buildMultipartRequest(UPLOAD_URL(PROD_DELETED_ID), {
        files: [{ field: "file", bytes: jpeg }],
      });
      expect(
        service.uploadProductImage(PROD_DELETED_ID, adminActor, req),
      ).rejects.toThrow(NotFoundError);
      await Bun.sleep(0);
      expect(req.bodyUsed).toBeFalse();
      expect(listFiles(`products/${PROD_DELETED_ID}`)).toEqual([]);
    });

    it("Content-Length de 8 MB é recusado com 400 sem ler o corpo", async () => {
      const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
        files: [{ field: "file", bytes: jpeg }],
        contentLength: 8 * 1024 * 1024,
      });
      expect(service.uploadProductImage(PROD_A_ID, adminActor, req)).rejects.toThrow(
        BadRequestError,
      );
      await Bun.sleep(0);
      expect(req.bodyUsed).toBeFalse();
    });

    it("arquivo de 2.097.153 bytes é recusado com o tamanho enviado e o limite", async () => {
      const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
        files: [{ field: "file", bytes: new Uint8Array(2_097_153) }],
      });
      const attempt = service.uploadProductImage(PROD_A_ID, adminActor, req);
      expect(attempt).rejects.toThrow(BadRequestError);
      expect(attempt).rejects.toThrow(
        "A imagem tem 2,00 MB (2.097.153 bytes); o limite é 2 MB (2.097.152 bytes).",
      );
      await attempt.catch(() => undefined);
      expect(listFiles(`products/${PROD_A_ID}`)).toEqual([]);
    });

    it("GIF e texto disfarçado de .jpg são recusados com a lista de formatos", async () => {
      for (const name of ["animacao.gif", "texto.jpg"]) {
        const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
          files: [{ field: "file", bytes: await fixture(name), name: "foto.jpg", type: "image/jpeg" }],
        });
        const attempt = service.uploadProductImage(PROD_A_ID, adminActor, req);
        expect(attempt).rejects.toThrow(BadRequestError);
        expect(attempt).rejects.toThrow(ACCEPTED_FORMATS_MESSAGE);
        await attempt.catch(() => undefined);
      }
      expect(listFiles(`products/${PROD_A_ID}`)).toEqual([]);
      expect(imagesRepo.insertCalls).toBe(0);
    });

    it("variação inexistente, removida ou de outro produto responde 400 sem gravar nada", async () => {
      for (const variationId of [VAR_B_ID, VAR_A_DELETED_ID, "00000000-0000-4000-8000-000000000000", "nao-uuid"]) {
        const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
          files: [{ field: "file", bytes: jpeg }],
          fields: { variationId },
        });
        const attempt = service.uploadProductImage(PROD_A_ID, adminActor, req);
        expect(attempt).rejects.toThrow(BadRequestError);
        await attempt.catch(() => undefined);
      }
      expect(listFiles(`products/${PROD_A_ID}`)).toEqual([]);
      expect(imagesRepo.images).toHaveLength(0);
    });

    it("falha do banco no INSERT apaga os dois arquivos da requisição e repropaga o erro", async () => {
      imagesRepo.failInsert = true;
      const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
        files: [{ field: "file", bytes: jpeg }],
      });

      const attempt = service.uploadProductImage(PROD_A_ID, adminActor, req);
      expect(attempt).rejects.toThrow("connection refused");
      await attempt.catch(() => undefined);

      expect(imagesRepo.insertCalls).toBe(1);
      expect(listFiles(`products/${PROD_A_ID}`)).toEqual([]);
    });

    it("upload válido grava thumb e full em WebP, com nome UUID e sort_order no fim do carrossel", async () => {
      for (let i = 0; i < 3; i++) {
        imagesRepo.images.push({
          id: `00000000-0000-4000-8000-00000000000${i}`,
          productId: PROD_A_ID,
          variationId: null,
          thumbnailUrl: "",
          fullImageUrl: "",
          sortOrder: i,
          createdAt: new Date().toISOString(),
          deleted: false,
          thumbnailPath: "",
        });
      }

      const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
        files: [{ field: "file", bytes: jpeg, name: "../../etc/passwd.jpg" }],
      });
      const dto = await service.uploadProductImage(PROD_A_ID, sellerActor, req);

      expect(dto.productId).toBe(PROD_A_ID);
      expect(dto.variationId).toBeNull();
      expect(dto.sortOrder).toBe(3);
      expect(dto.thumbnailUrl).toBe(`/api/v1/uploads/products/${PROD_A_ID}/${dto.id}-thumb.webp`);
      expect(dto.fullImageUrl).toBe(`/api/v1/uploads/products/${PROD_A_ID}/${dto.id}-full.webp`);

      const files = listFiles(`products/${PROD_A_ID}`);
      expect(files).toEqual([`${dto.id}-full.webp`, `${dto.id}-thumb.webp`]);

      const thumb = new Uint8Array(
        await Bun.file(path.join(tmpDir, "products", PROD_A_ID, `${dto.id}-thumb.webp`)).arrayBuffer(),
      );
      const full = new Uint8Array(
        await Bun.file(path.join(tmpDir, "products", PROD_A_ID, `${dto.id}-full.webp`)).arrayBuffer(),
      );
      expect(await readImageMetadata(thumb)).toEqual({ width: 480, height: 360, format: "webp" });
      expect(await readImageMetadata(full)).toEqual({ width: 1920, height: 1440, format: "webp" });
      expect(thumb.byteLength).toBeLessThan(50 * 1024);
      expect(Buffer.from(full).toString("latin1")).not.toContain("EMPORIO-EXIF-MARKER");
    });

    it("foto vinculada a variação ativa do próprio produto guarda o variationId", async () => {
      const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
        files: [{ field: "file", bytes: await fixture("textura.png"), name: "textura.png", type: "image/png" }],
        fields: { variationId: VAR_A_ID },
      });
      const dto = await service.uploadProductImage(PROD_A_ID, adminActor, req);
      expect(dto.variationId).toBe(VAR_A_ID);
      expect(dto.sortOrder).toBe(0);
    });
  });

  describe("deleteProductImage", () => {
    it("aplica soft delete na foto do produto e mantém os arquivos no volume", async () => {
      const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
        files: [{ field: "file", bytes: jpeg }],
      });
      const dto = await service.uploadProductImage(PROD_A_ID, adminActor, req);

      await service.deleteProductImage(PROD_A_ID, dto.id, sellerActor);
      expect(imagesRepo.images[0]!.deleted).toBeTrue();
      expect(listFiles(`products/${PROD_A_ID}`)).toHaveLength(2);

      // Já excluída: 404.
      expect(service.deleteProductImage(PROD_A_ID, dto.id, adminActor)).rejects.toThrow(NotFoundError);
    });

    it("foto de outro produto responde 404 e Vendedor fora do escopo 403", async () => {
      const req = await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), {
        files: [{ field: "file", bytes: jpeg }],
      });
      const dto = await service.uploadProductImage(PROD_A_ID, adminActor, req);

      expect(service.deleteProductImage(PROD_B_ID, dto.id, adminActor)).rejects.toThrow(NotFoundError);
      expect(service.deleteProductImage(PROD_B_ID, dto.id, sellerActor)).rejects.toThrow(ForbiddenError);
      expect(imagesRepo.images[0]!.deleted).toBeFalse();
    });
  });

  describe("putVariationSample / deleteVariationSample", () => {
    it("grava a amostra em WebP de até 512 px, sempre com nome novo, preservando o arquivo anterior", async () => {
      const first = await service.putVariationSample(
        PROD_A_ID,
        VAR_A_ID,
        adminActor,
        await buildMultipartRequest(SAMPLE_URL(PROD_A_ID, VAR_A_ID), {
          files: [{ field: "file", bytes: jpeg }],
        }, {}, "PUT"),
      );
      const second = await service.putVariationSample(
        PROD_A_ID,
        VAR_A_ID,
        sellerActor,
        await buildMultipartRequest(SAMPLE_URL(PROD_A_ID, VAR_A_ID), {
          files: [{ field: "file", bytes: jpeg }],
        }, {}, "PUT"),
      );

      expect(first.sampleImageUrl).toMatch(
        new RegExp(`^/api/v1/uploads/variations/${VAR_A_ID}/[0-9a-f-]{36}\\.webp$`),
      );
      expect(second.sampleImageUrl).not.toBe(first.sampleImageUrl);

      const files = listFiles(`variations/${VAR_A_ID}`);
      expect(files).toHaveLength(2);
      const firstName = first.sampleImageUrl!.split("/").pop()!;
      expect(files).toContain(firstName);

      const sample = new Uint8Array(
        await Bun.file(path.join(tmpDir, "variations", VAR_A_ID, firstName)).arrayBuffer(),
      );
      expect(await readImageMetadata(sample)).toEqual({ width: 512, height: 384, format: "webp" });
    });

    it("variação inexistente, removida ou de outro produto responde 404 sem gravar arquivo", async () => {
      for (const [productId, variationId] of [
        [PROD_A_ID, VAR_B_ID],
        [PROD_A_ID, VAR_A_DELETED_ID],
        [PROD_A_ID, "00000000-0000-4000-8000-000000000000"],
      ] as const) {
        const req = await buildMultipartRequest(SAMPLE_URL(productId, variationId), {
          files: [{ field: "file", bytes: jpeg }],
        }, {}, "PUT");
        const attempt = service.putVariationSample(productId, variationId, adminActor, req);
        expect(attempt).rejects.toThrow(NotFoundError);
        await attempt.catch(() => undefined);
        expect(req.bodyUsed).toBeFalse();
        expect(listFiles(`variations/${variationId}`)).toEqual([]);
      }
    });

    it("DELETE volta sample_image_path para null e mantém o arquivo", async () => {
      const put = await service.putVariationSample(
        PROD_A_ID,
        VAR_A_ID,
        adminActor,
        await buildMultipartRequest(SAMPLE_URL(PROD_A_ID, VAR_A_ID), {
          files: [{ field: "file", bytes: jpeg }],
        }, {}, "PUT"),
      );
      expect(put.sampleImageUrl).not.toBeNull();

      const removed = await service.deleteVariationSample(PROD_A_ID, VAR_A_ID, sellerActor);
      expect(removed.sampleImageUrl).toBeNull();
      expect(listFiles(`variations/${VAR_A_ID}`)).toHaveLength(1);

      expect(service.deleteVariationSample(PROD_A_ID, VAR_B_ID, adminActor)).rejects.toThrow(NotFoundError);
      expect(service.deleteVariationSample(PROD_B_ID, VAR_B_ID, sellerActor)).rejects.toThrow(ForbiddenError);
    });
  });

  describe("Rotas HTTP em /api/v1/produtos (handleRequest)", () => {
    // O singleton usado pelas rotas passa a delegar para o serviço com repositórios falsos.
    const original = {
      upload: productImagesService.uploadProductImage,
      remove: productImagesService.deleteProductImage,
      putSample: productImagesService.putVariationSample,
      deleteSample: productImagesService.deleteVariationSample,
    };

    beforeEach(() => {
      productImagesService.uploadProductImage = (...args) => service.uploadProductImage(...args);
      productImagesService.deleteProductImage = (...args) => service.deleteProductImage(...args);
      productImagesService.putVariationSample = (...args) => service.putVariationSample(...args);
      productImagesService.deleteVariationSample = (...args) => service.deleteVariationSample(...args);
    });

    afterAll(() => {
      productImagesService.uploadProductImage = original.upload;
      productImagesService.deleteProductImage = original.remove;
      productImagesService.putVariationSample = original.putSample;
      productImagesService.deleteVariationSample = original.deleteSample;
    });

    it("401 sem token em todas as rotas de escrita de imagem", async () => {
      const requests = [
        await buildMultipartRequest(UPLOAD_URL(PROD_A_ID), { files: [{ field: "file", bytes: jpeg }] }),
        new Request(`${UPLOAD_URL(PROD_A_ID)}/${VAR_A_ID}`, { method: "DELETE" }),
        await buildMultipartRequest(SAMPLE_URL(PROD_A_ID, VAR_A_ID), { files: [{ field: "file", bytes: jpeg }] }, {}, "PUT"),
        new Request(SAMPLE_URL(PROD_A_ID, VAR_A_ID), { method: "DELETE" }),
      ];
      for (const req of requests) {
        const res = await handleRequest(req);
        expect(res?.status).toBe(401);
      }
    });

    it("403 para Cliente (role = 1) sem ler o arquivo", async () => {
      const token = await signJwt(customerActor);
      const req = await buildMultipartRequest(
        UPLOAD_URL(PROD_A_ID),
        { files: [{ field: "file", bytes: jpeg }] },
        { Authorization: `Bearer ${token}` },
      );
      const res = await handleRequest(req);
      expect(res?.status).toBe(403);
      expect(req.bodyUsed).toBeFalse();
      expect(imagesRepo.insertCalls).toBe(0);
    });

    it("201 com ProductImageDto para Admin e 400 em JSON para arquivo acima de 2 MiB", async () => {
      const token = await signJwt(adminActor);
      const req = await buildMultipartRequest(
        UPLOAD_URL(PROD_A_ID),
        { files: [{ field: "file", bytes: jpeg }], fields: { variationId: VAR_A_ID } },
        { Authorization: `Bearer ${token}` },
      );
      const res = await handleRequest(req);
      expect(res?.status).toBe(201);
      expect(res?.headers.get("content-type")).toBe("application/json");

      const body = (await res!.json()) as ProductImageDto;
      expect(Object.keys(body).sort()).toEqual(
        ["createdAt", "fullImageUrl", "id", "productId", "sortOrder", "thumbnailUrl", "variationId"],
      );
      expect(body.productId).toBe(PROD_A_ID);
      expect(body.variationId).toBe(VAR_A_ID);
      expect(body.sortOrder).toBe(0);
      expect(body.thumbnailUrl).toBe(`/api/v1/uploads/products/${PROD_A_ID}/${body.id}-thumb.webp`);

      const tooBig = await buildMultipartRequest(
        UPLOAD_URL(PROD_A_ID),
        { files: [{ field: "file", bytes: new Uint8Array(2_097_153) }] },
        { Authorization: `Bearer ${token}` },
      );
      const bigRes = await handleRequest(tooBig);
      expect(bigRes?.status).toBe(400);
      const err = (await bigRes!.json()) as { error: string; message: string };
      expect(err.error).toBe("Bad Request");
      expect(err.message).toContain("2.097.153 bytes");
    });

    it("400 para :id que não é UUID", async () => {
      const token = await signJwt(adminActor);
      const req = await buildMultipartRequest(
        UPLOAD_URL("nao-uuid"),
        { files: [{ field: "file", bytes: jpeg }] },
        { Authorization: `Bearer ${token}` },
      );
      const res = await handleRequest(req);
      expect(res?.status).toBe(400);
    });

    it("DELETE responde 200 com { message } e 404 para foto de outro produto", async () => {
      const token = await signJwt(adminActor);
      const upload = await handleRequest(
        await buildMultipartRequest(
          UPLOAD_URL(PROD_A_ID),
          { files: [{ field: "file", bytes: jpeg }] },
          { Authorization: `Bearer ${token}` },
        ),
      );
      const created = (await upload!.json()) as ProductImageDto;

      const wrongProduct = await handleRequest(
        new Request(`${UPLOAD_URL(PROD_B_ID)}/${created.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      expect(wrongProduct?.status).toBe(404);

      const res = await handleRequest(
        new Request(`${UPLOAD_URL(PROD_A_ID)}/${created.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      expect(res?.status).toBe(200);
      expect(await res!.json()).toEqual({ message: "Foto removida com sucesso." });
    });

    it("PUT e DELETE da amostra respondem 200 com a variação", async () => {
      const token = await signJwt(sellerActor);
      const put = await handleRequest(
        await buildMultipartRequest(
          SAMPLE_URL(PROD_A_ID, VAR_A_ID),
          { files: [{ field: "file", bytes: jpeg }] },
          { Authorization: `Bearer ${token}` },
          "PUT",
        ),
      );
      expect(put?.status).toBe(200);
      const putBody = (await put!.json()) as ProductVariationDto;
      expect(putBody.id).toBe(VAR_A_ID);
      expect(putBody.sampleImageUrl).toStartWith(`/api/v1/uploads/variations/${VAR_A_ID}/`);

      const del = await handleRequest(
        new Request(SAMPLE_URL(PROD_A_ID, VAR_A_ID), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      expect(del?.status).toBe(200);
      expect(((await del!.json()) as ProductVariationDto).sampleImageUrl).toBeNull();

      // Vendedor vinculado só ao fornecedor A não altera amostra do produto B.
      const forbidden = await handleRequest(
        new Request(SAMPLE_URL(PROD_B_ID, VAR_B_ID), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      expect(forbidden?.status).toBe(403);
    });
  });
});
