import { env } from "@/config/env";

function isSecureRequest(req: Request): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  return (
    forwardedProto?.trim().toLowerCase() === "https" ||
    new URL(req.url).protocol === "https:"
  );
}

function serializeTokenCookie(
  value: string,
  maxAge: number,
  req: Request,
): string {
  const secure = isSecureRequest(req) ? "; Secure" : "";
  return `token=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export function createTokenCookie(token: string, req: Request): string {
  return serializeTokenCookie(token, env.JWT_EXPIRES_IN_SECONDS, req);
}

export function clearTokenCookie(req: Request): string {
  return serializeTokenCookie("", 0, req);
}

export function getTokenFromCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex < 0 || cookie.slice(0, separatorIndex).trim() !== "token") {
      continue;
    }

    const token = cookie.slice(separatorIndex + 1).trim();
    return token || null;
  }

  return null;
}
