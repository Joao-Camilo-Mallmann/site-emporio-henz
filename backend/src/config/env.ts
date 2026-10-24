import path from "node:path";

export interface AppEnv {
  PORT: number;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
  CORS_ORIGIN: string;
  UPLOADS_DIR: string;
}

export type EnvSource = Record<string, string | undefined>;

// Monta a configuração a partir de um conjunto de variáveis. Os testes passam o
// próprio conjunto para conferir padrões e sobrescritas sem mexer em process.env.
export function loadEnv(source: EnvSource = process.env): AppEnv {
  // Sem valor padrão: um segredo fixo no código é público e permite forjar tokens.
  if (!source.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET não definido. Configure-o no .env (ex.: openssl rand -hex 32).",
    );
  }

  return {
    PORT: Number(source.PORT) || 3001,
    NODE_ENV: source.NODE_ENV || "development",
    JWT_SECRET: source.JWT_SECRET,
    JWT_EXPIRES_IN_SECONDS: 60 * 60 * 336, // 336 horas
    CORS_ORIGIN: "*",
    // Diretório das fotos de produto e amostras de variação (RNF02). Em produção
    // é o volume Docker `uploads_data`, montado em /app/uploads; o padrão
    // `<cwd>/uploads` cai exatamente nele porque o WORKDIR do container é /app.
    UPLOADS_DIR: path.resolve(
      source.UPLOADS_DIR || path.join(process.cwd(), "uploads"),
    ),
  };
}

export const env: AppEnv = loadEnv();

export default env;
