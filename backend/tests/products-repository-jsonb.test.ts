import { describe, expect, it } from "bun:test";
import type { sql } from "@/config/database";
import { ProductsRepository } from "@/modules/products/products.repository";

// Regressão da migração 013: as colunas `jsonb` (`specifications` e
// `finish_details`) recebem o objeto, nunca `JSON.stringify(objeto)`. O driver
// SQL do Bun codifica de novo um texto enviado para JSON, e o valor era gravado
// como um `jsonb` do tipo string.
//
// O repositório recebe um cliente SQL falso que registra os parâmetros de cada
// consulta e devolve uma linha genérica, sem banco.

const VARIATION_ID = "00000000-0000-4000-8000-000000000002";

const GENERIC_ROW = {
  id: VARIATION_ID,
  product_id: "00000000-0000-4000-8000-000000000001",
  category_id: "00000000-0000-4000-8000-000000000003",
  subtype_id: null,
  supplier_id: "00000000-0000-4000-8000-000000000004",
  name: "Roupeiro Roma",
  slug: "roupeiro-roma",
  collection_line: null,
  main_material: null,
  reference_price: "4590.00",
  max_installments: 10,
  availability_type: "IN_STOCK",
  estimated_days: 0,
  height_mm: 2300,
  width_mm: 2700,
  depth_mm: 600,
  description: null,
  specifications: {},
  active: true,
  variation_type: "WOOD",
  colors_hex: ["#8B5A2B"],
  sample_image_path: null,
  finish_details: {},
  sort_order: 0,
  in_stock: true,
  thumbnail_path: "",
  full_image_path: "",
  variation_id: null,
  created_at: new Date("2026-10-21T00:00:00Z"),
  updated_at: new Date("2026-10-21T00:00:00Z"),
};

interface RecordedQuery {
  text: string;
  values: unknown[];
}

function createFakeDb() {
  const queries: RecordedQuery[] = [];
  const query = (strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push({ text: strings.join("?"), values });
    return Promise.resolve([GENERIC_ROW]);
  };
  const db = Object.assign(query, {
    begin: <T>(fn: (tx: typeof query) => Promise<T>) => fn(query),
  });
  return { db: db as unknown as typeof sql, queries };
}

/** Parâmetros enviados à consulta cujo texto contém `fragment`. */
function valuesOf(queries: RecordedQuery[], fragment: string): unknown[] {
  return queries
    .filter((q) => q.text.includes(fragment))
    .flatMap((q) => q.values);
}

/** Algum parâmetro é um texto com cara de objeto JSON serializado? */
function hasJsonText(values: unknown[]): boolean {
  return values.some(
    (value) => typeof value === "string" && value.trim().startsWith("{"),
  );
}

const SPECIFICATIONS = { portas: "6", gavetas: "4" };
const FINISH_DETAILS = { corpo: "Carvalho Mel", portas: "Off White" };

describe("ProductsRepository: colunas jsonb", () => {
  it("cadastro envia specifications e finishDetails como objeto", async () => {
    const { db, queries } = createFakeDb();
    const repo = new ProductsRepository(db);

    await repo.createProduct({
      categoryId: GENERIC_ROW.category_id,
      supplierId: GENERIC_ROW.supplier_id,
      name: "Roupeiro Roma",
      slug: "roupeiro-roma",
      referencePrice: 4590,
      availabilityType: "IN_STOCK",
      estimatedDays: 0,
      heightMm: 2300,
      widthMm: 2700,
      depthMm: 600,
      specifications: SPECIFICATIONS,
      variations: [
        { name: "Carvalho", variationType: "WOOD", finishDetails: FINISH_DETAILS },
      ],
    });

    const productValues = valuesOf(queries, "INSERT INTO products");
    expect(productValues).toContainEqual(SPECIFICATIONS);
    expect(hasJsonText(productValues)).toBe(false);

    const variationValues = valuesOf(queries, "INSERT INTO product_variations");
    expect(variationValues).toContainEqual(FINISH_DETAILS);
    expect(hasJsonText(variationValues)).toBe(false);
  });

  it("cadastro sem specifications envia objeto vazio", async () => {
    const { db, queries } = createFakeDb();
    await new ProductsRepository(db).createProduct({
      categoryId: GENERIC_ROW.category_id,
      supplierId: GENERIC_ROW.supplier_id,
      name: "Mesa",
      slug: "mesa",
      referencePrice: 100,
      availabilityType: "IN_STOCK",
      estimatedDays: 0,
      heightMm: 750,
      widthMm: 1200,
      depthMm: 800,
    });

    expect(valuesOf(queries, "INSERT INTO products")).toContainEqual({});
  });

  it("edição envia specifications e finishDetails como objeto", async () => {
    const { db, queries } = createFakeDb();
    const repo = new ProductsRepository(db);

    await repo.updateProduct(GENERIC_ROW.product_id, {
      specifications: {},
      variations: [
        {
          id: VARIATION_ID,
          name: "Carvalho",
          variationType: "WOOD",
          finishDetails: FINISH_DETAILS,
        },
      ],
    });

    const productValues = valuesOf(queries, "UPDATE products");
    expect(productValues).toContainEqual({});
    expect(hasJsonText(productValues)).toBe(false);

    const variationValues = valuesOf(queries, "UPDATE product_variations");
    expect(variationValues).toContainEqual(FINISH_DETAILS);
    expect(hasJsonText(variationValues)).toBe(false);
  });

  it("edição sem specifications não altera a coluna", async () => {
    const { db, queries } = createFakeDb();
    await new ProductsRepository(db).updateProduct(GENERIC_ROW.product_id, {
      name: "Novo nome",
    });

    // `hasSpecifications` falso e o valor nulo: o CASE mantém o que está gravado.
    const productValues = valuesOf(queries, "UPDATE products");
    expect(hasJsonText(productValues)).toBe(false);
    expect(productValues).not.toContainEqual(SPECIFICATIONS);
  });
});
