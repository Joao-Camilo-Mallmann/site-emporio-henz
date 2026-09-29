# Roteiro Completo de Apresentação · Parcial 1
## Projeto: Empório Henz (Portal Web & E-commerce)
**Tempo total de apresentação:** 10 minutos cravados  
**Tempo de arguição do professor:** 5 minutos  
**Nota alvo:** 10,0 / 10,0  
**Estilo Visual:** Design System Oficial Empório Henz (Clean Branco `#FEFEFE`, Azul Institucional `#123854` e `#007CD8`, sem sombras pesadas, prints nítidos em destaque e assets oficiais da marca).

---

## 👥 Equipe do Projeto
- **João Camilo Mallmann**
- **Luiz Postal**
- **Cauã Primon**
- **Airton Costa Junior**

*Apresentação coletiva e colaborativa, demonstrando o domínio de ponta a ponta da solução técnica desenvolvida em conjunto.*

---

## ⏱️ Roteiro de Fala Slide a Slide (00:00 - 10:00)

### 📌 Minuto 00:00 - 00:30 | Slide 1: Capa Oficial & Visão Geral
- **O que falar:**
  > *"Boa noite professor e colegas! Nós somos a equipe responsável pela plataforma digital e e-commerce do **Empório Henz**, uma tradicional loja de móveis de alto padrão com mais de 50 anos de história no Vale do Taquari, que se reergueu após a enchente histórica.*  
  > *Nesta apresentação da **Parcial 1**, cumprimos com rigor 100% dos critérios do edital: autenticação completa e gestão de sessão stateless, 2 CRUDs persistentes no PostgreSQL 16 com Soft Delete, frontend funcional com fidelidade ao Figma no nosso Design System oficial, setup zero-configuração via Docker e governança estrita no GitHub."*

---

### 📌 Minuto 00:30 - 01:00 | Slide 2: Sumário da Apresentação · Roteiro da Parcial 1
- **O que falar:**
  > *"Para organizar nossa apresentação de 10 minutos, dividimos a entrega em cinco blocos objetivos:*  
  > *1. A **Vitrine Digital e Institucional**, demonstrando a fidelidade aos protótipos do Figma e a história de 50 anos;*  
  > *2. A **Autenticação e Sessão**, com login seguro Argon2id, tratamento HTTP 401 e autocadastro com Pinia;*  
  > *3. Os **Módulos Operacionais no PostgreSQL 16**, cobrindo os 2 CRUDs com Soft Delete (Usuários e Fornecedores);*  
  > *4. A **Metodologia e Governança no GitHub**, com Database First, Kanban e mais de 50 Pull Requests revisados;*  
  > *5. E o **Deploy Zero-Configuração**, com Docker Compose e a demonstração do sistema operando ao vivo."*

---

### 📌 Minuto 01:00 - 01:30 | Slide 3: Vitrine Digital (Critério 2.2 · Fidelidade ao Figma)
- **O que falar:**
  > *"Aqui vemos a nossa **Vitrine Digital**. Desenvolvemos a aplicação em **Vue 3 com Composition API** e **Tailwind CSS v4**, respeitando rigorosamente o protótipo do Figma e os tokens do nosso Design System oficial.*  
  > *A vitrine conta com Hero Banner em azul suave (`#D2E8F8`), tipografia requintada em Plus Jakarta Sans, busca inteligente e navegação completa por categorias de móveis (Quarto, Sala de Estar, Cozinha e Escritório)."*
- **Prints a destacar:** `01-home.png`.

---

### 📌 Minuto 01:30 - 02:00 | Slide 4: Página Institucional · Homenagem aos 50 Anos (Critério 2.2)
- **O que falar:**
  > *"Na página **Sobre a Loja**, traduzimos diretamente os requisitos levantados com o cliente: a trajetória de fundação familiar há 50 anos e o relato de resiliência e reconstrução pós-enchente histórica no Vale do Taquari.*  
  > *A página traz a história institucional, fotos do showroom e reforça a conexão da marca com a comunidade local."*
- **Prints a destacar:** `02-sobre-a-loja.png`.

---

### 📌 Minuto 02:00 - 02:40 | Slide 5: Autenticação Segura · Login & Feedback Visual de Erro (Critério 2.3)
- **O que falar:**
  > *"No fluxo de Autenticação e Sessão (peso 2,5 do edital):*  
  > *À esquerda, temos o formulário de login com validação reativa e botão para alternar visibilidade de senha.*  
  > *À direita, demonstramos o **tratamento visual de erro**: caso as credenciais estejam incorretas, o endpoint `POST /api/auth/login` valida a senha via Argon2id nativo do Bun, responde com código HTTP `401 Unauthorized` e o frontend exibe instantaneamente o alerta visual vermelho, mantendo a experiência do usuário sem recarregar a tela."*
