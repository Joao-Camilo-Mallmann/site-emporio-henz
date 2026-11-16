import { sql } from "@/config/database";
import { ClientLookup } from "@/modules/atendimento/atendimento.types";

export class AtendimentoRepository {
  // Acha o cliente pelo e-mail da conta, ignorando maiúsculas e contas excluídas
  async findClientByEmail(email: string): Promise<ClientLookup | null> {
    const rows = await sql<{ id: string; full_name: string; email: string }[]>`
      SELECT c.id, c.full_name, u.email
      FROM clients c
      JOIN users u ON u.id = c.user_id
      WHERE LOWER(u.email) = LOWER(${email})
        AND c.deleted_at IS NULL
        AND u.deleted_at IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return {
      clientId: rows[0].id,
      fullName: rows[0].full_name,
      email: rows[0].email,
    };
  }
}

export const atendimentoRepository = new AtendimentoRepository();
export default atendimentoRepository;
