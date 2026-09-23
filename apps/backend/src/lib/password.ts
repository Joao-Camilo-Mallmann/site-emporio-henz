export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, "argon2id");
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await Bun.password.verify(password, hash);
  } catch (error) {
    console.error("Erro na verificação de hash com Argon2id:", error);
    return false;
  }
}
