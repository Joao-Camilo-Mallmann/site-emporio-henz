# Roteiro Completo de Apresentação · Parcial 1
## Projeto: Empório Henz (Portal Web & E-commerce)
**Tempo total de apresentação:** 10 minutos cravados  
**Tempo de arguição do professor:** 5 minutos  
**Nota alvo:** 10,0 / 10,0  
**Estilo Visual:** Design System Oficial Empório Henz (Clean Branco `#FFFFFF`, Azul Institucional `#123854` e `#007CD8`, sem sombras pesadas, prints nítidos em destaque e separadores editoriais).

---

## 👥 Divisão Nominal da Equipe e Responsabilidades

| Integrante | Papel Principal | Contribuição Técnica na Parcial 1 | O que responder na arguição do Professor |
|---|---|---|---|
| **João Camilo Mallmann** | *Tech Lead & Full Stack* | Setup Docker/Nginx, arquitetura Bun nativo, migrações SQL idempotentes, Store Pinia, Interceptor Axios, Telas de Admin, CRUDs de Usuários e Fornecedores. | Detalhes da sessão JWT, interceptor Axios no HTTP 401, Docker Compose multi-perfil e Soft Delete na camada de rotas. |
| **Luiz Postal** | *Engenharia de Requisitos & Modelagem de Dados* | Refinamento do DER (11 tabelas), atualização do PRD com perguntas ao cliente, especificação dos índices parciais únicos de Soft Delete e revisão técnica dos PRs #8 e #50. | Por que foi escolhido Soft Delete em vez de `DELETE` físico; como funcionam os índices parciais únicos para permitir reuso de e-mail; integridade referencial. |
| **Cauã Primon** | *Desenvolvedor Backend & Módulos de Domínio* | Implementação do módulo de recomendação de produtos (US-BE-15) em arquitetura Service/Repository, testes unitários com `bun:test` e coleções Bruno. | Estrutura modular do backend em rotas, controllers, services e repositories; como o Bun nativo trata requisições HTTP e retorno JSON. |
| **Airton Costa Junior** | *QA & Governança de Arquitetura* | Revisão e aprovação dos PRs estruturais (#1 e #52), auditoria de integridade de linter (ESLint) e tipagem (TypeScript), garantia de conformidade com o edital. | Como funcionou o fluxo de aprovação de Pull Requests; padrão Conventional Commits; separação de tarefas em camadas `[DB]`, `[BE]`, `[FE]`. |

---

## ⏱️ Roteiro de Fala Slide a Slide (00:00 - 10:00)

### 📌 Minuto 00:00 - 00:35 | Slide 1: Capa & Visão Geral
- **Orador sugerido:** João Camilo Mallmann
- **O que falar:**
  > *"Boa noite professor e colegas! Nós somos o grupo responsável pelo desenvolvimento do portal web e e-commerce do **Empório Henz**, uma tradicional loja de móveis de alto padrão com mais de 50 anos de história no Vale do Taquari, que foi reconstruída após a enchente histórica.*  
  > *Nesta apresentação da **Parcial 1**, cumprimos com rigor 100% dos critérios do edital: autenticação completa e gestão de sessão stateless, 2 CRUDs persistentes no PostgreSQL 16 com Soft Delete, frontend funcional com a identidade visual clean em branco e azul do Figma, README com passo a passo zero-configuração e processo robusto de governança no GitHub."*

---

### 📌 Minuto 00:35 - 01:10 | Slide 2: Vitrine Digital (Critério 2.2 · Fidelidade ao Figma)
- **Orador sugerido:** João Camilo / Luiz Postal
- **O que falar:**
  > *"Aqui vemos a nossa **Vitrine Digital**. Desenvolvemos o frontend em **Vue 3 com Composition API** e **Tailwind CSS v4**, respeitando cada detalhe do protótipo no Figma.*  
  > *A tela traz o Hero Banner em azul suave (`#D2E8F8`), tipografia institucional, barra de busca inteligente e navegação completa por categorias de móveis para quarto, sala de estar, cozinha e escritório."*
- **Prints a destacar:** `01-home.png`.

---

### 📌 Minuto 01:10 - 01:45 | Slide 3: Página Institucional · Homenagem aos 50 Anos (Critério 2.2)
- **Orador sugerido:** Luiz Postal / Cauã Primon
- **O que falar:**
  > *"Na página **Sobre a Loja**, traduzimos os requisitos levantados com o cliente: uma homenagem aos 50 anos de fundação e a comovente trajetória de resiliência e reconstrução da loja após a enchente histórica que atingiu o Vale do Taquari.*  
  > *Essa página humaniza a marca e reforça o valor institucional do Empório Henz para a comunidade local."*
- **Prints a destacar:** `02-sobre-a-loja.png`.

---

### 📌 Minuto 01:45 - 02:25 | Slide 4: Autenticação Segura · Login & Feedback Visual de Erro (Critério 2.3)
- **Orador sugerido:** João Camilo Mallmann
- **O que falar:**
  > *"Passando para a Autenticação e Sessão (requisito de peso 2,5):*  
  > *À esquerda, temos o formulário de login com validação reativa e alternância de visibilidade de senha.*  
  > *À direita, demonstramos o **tratamento visual de erro**: ao submeter credenciais incorretas, o endpoint `POST /api/auth/login` valida a senha via Argon2id nativo, retorna status HTTP `401 Unauthorized` e o frontend exibe instantaneamente o alerta visual vermelho, sem recarregar a página."*
- **Prints a destacar:** `03-login.png` e `04-login-erro.png`.

---

### 📌 Minuto 02:25 - 03:05 | Slide 5: Gestão de Sessão · Autocadastro e Store Pinia Ativa (Critério 2.3)
- **Orador sugerido:** João Camilo Mallmann
- **O que falar:**
  > *"Completando o fluxo de sessão:*  
  > *À esquerda, a tela de **Autocadastro de Clientes**, com máscara dinâmica de telefone `(51) 99999-9999` e verificação de senha forte. A gravação é atômica no banco, inserindo em `users` e `clients` simultaneamente.*  
  > *À direita, vemos a **Home Autenticada**: a store Pinia (`useAuthStore`) salva o JWT no `localStorage`, altera o cabeçalho para exibir o nome do usuário logado, links para Perfil, Logout e acesso direto ao Painel Administrativo. Nosso interceptor Axios anexa o cabeçalho `Authorization: Bearer <token>` em todas as requisições privadas."*
- **Prints a destacar:** `05-cadastro.png` e `06-home-autenticada.png`.

---

### 📌 Minuto 03:05 - 03:45 | Slide 6: Rápido Sumário no Meio · Painel Administrativo & Os Dois CRUDs
- **Orador sugerido:** João Camilo / Luiz Postal
- **O que falar:**
  > *"Fazendo um rápido sumário aqui na metade da apresentação: agora que validamos a vitrine pública e todo o fluxo de autenticação, entramos no **Painel Administrativo da Loja**.*  
  > *Como mostra o print central (`08-admin.png`), o painel divide a governança operacional em dois grandes módulos que compõem os nossos dois CRUDs obrigatórios:*  
  > - *O **CRUD 1**: Gestão de Usuários e Clientes, focado em contas, papéis e permissões;*  
  > - *O **CRUD 2**: Gestão de Fornecedores e Marcas, focado nas fábricas parceiras de móveis.*  
  > *Ambos os CRUDs foram construídos com persistência relacional no PostgreSQL 16 e obedecem estritamente à regra de Soft Delete (RNF08)."*
- **Prints a destacar:** `08-admin.png`.

---

### 📌 Minuto 03:45 - 04:15 | Slide 7: [SEÇÃO 01] Início do CRUD 1 · Gestão de Usuários & Clientes
- **Orador sugerido:** João Camilo / Luiz Postal
- **O que falar:**
  > *"Damos início formal à demonstração do **CRUD 1: Usuários & Clientes**.*  
  > *Neste bloco, vamos demonstrar as quatro operações essenciais:*  
  > - *O **[C] Create**: cadastro de usuários com definição de perfil e validação de senha forte;*  
  > - *O **[R] Read**: listagem com paginação e busca dinâmica por nome ou e-mail com debounce;*  
  > - *O **[U] Update**: edição de contatos, cidade e perfil de acesso;*  
  > - *E o **[D] Delete**: desativação lógica via Soft Delete (`deleted_at = CURRENT_TIMESTAMP`) protegida por índice parcial único no PostgreSQL."*

---

### 📌 Minuto 04:15 - 05:00 | Slide 8: CRUD 1 em Ação · Criação & Inclusão Imediata no Banco
- **Orador sugerido:** João Camilo Mallmann
- **O que falar:**
  > *"Vejam a criação em funcionamento real:*  
  > - *À esquerda, preenchemos o formulário de inclusão com a usuária 'Ana Teste Parcial', e-mail institucional, telefone com máscara e senha atendendo a todos os requisitos de segurança.*  
  > - *À direita, ao clicar em Salvar, a requisição `POST /api/clientes` persiste os dados no PostgreSQL 16 com hash Argon2id e a listagem reflete o novo registro imediatamente no topo da tabela, sem qualquer necessidade de recarregar a página (F5)!"*
- **Prints a destacar:** `crud/usuarios/03-novo-preenchido.png` e `crud/usuarios/04-lista-apos-cadastro.png`.

---

### 📌 Minuto 05:00 - 05:45 | Slide 9: CRUD 1 Gestão · Edição Cadastral e Soft Delete (RNF08)
- **Orador sugerido:** Luiz Postal / João Camilo
- **O que falar:**
  > *"Completando o ciclo de vida do usuário:*  
  > - *À esquerda, o modal de **Edição** permite alterar telefone, cidade e permissão de acesso, mantendo o e-mail como chave única inalterável.*  
  > - *À direita, demonstramos o **Soft Delete (RNF08)**: o modal de confirmação alerta explicitamente que o registro passará por exclusão lógica. Ao confirmar, o endpoint preenche `deleted_at`, desativando a conta sem destruir o histórico. E graças ao nosso **índice parcial único** (`WHERE deleted_at IS NULL`), caso a pessoa precise ser reativada no futuro, o e-mail poderá ser reutilizado sem conflito de banco."*
- **Prints a destacar:** `crud/usuarios/05-editar.png` e `crud/usuarios/07-modal-desativar.png`.

---

### 📌 Minuto 05:45 - 06:15 | Slide 10: [SEÇÃO 02] Conclusão CRUD 1 & Início do CRUD 2 · Fornecedores
- **Orador sugerido:** Cauã Primon / João Camilo
- **O que falar:**
  > *"Concluímos o CRUD 1 com 100% de sucesso e iniciamos agora o **CRUD 2: Fornecedores & Fábricas Parceiras** (requisitos RF04 e RF18).*  
  > *No modelo de negócio do Empório Henz, a curadoria de fornecedores (como indústrias de estofados e salas de jantar) é estratégica.*  
  > *Demonstraremos as quatro operações:*  
  > - *O **[C] Create**: cadastro de parceiro com notificação instantânea Toast;*  
  > - *O **[R] Read**: listagem com badge de status ativo e contatos de representantes;*  
  > - *O **[U] Update**: edição de contatos comerciais;*  
  > - *E o **[D] Delete**: inativação lógica com garantia de integridade referencial."*

---

### 📌 Minuto 06:15 - 07:00 | Slide 11: CRUD 2 em Ação · Cadastro com Feedback Toast em Tempo Real
- **Orador sugerido:** Cauã Primon / João Camilo
- **O que falar:**
  > *"Vejam o cadastro do fornecedor em ação:*  
  > - *À esquerda, o administrador preenche a razão social da fábrica parceira ('Estofados Nobres') e o canal de contato comercial.*  
  > - *À direita, ao submeter via `POST /api/fornecedores`, a persistência no PostgreSQL é imediata e o usuário recebe feedback visual instantâneo através de uma **notificação toast verde no canto inferior direito** via biblioteca `vue3-toastify`, com a nova linha já visível na tabela com status Ativo!"*
- **Prints a destacar:** `crud/fornecedores/03-novo-preenchido.png` e `crud/fornecedores/04-lista-apos-cadastro.png`.

---

### 📌 Minuto 07:00 - 07:45 | Slide 12: CRUD 2 Gestão · Edição Comercial e Integridade Referencial
- **Orador sugerido:** Cauã Primon / Luiz Postal
- **O que falar:**
  > *"Finalizando o CRUD de Fornecedores:*  
  > - *À esquerda, o modal de edição permite atualizar telefones de televendas e representantes comerciais da fábrica.*  
  > - *À direita, ao solicitar a desativação da fábrica parceira, o sistema executa o Soft Delete. Isso é fundamental para a **integridade referencial**: produtos do mostruário que pertencem a esse fornecedor não têm suas chaves estrangeiras (`supplier_id`) violadas, mantendo o histórico de pedidos e catálogos 100% íntegro no banco de dados."*
- **Prints a destacar:** `crud/fornecedores/05-editar.png` e `crud/fornecedores/07-modal-desativar.png`.

---

### 📌 Minuto 07:45 - 08:20 | Slide 13: Síntese dos CRUDs · 100% de Conformidade com o Edital
- **Orador sugerido:** Toda a Equipe / João Camilo
- **O que falar:**
  > *"Fechando o bloco de CRUDs com esta tabela de síntese:*  
  > *Entregamos 100% do escopo exigido no Critério 2.4:*  
  > - *Dois CRUDs completos, com Create, Read, Update e Delete em ambos;*  
  > - *Persistência relacional pura no PostgreSQL 16;*  
  > - *Soft Delete rigoroso (RNF08) com índices parciais e integridade de FK;*  
  > - *Feedback visual de excelência (toasts reativos e modais de confirmação).*  
  > *Com isso, passamos agora para a engenharia de processo, governança e facilidade de execução da nossa aplicação."*

---

### 📌 Minuto 08:20 - 08:50 | Slide 14: Metodologia de Trabalho · Database First & Gestão Nominal
- **Orador sugerido:** Luiz Postal & Airton Junior
- **O que falar:**
  > *"Adotamos a metodologia **Database First**: nenhuma linha de backend ou frontend é feita antes da validação do esquema relacional.*  
  > *Como demonstram os prints do nosso **Kanban no GitHub Projects** e da **Issue técnica formal**, dividimos o trabalho nominalmente:*  
  > - *O **Luiz Postal** liderou a modelagem do banco (11 tabelas) e refinamento do PRD;*  
  > - *O **João Camilo** cuidou da infraestrutura Docker, API em Bun nativo, autenticação e telas de Admin;*  
  > - *O **Cauã Primon** desenvolveu o módulo de recomendações (US-BE-15) em Service/Repository e testes com `bun:test`;*  
  > - *E o **Airton Junior** atuou como QA, garantindo aprovação de PRs e conformidade com o edital."*
- **Prints a destacar:** `27-github-kanban-task.png` e `24-issue-github.png`.

---

### 📌 Minuto 08:50 - 09:15 | Slide 15: Governança do Código · GitFlow com +50 Pull Requests
- **Orador sugerido:** Airton Costa Junior
- **O que falar:**
  > *"Nossa governança de código no GitHub foi exemplar:*  
  > - *Mais de **50 Pull Requests** abertos, revisados por pares e mesclados sem commits diretos na branch `main`;*  
  > - *Padrão rigoroso de **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`);*  
  > - *Gráfico de rede do Git totalmente linear e convergente;*  
  > - *Auditoria estrita de tipagem TypeScript (`bun run check-types`) e lint com ESLint sem nenhuma regra ignorada."*
- **Prints a destacar:** `16-github-commits.png` e `19-github-network.png`.

---

### 📌 Minuto 09:15 - 09:30 | Slide 16: Facilidade de Execução · Setup Zero-Configuração em Um Comando
- **Orador sugerido:** João Camilo Mallmann
- **O que falar:**
  > *"Qualquer avaliador consegue colocar nosso sistema para rodar em segundos:*  
  > - *Basta copiar `.env.example` e executar `docker compose --profile dev up -d` para ter ambiente completo com HMR.*  
  > - *Ou `docker compose --profile prod up -d --build` para subir o Nginx com os assets compilados na porta 80.*  
  > - *O container de banco roda migrações SQL idempotentes automaticamente e já efetua o seed do Administrador padrão (`admin@gmail.com` / `admin123`)."*

---

### 📌 Minuto 09:30 - 09:45 | Slide 17: 🍒 A Grande "Cereja do Bolo" · Sistema 100% no Ar na VPS!
- **Orador sugerido:** João Camilo Mallmann & Toda a Equipe
- **O que falar:**
  > *"E agora, como a grande **cereja do bolo** da nossa apresentação:*  
  > *Tudo o que vocês viram até aqui não são apenas capturas de tela ou ambiente local mockado. Nossa aplicação inteira já está **compilada, implantada e operando ao vivo em produção na nuvem**, em uma VPS pública no endereço `http://177.44.248.90/`!*  
  > *Convidamos agora o professor e toda a banca a abrirem pelo notebook ou smartphone para navegar, testar a vitrine e se autenticar com o usuário de teste `admin@gmail.com` / `admin123`. A resposta é instantânea e o banco de dados PostgreSQL está rodando em container fechado com Nginx como proxy reverso na porta 80!"*

---

### 📌 Minuto 09:45 - 09:55 | Slide 18: Lições Aprendidas & Desafios Reais de Infraestrutura
- **Orador sugerido:** Toda a Equipe / João Camilo
- **O que falar:**
  > *"Mas para conseguir colocar essa arquitetura completa de pé e no ar na VPS em produção, compartilhamos os 4 principais desafios e aprendizados práticos que vivenciamos:*  
  > *1. O esforço documental no PRD e no DER foi trabalhoso ('documental caro'), mas evitou qualquer retrabalho técnico.*  
  > *2. A estabilização do Docker para a VPS e a separação dos perfis de desenvolvimento (HMR) e de produção com Nginx.*  
  > *3. Detalhes de segurança e rede (expiração de JWT, variáveis de ambiente seguras e não expor o PostgreSQL na internet).*  
  > *4. A escolha do Bun nativo puro sem frameworks deu enorme velocidade, com a reflexão de que um micro-framework poderia ter acelerado o código base inicial."*

---

### 📌 Minuto 09:55 - 10:00 | Slide 19: Encerramento · Perguntas da Banca (5 Minutos)
- **Orador sugerido:** Toda a Equipe
- **O que falar:**
  > *"Agradecemos imensamente a atenção de todos. O sistema continua no ar e aberto para navegação em `http://177.44.248.90/` e estamos prontos para a arguição do professor e da banca!"*

---

## 🎯 Guia de Defesa: Perguntas Prováveis do Professor (5 Minutos)

### ❓ Pergunta 1 (Para o Luiz Postal):
> **"Por que vocês escolheram utilizar Soft Delete (exclusão lógica) em vez de DELETE físico no banco? E como vocês resolveram o problema de unicidade de e-mail se o registro continuar na tabela?"**
- **Resposta do Luiz:**
  > *"Adotamos o Soft Delete (requisito RNF08) porque em um e-commerce e catálogo comercial, apagar registros fisicamente causaria violações graves de chave estrangeira em pedidos e listas históricas, além de destruir dados para auditoria.*  
  > *Para resolver o conflito de unicidade (por exemplo, quando um cliente desativa a conta e depois tenta se cadastrar com o mesmo e-mail), criamos **índices parciais únicos** no PostgreSQL, como `CREATE UNIQUE INDEX idx_users_email_active ON users (email) WHERE deleted_at IS NULL`. Dessa forma, o banco garante unicidade apenas entre os registros ativos, permitindo reutilização do e-mail caso o anterior esteja inativado."*

### ❓ Pergunta 2 (Para o João Camilo Mallmann):
> **"Como foi estruturada a segurança da sessão e como o frontend sabe se o usuário está autenticado ou se o token expirou?"**
- **Resposta do João:**
  > *"No backend Bun, utilizamos Argon2id nativo (`Bun.password.hash`) para as senhas e emitimos tokens JWT no padrão HMAC-SHA256 contendo `id`, `email`, `role` e expiração de 7 dias.*  
  > *No frontend Vue 3, a store Pinia salva o token no `localStorage`. Criamos um interceptor global no Axios: na ida, ele anexa o header `Authorization: Bearer <token>`; na volta, ele intercepta códigos `401 Unauthorized`. Se o token for inválido ou tiver expirado, o interceptor executa automaticamente `authStore.logout()` e redireciona a rota para `/login` exibindo aviso para o usuário."*

### ❓ Pergunta 3 (Para o Cauã Primon):
> **"Como está estruturada a arquitetura interna do backend em Bun nativo? Vocês usaram algum framework como Express ou NestJS?"**
- **Resposta do Cauã:**
  > *"Optamos por não utilizar frameworks pesados como Express ou NestJS para extrair o desempenho máximo do runtime do Bun, utilizando `Bun.serve` nativo e o driver nativo `SQL`.*  
  > *Para manter o código limpo e escalável, dividimos em camadas bem delimitadas: rotas HTTP (que recebem os verbos e URLs), controllers (que validam requisição e status semânticos), services (com as regras de negócio de domínio) e repositories (com as queries parametrizadas no PostgreSQL). Criamos testes automatizados com `bun:test` e coleções no Bruno para validar os endpoints de forma isolada."*

### ❓ Pergunta 4 (Para o Airton Costa Junior):
> **"Como vocês garantiram a governança do código e dividiram as tarefas entre quatro pessoas sem gerar conflitos de merge?"**
- **Resposta do Airton:**
  > *"Adotamos duas práticas essenciais: primeiro, a decomposição estrita de cada funcionalidade em camadas técnicas `[DB]`, `[BE]`, `[FE]` e `[INFRA]`. Isso garantiu que um desenvolvedor pudesse trabalhar no banco de dados sem colidir com quem estava implementando as telas do Vue.*  
  > *Segundo, proibimos commits diretos na branch `main`. Toda alteração passou por branch temática com Conventional Commits e Pull Request obrigatório revisado por outro integrante antes de ser integrado. Com isso, mantivemos a suíte de tipos `bun run check-types` e o linter sempre com 100% de sucesso em toda a sprint."*
