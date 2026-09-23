import type {
  LoginCredentials,
  RegisterInput,
  UserProfile,
  AuthResponse,
} from "@/types";

const DELAY_MS = 350;
const USERS_STORAGE_KEY = "emporio_mock_registered_users";

const defaultMockUsers: Array<UserProfile & { passwordHash: string }> = [
  {
    id: "usr-admin-01",
    name: "João Henz",
    email: "admin@emporiohenz.com.br",
    role: 3,
    roleName: "admin",
    phone: "(51) 99876-5432",
    createdAt: new Date().toISOString(),
    passwordHash: "admin123",
  },
  {
    id: "usr-seller-01",
    name: "Carlos Mendes",
    email: "vendedor@emporiohenz.com.br",
    role: 2,
    roleName: "vendedor",
    phone: "(51) 98765-4321",
    createdAt: new Date().toISOString(),
    passwordHash: "12345678",
  },
  {
    id: "usr-client-01",
    name: "Maria Silveira",
    email: "cliente@emporiohenz.com.br",
    role: 1,
    roleName: "cliente",
    phone: "(51) 99123-4567",
    createdAt: new Date().toISOString(),
    passwordHash: "12345678",
  },
];

function getStoredUsers(): Array<UserProfile & { passwordHash: string }> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return defaultMockUsers;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? [...defaultMockUsers, ...parsed]
      : defaultMockUsers;
  } catch {
    return defaultMockUsers;
  }
}

function saveRegisteredUser(
  user: UserProfile & { passwordHash: string },
): void {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(user);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Falha silenciosa em ambientes sem localStorage
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockToken(user: UserProfile): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 dias
  };
  return `mock.${btoa(JSON.stringify(payload))}.sig`;
}

export class MockHttpError extends Error {
  response: { status: number; data: { message: string } };

  constructor(status: number, message: string) {
    super(message);
    this.name = "MockHttpError";
    this.response = { status, data: { message } };
  }
}

function sanitizeUser(u: UserProfile & { passwordHash: string }): UserProfile {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleName: u.roleName,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  };
}

export async function mockLogin(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  await delay(DELAY_MS);

  const users = getStoredUsers();
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const found = users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail &&
      u.passwordHash === credentials.password,
  );

  if (!found) {
    throw new MockHttpError(401, "E-mail ou senha incorretos.");
  }

  const profile = sanitizeUser(found);
  const token = generateMockToken(profile);

  return {
    user: profile,
    token,
  };
}

export async function mockRegister(
  input: RegisterInput,
): Promise<AuthResponse> {
  await delay(DELAY_MS);

  const users = getStoredUsers();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new MockHttpError(400, "Este e-mail já está cadastrado.");
  }

  const newProfile: UserProfile & { passwordHash: string } = {
    id: `usr-${Date.now()}`,
    name: input.name.trim(),
    email: normalizedEmail,
    role: 1, // Sempre Cliente no autocadastro
    roleName: "cliente",
    phone: input.phone.trim(),
    createdAt: new Date().toISOString(),
    passwordHash: input.password,
  };

  saveRegisteredUser(newProfile);

  const user = sanitizeUser(newProfile);
  const token = generateMockToken(user);

  return {
    user,
    token,
  };
}

export async function mockMe(token: string): Promise<UserProfile> {
  await delay(DELAY_MS);

  if (!token || !token.startsWith("mock.")) {
    throw new MockHttpError(401, "Token de autenticação inválido.");
  }

  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1]));
    const users = getStoredUsers();
    const found = users.find((u) => u.id === payload.sub);

    if (!found) {
      throw new MockHttpError(401, "Sessão expirada.");
    }

    return sanitizeUser(found);
  } catch (err: unknown) {
    if (err instanceof MockHttpError) {
      throw err;
    }
    throw new MockHttpError(401, "Sessão inválida.");
  }
}
