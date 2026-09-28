import { handleRequest } from "@/app";
import { testDatabaseConnection } from "@/config/database";
import { env } from "@/config/env";

export async function createServer() {
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log("✅ Conexão com PostgreSQL estabelecida com sucesso.");
  } else {
    console.warn("⚠️ Não foi possível verificar o PostgreSQL no momento.");
  }

  const server = Bun.serve({
    port: env.PORT,
    fetch(req) {
      return handleRequest(req);
    },
  });

  console.log(
    `🚀 Servidor Empório Henz rodando em http://localhost:${server.port}`,
  );
  return server;
}

export default createServer;