- **Prints a destacar:** `03-login.png` e `04-login-erro.png`.

---

### 📌 Minuto 02:40 - 03:20 | Slide 6: Gestão de Sessão · Autocadastro e Store Pinia Ativa (Critério 2.3)
- **O que falar:**
  > *"Completando o fluxo de sessão:*  
  > *À esquerda, a tela de **Autocadastro de Clientes**, com máscara dinâmica de telefone `(51) 99999-9999` e verificação de senha forte. A gravação é atômica no banco, inserindo simultaneamente em `users` e `clients`.*  
  > *À direita, vemos a **Home Autenticada**: a store Pinia (`useAuthStore`) salva o JWT no `localStorage`, altera o cabeçalho para exibir o nome do usuário logado, links para Perfil, Logout e acesso direto ao Painel Administrativo. Nosso interceptor Axios anexa o cabeçalho `Authorization: Bearer <token>` em todas as requisições privadas."*
- **Prints a destacar:** `05-cadastro.png` e `06-home-autenticada.png`.

---

### 📌 Minuto 03:20 - 04:00 | Slide 7: Gestão Operacional no PostgreSQL 16 · Sumário dos Dois CRUDs
- **O que falar:**
  > *"Entramos agora no ambiente administrativo através do Painel de Gestão da loja (`08-admin.png`).*  
  > *Sintetizamos nossa entrega em dois grandes módulos que compõem os nossos dois CRUDs obrigatórios:*  
  > - *O **Módulo 1 · Usuários & Clientes (CRUD 1)**: gestão de contas e papéis (Admin, Funcionário, Cliente), cobrindo criação, listagem reativa com busca, edição e Soft Delete;*  
  > - *O **Módulo 2 · Fornecedores & Marcas (CRUD 2)**: gestão de fábricas e fabricantes de móveis, com notificações toast em tempo real (`vue3-toastify`) e integridade de catálogo;*  
  > - *E a regra transversal **RNF08 Estrito**: exclusão lógica padronizada via `deleted_at`, sem destruição física de registros.*  
  > *Vejamos agora o fluxo de cada um deles em ação nas telas reais!"*
- **Prints a destacar:** `08-admin.png`.

---

### 📌 Minuto 04:00 - 04:45 | Slide 8: CRUD 1 em Ação · Criação & Inclusão Imediata no Banco
- **O que falar:**
  > *"Entrando diretamente no **CRUD 1 de Usuários & Clientes**:*  
  > - *À esquerda, preenchemos o formulário de inclusão com a usuária 'Ana Teste Parcial', e-mail corporativo, telefone com máscara e validação de senha forte e segura.*  
  > - *À direita, ao clicar em Salvar, a requisição `POST /api/clientes` persiste os dados no PostgreSQL 16 com hash Argon2id e a listagem reflete o novo registro imediatamente no topo da tabela, sem qualquer necessidade de recarregar a página (F5)!"*
- **Prints a destacar:** `crud/usuarios/03-novo-preenchido.png` e `crud/usuarios/04-lista-apos-cadastro.png`.

---

### 📌 Minuto 04:45 - 05:30 | Slide 9: CRUD 1 Gestão · Edição Cadastral e Soft Delete (RNF08)
- **O que falar:**
  > *"Completando o ciclo de vida de usuários:*  
  > - *À esquerda, o modal de **Edição** permite alterar telefone, cidade e perfil de acesso, mantendo o e-mail como chave única inalterável.*  
  > - *À direita, demonstramos o **Soft Delete (RNF08)**: o modal de confirmação alerta explicitamente que o registro passará por exclusão lógica. Ao confirmar, o endpoint preenche `deleted_at = CURRENT_TIMESTAMP`, inativando a conta sem destruir o histórico. E graças ao nosso **índice parcial único** (`WHERE deleted_at IS NULL`), caso o usuário precise se recadastrar no futuro, o e-mail estará livre no banco."*
- **Prints a destacar:** `crud/usuarios/05-editar.png` e `crud/usuarios/07-modal-desativar.png`.

---

