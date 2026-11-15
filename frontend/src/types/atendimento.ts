import type { ApiList } from "./listas";

// Contrato de `GET /api/v1/atendimento/cliente?email=...` (vendedor e administrador)
export interface AtendimentoClient {
  fullName: string;
  email: string;
}

export interface AtendimentoResult {
  client: AtendimentoClient;
  lists: ApiList[];
}
