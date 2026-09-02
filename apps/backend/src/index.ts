const PORT = Number(process.env.PORT) || 3001;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
  fetch(req) {
    const url = new URL(req.url);

    // Tratamento de preflight CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    try {
      if (req.method === "GET" && url.pathname === "/") {
        return json({
          name: "emporio-henz-backend",
          version: "0.1.0",
          status: "online",
          endpoints: {
            health: "/health",
            apiHealth: "/api/health",
          },
        });
      }

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
