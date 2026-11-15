const MAX_EMAIL_LENGTH = 255;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normaliza (apara e deixa minúsculo) e confere o formato do e-mail buscado
export function validateEmailQuery(raw: string | null): {
  error?: string;
  value?: string;
} {
  const email = (raw ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Informe o e-mail do cliente (parâmetro email)." };
  }
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return { error: "Informe um e-mail válido." };
  }

  return { value: email };
}
