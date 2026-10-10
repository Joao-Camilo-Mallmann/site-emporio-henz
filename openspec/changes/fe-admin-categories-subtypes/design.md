## Context

O backend do Empório Henz possui módulos completos para Categorias (`backend/src/modules/categories/`) e Subtipos (`backend/src/modules/subtypes/`), expostos através dos prefixos `/api/v1/categorias` e `/api/v1/subtipos`. Ambos seguem o padrão RNF11 com retorno paginado no envelope `{ data, pagination }`.
No frontend, o painel administrativo (`/admin`) atualmente possui apenas os módulos de Fornecedores e Usuários. É necessário introduzir a gestão completa de Categorias e Subtipos no frontend mantendo o padrão visual do Design System e os padrões de roteamento e autenticação.

## Goals / Non-Goals

**Goals:**
- Criar a camada de tipos em `frontend/src/types/categories.ts`.
- Criar o cliente de API em `frontend/src/api/categorias.ts` consumindo `/categorias` e `/subtipos`.
- Adicionar o card "Categorias & Subtipos" em `AdminDashboardView.vue`.
- Registrar a rota protegida `/admin/categorias` em `frontend/src/router/index.ts`.
- Implementar `CategoriaListView.vue` com listagem paginada no servidor, busca textual, badges de status, modal de criação/edição e gestão de subtipos vinculados.

**Non-Goals:**
- Alterações em migrações SQL ou controladores de backend (já implementados e testados).
- Alterar os menus públicos ou filtros do catálogo de clientes nesta mudança.

## Decisions

### 1. Gestão Integrada de Subtipos na Mesma Visão
- **Decisão:** Em vez de criar rotas e telas totalmente separadas para subtipos, `CategoriaListView.vue` permite gerenciar os subtipos diretamente no contexto de cada categoria (por modal ou painel de detalhes expansível).
- **Justificativa:** Categorias e subtipos possuem uma relação hierárquica direta 1:N no mostruário (ex.: Categoria "Quarto" -> Subtipos "Camas", "Guarda-Roupas"). Gerenciá-los juntos reduz cliques e simplifica a navegação do administrador.

### 2. Modais Rápidos de Criação e Edição
- **Decisão:** Utilizar `UiModal` para criar e editar categorias e subtipos em vez de páginas avulsas `/novo` e `/:id/editar`, mantendo agilidade para formulários que possuem poucos campos (Nome, Slug opcional, Status).
- **Justificativa:** Menor complexidade de navegação e feedback visual instantâneo.

### 3. Padrão de Paginação RNF11
- **Decisão:** Seguir exatamente o mesmo modelo de paginação de `UsuarioListView.vue` e `FornecedorListView.vue` (`pageSize = 10`, botões Anterior/Próxima e indicador de página/registros).

## Risks / Trade-offs

- **[Slug automático vs manual]** → O backend gera ou valida slugs. No frontend, se o slug não for preenchido, o backend deriva automaticamente a partir do nome. A interface deve permitir informar um slug customizado ou deixar automático.
