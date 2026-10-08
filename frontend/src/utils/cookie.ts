/**
 * Utilitário de gerenciamento seguro de cookies e validação de JWT no client-side.
 * Implementa validação com integridade, atributos de segurança (SameSite, Secure, Max-Age)
 * e verificação imediata de persistência em document.cookie.
 */

const TOKEN_COOKIE_NAME = "token";
export const DEFAULT_COOKIE_MAX_AGE = 14 * 24 * 60 * 60; // 14 dias em segundos (1.209.600s)

export interface CookieOptions {
  path?: string;
  maxAge?: number;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
}

/**
 * Decodifica o payload de um JWT no formato base64url de forma segura.
 * Retorna o objeto parsed do payload ou null caso a estrutura seja inválida.
 */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decoded = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(decoded);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Valida a sintaxe do JWT e verifica se o token não está expirado.
 * Suporta tolerância opcional de relógio (leeway) em segundos.
 */
export function isTokenValid(
  token: string,
  leewaySeconds: number = 0,
): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  if (typeof payload.exp === "number") {
    if (isNaN(payload.exp)) {
      return false;
    }
    const expirationMs = (payload.exp + leewaySeconds) * 1000;
    if (expirationMs <= Date.now()) {
      return false;
    }
  }

  return true;
}

/**
 * Verifica se um token está expirado.
 */
export function isTokenExpired(
  token: string,
  leewaySeconds: number = 0,
): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number" || isNaN(payload.exp)) {
    return true;
  }
  return (payload.exp + leewaySeconds) * 1000 <= Date.now();
}

/**
 * Obtém o valor de um cookie. Se nenhum nome for fornecido, busca o cookie de token de autenticação padrão.
 */
export function getCookie(name: string = TOKEN_COOKIE_NAME): string | null {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(prefix)) {
      const rawValue = cookie.substring(prefix.length);
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }

  return null;
}

/**
 * Grava um cookie no navegador e verifica imediatamente se a persistência foi bem-sucedida.
 * Retorna true se gravado e verificado com sucesso, ou false caso falhe (ex.: cookies desabilitados).
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const {
    path = "/",
    maxAge = DEFAULT_COOKIE_MAX_AGE,
    sameSite = "Lax",
    secure = typeof window !== "undefined" &&
      window.location?.protocol === "https:",
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookieString += `; Path=${path}`;

  if (typeof maxAge === "number") {
    cookieString += `; Max-Age=${maxAge}`;
  }

  if (sameSite) {
    cookieString += `; SameSite=${sameSite}`;
  }

  if (secure) {
    cookieString += "; Secure";
  }

  try {
    document.cookie = cookieString;
  } catch {
    return false;
  }

  // Verificação imediata de persistência em document.cookie
  const persisted = getCookie(name);
  return persisted === value;
}

/**
 * Remove um cookie expirando sua validade e removendo o valor.
 */
export function removeCookie(
  name: string = TOKEN_COOKIE_NAME,
  path: string = "/",
): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const isHttps =
    typeof window !== "undefined" && window.location?.protocol === "https:";
  let cookieString = `${encodeURIComponent(name)}=; Path=${path}; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  if (isHttps) {
    cookieString += "; Secure";
  }

  try {
    document.cookie = cookieString;
  } catch {
    return false;
  }

  return getCookie(name) === null;
}

/**
 * Lê o token de autenticação do cookie, validando sua sintaxe e expiração.
 * Se o token estiver corrompido ou expirado, o cookie é automaticamente purgado.
 */
export function getValidToken(name: string = TOKEN_COOKIE_NAME): string | null {
  const token = getCookie(name);
  if (!token) {
    return null;
  }

  if (!isTokenValid(token)) {
    removeCookie(name);
    return null;
  }

  return token;
}

/**
 * Grava o token de autenticação gerenciado internamente pelo utilitário.
 */
export function setAuthToken(token: string, options: CookieOptions = {}): boolean {
  return setCookie(TOKEN_COOKIE_NAME, token, options);
}

/**
 * Lê e valida o token de autenticação gerenciado internamente pelo utilitário.
 */
export function getAuthToken(): string | null {
  return getValidToken(TOKEN_COOKIE_NAME);
}

/**
 * Remove o token de autenticação gerenciado internamente pelo utilitário.
 */
export function removeAuthToken(path: string = "/"): boolean {
  return removeCookie(TOKEN_COOKIE_NAME, path);
}

/**
 * Verifica se existe um token de autenticação válido gravado.
 */
export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}
