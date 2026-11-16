import { api as axios } from "@/plugins/axios";
import type { AtendimentoResult } from "@/types";

export const atendimentoApi = {
  // Listas e itens salvos por um cliente, buscando pelo e-mail da conta
  async buscarCliente(email: string): Promise<AtendimentoResult> {
    const response = await axios.get<AtendimentoResult>(
      "/atendimento/cliente",
      { params: { email } },
    );
    return response.data;
  },
};

export default atendimentoApi;
