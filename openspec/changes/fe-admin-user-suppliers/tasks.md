## 1. Tipagem e Camada de API

- [x] 1.1 Declarar os tipos `IAssignedSupplier` e `PaginatedAssignedSuppliersResponse` em `frontend/src/types/`
- [x] 1.2 Implementar métodos `listarFornecedores`, `vincularFornecedor` e `desvincularFornecedor` em `frontend/src/api/usuarios.ts`

## 2. Componente Modal de Vínculos

- [x] 2.1 Criar o componente `VendedorFornecedoresModal.vue` com listagem de fornecedores ativos, barra de filtro/busca e checkboxes
- [x] 2.2 Implementar cálculo de diff e sincronização em lote (`Promise.all`) com tratamento de erros e notificações toast no salvamento

## 3. Integração com as Telas Administrativas

- [x] 3.1 Adicionar botão de ação rápida "Fornecedores Autorizados" na tabela de `UsuarioListView.vue` exclusivo para vendedores (`role = 2`)
- [x] 3.2 Adicionar seção de marcas autorizadas com chips informativos e acionamento do modal em `UsuarioEditView.vue`
- [x] 3.3 Garantir atualização reativa do estado em ambas as telas sem recarregamento da página (F5)

## 4. Validação e Rastreabilidade

- [x] 4.1 Executar `bun run check-types`, `bun run lint` e `bun run build` no diretório `frontend`
- [x] 4.2 Marcar os critérios de aceitação de `[US-FE-06]` como concluídos em `docs/planning/user-stories-backlog.md`

## 5. Ajustes do Code Review

- [x] 5.1 Corrigir toggle duplo ao clicar no nome (linha vira `<label>` com checkbox nativo, acessível por teclado)
- [x] 5.2 Carregar todas as páginas de fornecedores ativos e de vínculos (`usuariosApi.listarTodosFornecedores`)
- [x] 5.3 Exibir e permitir remover vínculos com fornecedores inativos (marcados como "inativo")
- [x] 5.4 Salvar com `Promise.allSettled`, notificar o pai em falha parcial e reportar quantas alterações falharam
- [x] 5.5 Guardar contra respostas obsoletas ao trocar de vendedor (token de carga e `watch` em `vendedor.id`)
- [x] 5.6 Exibir erro com "Tentar Novamente" ao falhar o carregamento das marcas em `UsuarioEditView.vue`, sem bloquear o formulário
- [x] 5.7 Remover API morta (`update:open`, payload de `saved`, `AssignSupplierInput`) e linhas em branco extras
