import { AtendimentoRepository } from "@/modules/atendimento/atendimento.repository";
import { ClientLookup } from "@/modules/atendimento/atendimento.types";

export class FakeAtendimentoRepository extends AtendimentoRepository {
  private clients: ClientLookup[] = [];

  addClient(clientId: string, fullName: string, email: string): void {
    this.clients.push({ clientId, fullName, email });
  }

  async findClientByEmail(email: string): Promise<ClientLookup | null> {
    const found = this.clients.find(
      (c) => c.email.toLowerCase() === email.toLowerCase(),
    );
    return found ?? null;
  }
}
