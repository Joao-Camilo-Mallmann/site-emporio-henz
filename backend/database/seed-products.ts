/**
 * Produtos de exemplo do seed de desenvolvimento, chamado por `seed.ts` depois
 * do administrador e das categorias/subtipos.
 *
 * Passa pelas mesmas validações e services da API (slug, catálogo e
 * processamento de imagem), sem precisar da API no ar:
 *
 * - Garante os fornecedores de exemplo.
 * - Cadastra 3 produtos por categoria. Slug já existente é ignorado, então o
 *   seed pode rodar várias vezes.
 * - Envia a foto de `mock-images/<slug>.jpg` para os produtos que ainda não
 *   têm foto.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { sql } from "@/config/database";
import { AuthenticatedUser } from "@/lib/router";
import { slugify } from "@/lib/slug";
import { ROLES } from "@/middlewares/role";
import { productImagesService } from "@/modules/product-images/product-images.service";
import { validateCreateProduct } from "@/modules/products/products.schema";
import { productsService } from "@/modules/products/products.service";
import { validateCreateSupplier } from "@/modules/suppliers/suppliers.schema";
import { suppliersService } from "@/modules/suppliers/suppliers.service";

const MOCK_IMAGES_DIR = join(import.meta.dir, "mock-images");

type VariationType = "COLOR" | "FABRIC" | "WOOD" | "FINISH";

interface MockVariation {
  name: string;
  variationType: VariationType;
  colorsHex: string[];
  finishDetails?: Record<string, string>;
  inStock?: boolean;
}

interface MockProduct {
  category: string;
  subtype: string;
  supplier: string;
  name: string;
  collectionLine: string;
  mainMaterial: string;
  referencePrice: number;
  maxInstallments: number;
  availabilityType: "IN_STOCK" | "ON_DEMAND";
  estimatedDays: number;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  description: string;
  specifications: Record<string, string | number | boolean>;
  variations: MockVariation[];
}

const SUPPLIERS = [
  {
    name: "Móveis Serra Gaúcha Ltda",
    contact: "(54) 3452-8100 / comercial@serragaucha.ind.br",
  },
  {
    name: "Estofados Vale do Taquari",
    contact: "(51) 3714-2290 / vendas@estofadosvt.com.br",
  },
  {
    name: "Marcenaria Oeste Catarinense",
    contact: "(49) 3322-4075 / pedidos@marcenariaoeste.com.br",
  },
];

const [SERRA, ESTOFADOS, MARCENARIA] = SUPPLIERS.map((s) => s.name) as [
  string,
  string,
  string,
];

const PRODUCTS: MockProduct[] = [
  // Quarto
  {
    category: "quarto",
    subtype: "camas",
    supplier: SERRA,
    name: "Cama Box Queen Toscana",
    collectionLine: "Linha Toscana",
    mainMaterial: "MDF 18mm e pinus reflorestado",
    referencePrice: 2890,
    maxInstallments: 10,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 1150,
    widthMm: 1680,
    depthMm: 2120,
    description:
      "Cama queen com cabeceira estofada em linho e base em MDF, para colchão 158 x 198 cm. Pés em madeira maciça com sapatas niveladoras.",
    specifications: {
      colchao: "158 x 198 cm",
      cargaMaximaKg: 300,
      cabeceiraEstofada: true,
      montagemInclusa: true,
    },
    variations: [
      {
        name: "Linho Cru / Freijó",
        variationType: "FABRIC",
        colorsHex: ["#D8CFC0", "#8A6A47"],
        finishDetails: { cabeceira: "Linho Cru", estrutura: "Freijó" },
      },
      {
        name: "Linho Grafite / Nogueira",
        variationType: "FABRIC",
        colorsHex: ["#4A4A4A", "#5C4033"],
        finishDetails: { cabeceira: "Linho Grafite", estrutura: "Nogueira" },
      },
    ],
  },
  {
    category: "quarto",
    subtype: "roupeiros",
    supplier: SERRA,
    name: "Roupeiro Florença 6 Portas com Espelho",
    collectionLine: "Linha Florença",
    mainMaterial: "MDF 18mm",
    referencePrice: 4590,
    maxInstallments: 12,
    availabilityType: "ON_DEMAND",
    estimatedDays: 25,
    heightMm: 2300,
    widthMm: 2700,
    depthMm: 600,
    description:
      "Roupeiro de casal com 6 portas de giro, sendo 2 com espelho, 4 gavetas com corrediças telescópicas e cabideiro em alumínio.",
    specifications: {
      portas: 6,
      gavetas: 4,
      corredicas: "Telescópicas",
      dobradicas: "Com amortecimento",
      espelho: true,
    },
    variations: [
      {
        name: "Carvalho Mel / Off White",
        variationType: "WOOD",
        colorsHex: ["#B8860B", "#F5F5EC"],
        finishDetails: { corpo: "Carvalho Mel", portas: "Off White" },
      },
      {
        name: "Freijó / Grafite",
        variationType: "WOOD",
        colorsHex: ["#8A6A47", "#3C3C3C"],
        finishDetails: { corpo: "Freijó", portas: "Grafite" },
      },
    ],
  },
  {
    category: "quarto",
    subtype: "comodas",
    supplier: MARCENARIA,
    name: "Cômoda Lisboa 6 Gavetas",
    collectionLine: "Linha Lisboa",
    mainMaterial: "Madeira maciça de pinus e MDF",
    referencePrice: 1690,
    maxInstallments: 10,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 920,
    widthMm: 1200,
    depthMm: 450,
    description:
      "Cômoda com 6 gavetas amplas, puxadores em couro natural e pés palito em madeira maciça.",
    specifications: {
      gavetas: 6,
      puxadores: "Couro natural",
      pes: "Palito em madeira maciça",
    },
    variations: [
      {
        name: "Nature",
        variationType: "WOOD",
        colorsHex: ["#C19A6B"],
      },
      {
        name: "Branco Acetinado",
        variationType: "FINISH",
        colorsHex: ["#F4F4F2"],
      },
    ],
  },

  // Sala de Estar
  {
    category: "sala-de-estar",
    subtype: "sofas",
    supplier: ESTOFADOS,
    name: "Sofá Retrátil e Reclinável Veneza 3 Lugares",
    collectionLine: "Linha Veneza",
    mainMaterial: "Estrutura em eucalipto e espuma D33",
    referencePrice: 3990,
    maxInstallments: 12,
    availabilityType: "ON_DEMAND",
    estimatedDays: 30,
    heightMm: 1000,
    widthMm: 2300,
    depthMm: 1050,
    description:
      "Sofá de 3 lugares com assentos retráteis e encostos reclináveis em 3 posições. Espuma D33 com manta acrílica e molas ensacadas.",
    specifications: {
      lugares: 3,
      retratil: true,
      reclinavel: "3 posições",
      espuma: "D33",
      profundidadeAbertoMm: 1550,
    },
    variations: [
      {
        name: "Suede Cinza",
        variationType: "FABRIC",
        colorsHex: ["#8C8C8C"],
      },
      {
        name: "Linho Areia",
        variationType: "FABRIC",
        colorsHex: ["#CDBA96"],
      },
      {
        name: "Veludo Verde Musgo",
        variationType: "FABRIC",
        colorsHex: ["#4B5D3A"],
        inStock: false,
      },
    ],
  },
  {
    category: "sala-de-estar",
    subtype: "racks-e-paineis",
    supplier: SERRA,
    name: "Rack com Painel Bari para TV até 65\"",
    collectionLine: "Linha Bari",
    mainMaterial: "MDF 15mm e 18mm",
    referencePrice: 2190,
    maxInstallments: 10,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 1820,
    widthMm: 2200,
    depthMm: 420,
    description:
      "Conjunto de rack e painel suspenso para TVs de até 65 polegadas, com nicho para home theater, passa-fios e LED embutido.",
    specifications: {
      tvAte: "65 polegadas",
      portas: 2,
      ledEmbutido: true,
      passaFios: true,
    },
    variations: [
      {
        name: "Cinamomo / Off White",
        variationType: "WOOD",
        colorsHex: ["#A0522D", "#F5F5EC"],
        finishDetails: { estrutura: "Cinamomo", portas: "Off White" },
      },
      {
        name: "Nogueira / Preto Fosco",
        variationType: "WOOD",
        colorsHex: ["#5C4033", "#1E1E1E"],
        finishDetails: { estrutura: "Nogueira", portas: "Preto Fosco" },
      },
    ],
  },
  {
    category: "sala-de-estar",
    subtype: "poltronas",
    supplier: ESTOFADOS,
    name: "Poltrona Decorativa Ravena",
    collectionLine: "Linha Ravena",
    mainMaterial: "Estrutura em madeira maciça e espuma D28",
    referencePrice: 1290,
    maxInstallments: 8,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 850,
    widthMm: 760,
    depthMm: 780,
    description:
      "Poltrona de braço curvo com pés em madeira maciça torneada, ideal para cantos de leitura.",
    specifications: {
      espuma: "D28",
      pes: "Madeira maciça torneada",
      cargaMaximaKg: 120,
    },
    variations: [
      {
        name: "Bouclé Off White",
        variationType: "FABRIC",
        colorsHex: ["#EFEBE3"],
      },
      {
        name: "Veludo Terracota",
        variationType: "FABRIC",
        colorsHex: ["#B5543C"],
      },
    ],
  },

  // Sala de Jantar
  {
    category: "sala-de-jantar",
    subtype: "mesas-de-jantar",
    supplier: MARCENARIA,
    name: "Mesa de Jantar Verona 6 Lugares",
    collectionLine: "Linha Verona",
    mainMaterial: "Tampo em MDF laqueado e base em madeira maciça",
    referencePrice: 3290,
    maxInstallments: 12,
    availabilityType: "ON_DEMAND",
    estimatedDays: 20,
    heightMm: 780,
    widthMm: 1800,
    depthMm: 900,
    description:
      "Mesa retangular para 6 lugares com tampo laqueado e vidro temperado 4mm, base cavalete em madeira maciça.",
    specifications: {
      lugares: 6,
      tampo: "MDF laqueado com vidro 4mm",
      formato: "Retangular",
    },
    variations: [
      {
        name: "Off White / Freijó",
        variationType: "FINISH",
        colorsHex: ["#F5F5EC", "#8A6A47"],
        finishDetails: { tampo: "Off White", base: "Freijó" },
      },
      {
        name: "Preto Fosco / Nogueira",
        variationType: "FINISH",
        colorsHex: ["#1E1E1E", "#5C4033"],
        finishDetails: { tampo: "Preto Fosco", base: "Nogueira" },
      },
    ],
  },
  {
    category: "sala-de-jantar",
    subtype: "cadeiras",
    supplier: ESTOFADOS,
    name: "Cadeira de Jantar Milano Estofada",
    collectionLine: "Linha Milano",
    mainMaterial: "Madeira maciça de eucalipto",
    referencePrice: 489,
    maxInstallments: 6,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 920,
    widthMm: 460,
    depthMm: 540,
    description:
      "Cadeira com assento e encosto estofados, estrutura em madeira maciça com acabamento em verniz PU. Vendida por unidade.",
    specifications: {
      alturaAssentoMm: 470,
      cargaMaximaKg: 110,
      vendidaPor: "Unidade",
    },
    variations: [
      {
        name: "Linho Bege / Imbuia",
        variationType: "FABRIC",
        colorsHex: ["#D9C9A8", "#4E3B2A"],
      },
      {
        name: "Linho Cinza / Natural",
        variationType: "FABRIC",
        colorsHex: ["#9E9E9E", "#C19A6B"],
      },
    ],
  },
  {
    category: "sala-de-jantar",
    subtype: "aparadores",
    supplier: MARCENARIA,
    name: "Aparador Buffet Siena 4 Portas",
    collectionLine: "Linha Siena",
    mainMaterial: "MDF 18mm com pés em madeira maciça",
    referencePrice: 1890,
    maxInstallments: 10,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 800,
    widthMm: 1600,
    depthMm: 400,
    description:
      "Aparador com 4 portas ripadas, prateleiras internas reguláveis e pés palito em madeira maciça.",
    specifications: {
      portas: 4,
      prateleirasRegulaveis: 2,
      frenteRipada: true,
    },
    variations: [
      {
        name: "Freijó",
        variationType: "WOOD",
        colorsHex: ["#8A6A47"],
      },
      {
        name: "Carvalho / Off White",
        variationType: "WOOD",
        colorsHex: ["#B8860B", "#F5F5EC"],
      },
    ],
  },

  // Cozinha
  {
    category: "cozinha",
    subtype: "armarios",
    supplier: SERRA,
    name: "Cozinha Modulada Gourmet Nápoles 5 Peças",
    collectionLine: "Linha Nápoles",
    mainMaterial: "MDP 15mm com frentes em MDF",
    referencePrice: 5490,
    maxInstallments: 12,
    availabilityType: "ON_DEMAND",
    estimatedDays: 30,
    heightMm: 2200,
    widthMm: 3000,
    depthMm: 600,
    description:
      "Cozinha modulada com aéreos, balcão para pia, torre quente para forno e micro-ondas e paneleiro. Não acompanha tampo nem cuba.",
    specifications: {
      pecas: 5,
      torreQuente: true,
      acompanhaTampo: false,
      dobradicas: "Com amortecimento",
    },
    variations: [
      {
        name: "Branco / Freijó",
        variationType: "FINISH",
        colorsHex: ["#FFFFFF", "#8A6A47"],
      },
      {
        name: "Grafite / Carvalho",
        variationType: "FINISH",
        colorsHex: ["#3C3C3C", "#B8860B"],
      },
    ],
  },
  {
    category: "cozinha",
    subtype: "balcoes",
    supplier: SERRA,
    name: "Balcão de Pia Nápoles 120 cm",
    collectionLine: "Linha Nápoles",
    mainMaterial: "MDP 15mm com frentes em MDF",
    referencePrice: 1190,
    maxInstallments: 10,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 850,
    widthMm: 1200,
    depthMm: 530,
    description:
      "Balcão para pia de 120 cm com 2 portas e 2 gavetas, rodapé em alumínio e espaço para tubulação.",
    specifications: {
      portas: 2,
      gavetas: 2,
      tampoIncluso: false,
    },
    variations: [
      {
        name: "Branco",
        variationType: "COLOR",
        colorsHex: ["#FFFFFF"],
      },
      {
        name: "Grafite",
        variationType: "COLOR",
        colorsHex: ["#3C3C3C"],
      },
    ],
  },
  {
    category: "cozinha",
    subtype: "banquetas",
    supplier: MARCENARIA,
    name: "Banqueta Alta Oslo com Encosto",
    collectionLine: "Linha Oslo",
    mainMaterial: "Madeira maciça de tauari",
    referencePrice: 549,
    maxInstallments: 6,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 1000,
    widthMm: 430,
    depthMm: 450,
    description:
      "Banqueta para bancada e ilha gourmet, com apoio para os pés e assento em madeira anatômica. Vendida por unidade.",
    specifications: {
      alturaAssentoMm: 750,
      apoioParaPes: true,
      vendidaPor: "Unidade",
    },
    variations: [
      {
        name: "Natural",
        variationType: "WOOD",
        colorsHex: ["#C19A6B"],
      },
      {
        name: "Preto",
        variationType: "COLOR",
        colorsHex: ["#1E1E1E"],
      },
    ],
  },

  // Escritório
  {
    category: "escritorio",
    subtype: "mesas-de-escritorio",
    supplier: MARCENARIA,
    name: "Escrivaninha Home Office Turim 136 cm",
    collectionLine: "Linha Turim",
    mainMaterial: "MDF 18mm e aço carbono",
    referencePrice: 1090,
    maxInstallments: 10,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 750,
    widthMm: 1360,
    depthMm: 600,
    description:
      "Escrivaninha com tampo em MDF, estrutura em aço com pintura epóxi, gaveta com chave e calha passa-cabos.",
    specifications: {
      gavetas: 1,
      fechadura: true,
      passaCabos: true,
      estrutura: "Aço com pintura epóxi",
    },
    variations: [
      {
        name: "Carvalho / Preto",
        variationType: "FINISH",
        colorsHex: ["#B8860B", "#1E1E1E"],
      },
      {
        name: "Off White / Branco",
        variationType: "FINISH",
        colorsHex: ["#F5F5EC", "#FFFFFF"],
      },
    ],
  },
  {
    category: "escritorio",
    subtype: "cadeiras-presidente",
    supplier: ESTOFADOS,
    name: "Cadeira Presidente Ergonômica Lumbar Pro",
    collectionLine: "Linha Corporativa",
    mainMaterial: "Espuma injetada e base em nylon",
    referencePrice: 1390,
    maxInstallments: 10,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 1250,
    widthMm: 680,
    depthMm: 680,
    description:
      "Cadeira presidente com apoio lombar regulável, braços 3D, mecanismo relax com trava e pistão classe 4.",
    specifications: {
      pistao: "Classe 4",
      bracos: "Reguláveis 3D",
      cargaMaximaKg: 130,
      rodizios: "Silicone",
    },
    variations: [
      {
        name: "Couro Sintético Preto",
        variationType: "FABRIC",
        colorsHex: ["#1E1E1E"],
      },
      {
        name: "Tela Mesh Cinza",
        variationType: "FABRIC",
        colorsHex: ["#7A7A7A"],
      },
    ],
  },
  {
    category: "escritorio",
    subtype: "estantes-de-livros",
    supplier: SERRA,
    name: "Estante Livreiro Pádua 5 Prateleiras",
    collectionLine: "Linha Pádua",
    mainMaterial: "MDF 18mm",
    referencePrice: 990,
    maxInstallments: 8,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 1850,
    widthMm: 900,
    depthMm: 320,
    description:
      "Estante com 5 prateleiras fixas que suportam até 25 kg cada, fundo inteiriço e fixação na parede inclusa.",
    specifications: {
      prateleiras: 5,
      cargaPorPrateleiraKg: 25,
      fixacaoParede: true,
    },
    variations: [
      {
        name: "Freijó",
        variationType: "WOOD",
        colorsHex: ["#8A6A47"],
      },
      {
        name: "Branco",
        variationType: "COLOR",
        colorsHex: ["#FFFFFF"],
      },
    ],
  },

  // Banheiro
  {
    category: "banheiro",
    subtype: "gabinetes",
    supplier: SERRA,
    name: "Gabinete para Banheiro Capri 80 cm com Cuba",
    collectionLine: "Linha Capri",
    mainMaterial: "MDF 15mm resistente à umidade",
    referencePrice: 1290,
    maxInstallments: 10,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 620,
    widthMm: 800,
    depthMm: 460,
    description:
      "Gabinete suspenso de 80 cm em MDF RU com 2 gavetas e cuba de semi-encaixe em louça branca.",
    specifications: {
      gavetas: 2,
      cubaInclusa: true,
      instalacao: "Suspensa",
      mdfResistenteUmidade: true,
    },
    variations: [
      {
        name: "Branco Brilho",
        variationType: "FINISH",
        colorsHex: ["#FFFFFF"],
      },
      {
        name: "Carvalho Malva",
        variationType: "WOOD",
        colorsHex: ["#A67B5B"],
      },
    ],
  },
  {
    category: "banheiro",
    subtype: "espelheiras",
    supplier: SERRA,
    name: "Espelheira Capri 80 cm com LED",
    collectionLine: "Linha Capri",
    mainMaterial: "MDF 15mm resistente à umidade e espelho 4mm",
    referencePrice: 790,
    maxInstallments: 8,
    availabilityType: "IN_STOCK",
    estimatedDays: 0,
    heightMm: 700,
    widthMm: 800,
    depthMm: 140,
    description:
      "Espelheira com 2 portas espelhadas, prateleira interna e fita de LED na parte inferior. Combina com o gabinete Capri.",
    specifications: {
      portas: 2,
      led: true,
      voltagem: "Bivolt",
    },
    variations: [
      {
        name: "Branco Brilho",
        variationType: "FINISH",
        colorsHex: ["#FFFFFF"],
      },
      {
        name: "Carvalho Malva",
        variationType: "WOOD",
        colorsHex: ["#A67B5B"],
      },
    ],
  },
  {
    category: "banheiro",
    subtype: "armarios-aereos",
    supplier: MARCENARIA,
    name: "Armário Aéreo Multiuso Ibiza 60 cm",
    collectionLine: "Linha Ibiza",
    mainMaterial: "MDF 15mm resistente à umidade",
    referencePrice: 459,
    maxInstallments: 6,
    availabilityType: "ON_DEMAND",
    estimatedDays: 15,
    heightMm: 600,
    widthMm: 600,
    depthMm: 250,
    description:
      "Armário aéreo para banheiro ou lavanderia, com 2 portas ripadas e prateleira interna regulável.",
    specifications: {
      portas: 2,
      prateleiraRegulavel: true,
      frenteRipada: true,
    },
    variations: [
      {
        name: "Off White",
        variationType: "COLOR",
        colorsHex: ["#F5F5EC"],
      },
      {
        name: "Freijó",
        variationType: "WOOD",
        colorsHex: ["#8A6A47"],
      },
    ],
  },
];

async function findAdmin(email: string): Promise<AuthenticatedUser> {
  const rows = await sql<{ id: string; email: string }[]>`
    SELECT id, email FROM users
    WHERE email = ${email} AND role = ${ROLES.ADMIN} AND deleted_at IS NULL
    LIMIT 1;
  `;
  const admin = rows[0];
  if (!admin) {
    throw new Error(`Administrador ${email} não encontrado para o seed.`);
  }
  return { id: admin.id, email: admin.email, role: ROLES.ADMIN };
}

// Chave "categoria" ou "categoria/subtipo" -> id, só registros não deletados.
async function loadCatalogIds(): Promise<Map<string, string>> {
  const rows = await sql<
    {
      categorySlug: string;
      categoryId: string;
      subtypeSlug: string | null;
      subtypeId: string | null;
    }[]
  >`
    SELECT c.slug AS "categorySlug", c.id AS "categoryId",
           s.slug AS "subtypeSlug", s.id AS "subtypeId"
    FROM categories c
    LEFT JOIN product_subtypes s
      ON s.category_id = c.id AND s.deleted_at IS NULL
    WHERE c.deleted_at IS NULL;
  `;
  const ids = new Map<string, string>();
  for (const r of rows) {
    ids.set(r.categorySlug, r.categoryId);
    if (r.subtypeSlug && r.subtypeId) {
      ids.set(`${r.categorySlug}/${r.subtypeSlug}`, r.subtypeId);
    }
  }
  return ids;
}

async function ensureSuppliers(): Promise<Map<string, string>> {
  const existing = await sql<{ id: string; name: string }[]>`
    SELECT id, name FROM suppliers WHERE deleted_at IS NULL;
  `;
  const byName = new Map(existing.map((s) => [s.name, s.id]));

  for (const supplier of SUPPLIERS) {
    if (byName.has(supplier.name)) continue;
    const { error, value } = validateCreateSupplier({
      ...supplier,
      active: true,
    });
    if (error || !value) {
      throw new Error(`Fornecedor ${supplier.name} inválido: ${error}`);
    }
    const created = await suppliersService.create(value);
    byName.set(supplier.name, created.id);
    console.log(`+ Fornecedor inserido: ${supplier.name}`);
  }
  return byName;
}

async function findProductBySlug(
  slug: string,
): Promise<{ id: string; hasImage: boolean } | null> {
  const rows = await sql<{ id: string; hasImage: boolean }[]>`
    SELECT p.id,
           EXISTS (
             SELECT 1 FROM product_images pi
             WHERE pi.product_id = p.id AND pi.deleted_at IS NULL
           ) AS "hasImage"
    FROM products p
    WHERE p.slug = ${slug} AND p.deleted_at IS NULL
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

async function createProducts(
  admin: AuthenticatedUser,
  catalog: Map<string, string>,
  suppliers: Map<string, string>,
) {
  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    if (await findProductBySlug(slugify(p.name))) {
      skipped++;
      continue;
    }

    const categoryId = catalog.get(p.category);
    if (!categoryId) throw new Error(`Categoria ${p.category} não encontrada.`);
    const subtypeId = catalog.get(`${p.category}/${p.subtype}`);
    if (!subtypeId) throw new Error(`Subtipo ${p.subtype} não encontrado.`);
    const supplierId = suppliers.get(p.supplier);
    if (!supplierId) throw new Error(`Fornecedor ${p.supplier} não encontrado.`);

    const { error, value } = validateCreateProduct({
      name: p.name,
      collectionLine: p.collectionLine,
      mainMaterial: p.mainMaterial,
      referencePrice: p.referencePrice,
      maxInstallments: p.maxInstallments,
      availabilityType: p.availabilityType,
      estimatedDays: p.estimatedDays,
      heightMm: p.heightMm,
      widthMm: p.widthMm,
      depthMm: p.depthMm,
      description: p.description,
      specifications: p.specifications,
      categoryId,
      subtypeId,
      supplierId,
      active: true,
      variations: p.variations.map((v, i) => ({
        ...v,
        finishDetails: v.finishDetails ?? {},
        sortOrder: i,
        inStock: v.inStock ?? true,
      })),
    });
    if (error || !value) {
      throw new Error(`Produto ${p.name} inválido: ${error}`);
    }

    await productsService.createProduct(value, admin);
    created++;
    console.log(`+ Produto inserido: ${p.name}`);
  }

  console.log(
    `✓ Produtos: ${created} criados, ${skipped} já existiam (${PRODUCTS.length} no total).`,
  );
}

// O service de fotos lê um multipart com Content-Length, como na rota da API.
async function buildUploadRequest(path: string): Promise<Request> {
  const form = new FormData();
  form.append("file", Bun.file(path));
  const encoded = new Request("http://seed.local/upload", {
    method: "POST",
    body: form,
  });
  const contentType = encoded.headers.get("content-type");
  const body = await encoded.arrayBuffer();
  if (!contentType) throw new Error(`Multipart sem content-type: ${path}`);
  return new Request(encoded.url, {
    method: "POST",
    headers: {
      "content-type": contentType,
      "content-length": String(body.byteLength),
    },
    body,
  });
}

async function uploadImages(admin: AuthenticatedUser) {
  let uploaded = 0;
  let missing = 0;

  for (const mock of PRODUCTS) {
    const slug = slugify(mock.name);
    const product = await findProductBySlug(slug);
    if (!product || product.hasImage) continue;

    const path = join(MOCK_IMAGES_DIR, `${slug}.jpg`);
    if (!existsSync(path)) {
      missing++;
      console.log(`! Sem foto em mock-images/: ${slug}`);
      continue;
    }

    await productImagesService.uploadProductImage(
      product.id,
      admin,
      await buildUploadRequest(path),
    );
    uploaded++;
    console.log(`+ Foto enviada: ${mock.name}`);
  }

  console.log(`✓ Fotos: ${uploaded} enviadas, ${missing} sem arquivo.`);
}

export async function seedProducts(adminEmail: string) {
  console.log("🌱 Executando seeder de Produtos de exemplo...");
  try {
    const admin = await findAdmin(adminEmail);
    const catalog = await loadCatalogIds();
    const suppliers = await ensureSuppliers();
    await createProducts(admin, catalog, suppliers);
    await uploadImages(admin);
    console.log("✓ Seeder de produtos de exemplo concluído com sucesso.");
  } catch (error) {
    console.error("✗ Falha ao executar o seeder de produtos de exemplo:", error);
    throw error;
  }
}
