const PORT = Number(process.env.PORT) || 3001;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ProductItem {
  id: string;
  name: string;
  description: string;
  category: string;
  material: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: "cm" | "mm";
  };
  price?: number;
  isAvailable: boolean;
  images: string[];
}

const mockProdutos: ProductItem[] = [
  {
    id: "prod-1",
    name: "Mesa de Jantar Orgânica Carvalho",
    description:
      "Mesa de jantar contemporânea com tampo em carvalho maciço e bordas orgânicas chanfradas.",
    category: "Mesas",
    material: "Madeira Maciça Carvalho",
    dimensions: { width: 220, height: 76, depth: 110, unit: "cm" },
    price: 8950,
    isAvailable: true,
    images: [],
  },
  {
    id: "prod-2",
    name: "Poltrona Lina Couro Natural",
    description:
      "Poltrona de alto conforto com estrutura em tauari e estofamento em couro natural conhaque.",
    category: "Poltronas",
    material: "Tauari e Couro Natural",
    dimensions: { width: 85, height: 82, depth: 88, unit: "cm" },
    price: 4320,
    isAvailable: true,
    images: [],
  },
  {
    id: "prod-3",
    name: "Aparador Minimalista Freijó",
    description:
      "Aparador com portas ripadas e puxadores embutidos, acabamento fosco suave ao toque.",
    category: "Aparadores",
    material: "Lâmina Natural de Freijó",
    dimensions: { width: 180, height: 80, depth: 45, unit: "cm" },
    price: 5600,
    isAvailable: false,
    images: [],
  },
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Tratamento de preflight CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    try {
      // Home / Status
      if (req.method === "GET" && url.pathname === "/") {
        return json({
          name: "emporio-henz-backend",
          version: "0.1.0",
          status: "online",
          endpoints: {
            health: "/health",
            produtos: "/api/produtos",
          },
        });
      }

      // Healthcheck
      if (
        req.method === "GET" &&
        (url.pathname === "/health" || url.pathname === "/api/health")
      ) {
        return json({
          status: "ok",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        });
      }

      // Listar Produtos
      if (req.method === "GET" && url.pathname === "/api/produtos") {
        const category = url.searchParams.get("category");
        const search = url.searchParams.get("search")?.toLowerCase();

        let resultado = mockProdutos;
        if (category) {
          resultado = resultado.filter((p) => p.category === category);
        }
        if (search) {
          resultado = resultado.filter(
            (p) =>
              p.name.toLowerCase().includes(search) ||
              p.description.toLowerCase().includes(search),
          );
        }
        return json(resultado);
      }

      // Buscar Produto por ID
      if (req.method === "GET" && url.pathname.startsWith("/api/produtos/")) {
        const id = url.pathname.replace("/api/produtos/", "");
        const produto = mockProdutos.find((p) => p.id === id);
        if (!produto) {
          return json({ error: "Produto não encontrado" }, 404);
        }
        return json(produto);
      }

      // Criar Produto
      if (req.method === "POST" && url.pathname === "/api/produtos") {
        const body = (await req.json()) as Partial<ProductItem>;
        const novoProduto: ProductItem = {
          id: `prod-${Date.now()}`,
          name: body.name || "Novo Produto",
          description: body.description || "",
          category: body.category || "Geral",
          material: body.material || "Madeira",
          dimensions: body.dimensions,
          price: body.price,
          isAvailable: body.isAvailable ?? true,
          images: body.images || [],
        };
        mockProdutos.push(novoProduto);
        return json(novoProduto, 201);
      }

      // Atualizar Produto
      if (req.method === "PUT" && url.pathname.startsWith("/api/produtos/")) {
        const id = url.pathname.replace("/api/produtos/", "");
        const index = mockProdutos.findIndex((p) => p.id === id);
        if (index === -1) {
          return json({ error: "Produto não encontrado" }, 404);
        }
        const body = (await req.json()) as Partial<ProductItem>;
        mockProdutos[index] = {
          ...mockProdutos[index]!,
          ...body,
          id, // preserva ID
        };
        return json(mockProdutos[index]);
      }

      // Deletar Produto
      if (
        req.method === "DELETE" &&
        url.pathname.startsWith("/api/produtos/")
      ) {
        const id = url.pathname.replace("/api/produtos/", "");
        const index = mockProdutos.findIndex((p) => p.id === id);
        if (index === -1) {
          return json({ error: "Produto não encontrado" }, 404);
        }
        mockProdutos.splice(index, 1);
        return json({
          success: true,
          message: `Produto '${id}' removido com sucesso.`,
        });
      }

      return json(
        {
          error: "Not Found",
          message: `Rota '${url.pathname}' com método '${req.method}' não encontrada.`,
        },
        404,
      );
    } catch (error) {
      console.error("Erro interno no servidor:", error);
      return json(
        {
          error: "Internal Server Error",
          message: "Ocorreu um erro interno ao processar a requisição.",
        },
        500,
      );
    }
  },
});

console.log(`🚀 Backend Bun rodando em http://localhost:${server.port}`);

export default server;