### 📌 Minuto 05:30 - 06:15 | Slide 10: CRUD 2 em Ação · Cadastro de Marca com Toast em Tempo Real
- **O que falar:**
  > *"Passando agora para o **CRUD 2 de Fornecedores & Fábricas Parceiras** (requisitos RF04 e RF18):*  
  > - *À esquerda, o administrador cadastra a razão social da fábrica parceira ('Estofados Nobres') e o canal de contato comercial.*  
  > - *À direita, ao submeter via `POST /api/fornecedores`, a persistência no PostgreSQL é imediata e o usuário recebe feedback visual instantâneo através de uma **notificação toast verde no canto inferior direito** via biblioteca `vue3-toastify`, com a nova linha já visível na tabela com status Ativo!"*
- **Prints a destacar:** `crud/fornecedores/03-novo-preenchido.png` e `crud/fornecedores/04-lista-apos-cadastro.png`.

---

### 📌 Minuto 06:15 - 07:00 | Slide 11: CRUD 2 Gestão · Edição Comercial e Integridade Referencial
- **O que falar:**
  > *"Finalizando o CRUD de Fornecedores:*  
  > - *À esquerda, o modal de edição permite atualizar telefones de televendas e representantes comerciais da fábrica.*  
  > - *À direita, ao solicitar a desativação da fábrica parceira, o sistema executa a exclusão lógica via Soft Delete. Isso é fundamental para a **integridade referencial**: produtos do catálogo vinculados a esse fornecedor não têm suas chaves estrangeiras (`supplier_id`) violadas, mantendo o histórico de compras e produtos 100% íntegro no banco de dados."*
- **Prints a destacar:** `crud/fornecedores/05-editar.png` e `crud/fornecedores/07-modal-desativar.png`.

---

### 📌 Minuto 07:00 - 07:45 | Slide 12: Metodologia de Trabalho · Database First & Engenharia de Requisitos
- **O que falar:**
  > *"Com os 2 CRUDs validados, apresentamos nossa engenharia de processo:*  
  > *Adotamos a metodologia **Database First**: nenhuma rota de backend e nenhuma tela de frontend é implementada antes da modelagem e validação do esquema relacional no PostgreSQL.*  
  > *Como demonstram os prints do nosso **Kanban no GitHub Projects** e da **Issue formal**, toda funcionalidade foi decomposta com critérios de aceitação bem delimitados em camadas técnicas `[DB]`, `[BE]` e `[FE]`, garantindo total rastreabilidade entre requisitos e código implementado."*
- **Prints a destacar:** `27-github-kanban-task.png` e `24-issue-github.png`.

---

### 📌 Minuto 07:45 - 08:30 | Slide 13: Governança do Código · GitFlow com +50 Pull Requests
- **O que falar:**
  > *"Nossa governança de código no GitHub foi exemplar:*  
  > - *Mais de **50 Pull Requests** abertos, revisados por pares e mesclados sem commits diretos na branch `main`;*  
  > - *Padrão rigoroso de **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`);*  
  > - *Gráfico de rede do Git totalmente linear e convergente;*  
  > - *Auditoria estrita de tipagem TypeScript (`bun run check-types`) e lint com ESLint sem nenhuma regra ignorada."*
- **Prints a destacar:** `16-github-commits.png` e `19-github-network.png`.

---

### 📌 Minuto 08:30 - 09:05 | Slide 14: Facilidade de Execução · Setup Zero-Configuração em Um Comando
- **O que falar:**
  > *"Qualquer avaliador consegue colocar nosso sistema para rodar em segundos:*  
  > - *Basta copiar `.env.example` e executar `docker compose --profile dev up -d` para ter ambiente completo com HMR.*  
  > - *Ou `docker compose --profile prod up -d --build` para subir o Nginx com os assets compilados na porta 80.*  
  > - *O container de banco roda migrações SQL idempotentes automaticamente e já efetua o seed inicial do banco de dados."*

---

### 📌 Minuto 09:05 - 09:30 | Slide 15: 🌟 A Grande "Cereja do Bolo" · Sistema 100% no Ar na VPS!
- **O que falar:**
  > *"E agora, como a grande **cereja do bolo** da nossa apresentação:*  
  > *Tudo o que vocês viram até aqui não são apenas capturas de tela ou ambiente local mockado. Nossa aplicação inteira já está **compilada, implantada e operando ao vivo em produção na nuvem**, em uma VPS pública no endereço `http://177.44.248.90/`!*  
  > *Convidamos agora o professor e toda a banca a abrirem pelo notebook ou smartphone para navegar e testar a vitrine ao vivo em tempo real. A resposta é instantânea e o banco de dados PostgreSQL está rodando em container fechado com Nginx como proxy reverso na porta 80!"*

---

