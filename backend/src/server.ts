import { handleRequest } from "@/app";
import { testDatabaseConnection } from "@/config/database";
import { env } from "@/config/env";

// Última barreira para qualquer rota, igual ao `client_max_body_size 10M` do
// nginx. O limite real de cada imagem (2 MiB) é conferido pela rota de upload.
export const MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024;

export async function createServer() {
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    console.log("✅ Conexão com PostgreSQL estabelecida com sucesso.");
  } else {
    console.warn("⚠️ Não foi possível verificar o PostgreSQL no momento.");
  }

  const server = Bun.serve({
    port: env.PORT,
    maxRequestBodySize: MAX_REQUEST_BODY_SIZE,
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
