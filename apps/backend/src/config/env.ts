export interface AppEnv {
  PORT: number;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
  CORS_ORIGIN: string;
}

export const env: AppEnv = {
  PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "emporio-henz-default-jwt-secret-at-least-32-chars-long",
  JWT_EXPIRES_IN_SECONDS: 60 * 60 * 336, // 336 horas
  CORS_ORIGIN: "*",
};

export default env;