### 📌 Minuto 09:30 - 09:50 | Slide 16: Lições Aprendidas & Desafios Reais de Infraestrutura
- **O que falar:**
  > *"Mas para conseguir colocar essa arquitetura completa de pé e no ar na VPS em produção, compartilhamos os 4 principais desafios e aprendizados práticos que vivenciamos:*  
  > *1. O esforço documental no PRD e no DER foi trabalhoso ('documental caro'), mas evitou qualquer retrabalho técnico.*  
  > *2. A estabilização do Docker para a VPS e a separação dos perfis de desenvolvimento (HMR) e de produção com Nginx.*  
  > *3. Detalhes de segurança e rede (expiração de JWT, variáveis de ambiente seguras e não expor o PostgreSQL na internet).*  
  > *4. A escolha do Bun nativo puro sem frameworks deu enorme velocidade, com a reflexão de que um micro-framework poderia ter acelerado o código base inicial."*

---

### 📌 Minuto 09:50 - 10:00 | Slide 17: Encerramento · Perguntas da Banca (5 Minutos)
- **O que falar:**
  > *"Agradecemos imensamente a atenção de todos. O sistema continua no ar e aberto para navegação em `http://177.44.248.90/` e estamos prontos para a arguição do professor e da banca!"*

---

## 🎯 Guia de Defesa: Perguntas Prováveis do Professor (5 Minutos)

### ❓ Pergunta 1:
> **"Por que vocês escolheram utilizar Soft Delete (exclusão lógica) em vez de DELETE físico no banco? E como vocês resolveram o problema de unicidade de e-mail se o registro continuar na tabela?"**
- **Resposta Técnica:**
  > *"Adotamos o Soft Delete (requisito RNF08) porque em um e-commerce e catálogo comercial, apagar registros fisicamente causaria violações graves de chave estrangeira em pedidos e listas históricas, além de destruir dados para auditoria.*  
  > *Para resolver o conflito de unicidade (por exemplo, quando um cliente desativa a conta e depois tenta se cadastrar com o mesmo e-mail), criamos **índices parciais únicos** no PostgreSQL, como `CREATE UNIQUE INDEX idx_users_email_active ON users (email) WHERE deleted_at IS NULL`. Dessa forma, o banco garante unicidade apenas entre os registros ativos, permitindo reutilização do e-mail caso o anterior esteja inativado."*

### ❓ Pergunta 2:
> **"Como foi estruturada a segurança da sessão e como o frontend sabe se o usuário está autenticado ou se o token expirou?"**
- **Resposta Técnica:**
  > *"No backend Bun, utilizamos Argon2id nativo (`Bun.password.hash`) para as senhas e emitimos tokens JWT no padrão HMAC-SHA256 contendo `id`, `email`, `role` e expiração de 7 dias.*  
  > *No frontend Vue 3, a store Pinia salva o token no `localStorage`. Criamos um interceptor global no Axios: na ida, ele anexa o header `Authorization: Bearer <token>`; na volta, ele intercepta códigos `401 Unauthorized`. Se o token for inválido ou tiver expirado, o interceptor executa automaticamente `authStore.logout()` e redireciona a rota para `/login` exibindo aviso para o usuário."*

### ❓ Pergunta 3:
> **"Como está estruturada a arquitetura interna do backend em Bun nativo? Vocês usaram algum framework como Express ou NestJS?"**
- **Resposta Técnica:**
  > *"Optamos por não utilizar frameworks pesados como Express ou NestJS para extrair o desempenho máximo do runtime do Bun, utilizando `Bun.serve` nativo e o driver nativo `SQL`.*  
  > *Para manter o código limpo e escalável, dividimos em camadas bem delimitadas: rotas HTTP (que recebem os verbos e URLs), controllers (que validam requisição e status semânticos), services (com as regras de negócio de domínio) e repositories (com as queries parametrizadas no PostgreSQL). Criamos testes automatizados com `bun:test` e coleções no Bruno para validar os endpoints de forma isolada."*

### ❓ Pergunta 4:
> **"Como vocês garantiram a governança do código e dividiram o trabalho sem gerar conflitos de merge?"**
- **Resposta Técnica:**
  > *"Adotamos duas práticas essenciais: primeiro, a decomposição estrita de cada funcionalidade em camadas técnicas `[DB]`, `[BE]`, `[FE]` e `[INFRA]`. Isso garantiu que o trabalho no banco de dados não colidisse com a implementação das telas do Vue.*  
  > *Segundo, proibimos commits diretos na branch `main`. Toda alteração passou por branch temática com Conventional Commits e Pull Request obrigatório revisado por pares antes de ser integrado. Com isso, mantivemos a suíte de tipos `bun run check-types` e o linter sempre com 100% de sucesso em toda a sprint."*
