import { ListWithItemsDto } from "@/modules/lists/lists.types";

// Só o necessário para o atendente identificar o cliente (sem telefone, sem ids)
export interface AtendimentoClientDto {
  fullName: string;
  email: string;
}

export interface AtendimentoResultDto {
  client: AtendimentoClientDto;
  lists: ListWithItemsDto[];
}

export interface ClientLookup {
  clientId: string;
  fullName: string;
  email: string;
}
