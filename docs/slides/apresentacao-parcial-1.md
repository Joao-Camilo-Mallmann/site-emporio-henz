---
marp: true
theme: default
paginate: true
style: |
  section {
    background-color: #fefefe;
    color: #1d1d24;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    padding: 24px 36px;
    box-shadow: none !important;
  }
  h1 { font-size: 34px; color: #123854; margin-bottom: 6px; font-weight: 700; }
  h2 { font-size: 22px; color: #123854; border-bottom: 2px solid #007cd8; padding-bottom: 4px; margin-bottom: 12px; font-weight: 700; }
  h2 span { color: #007cd8; }
  h3 { font-size: 17px; color: #123854; margin-bottom: 6px; font-weight: 600; }
  p, span, li { font-size: 14px; color: #475569; }
  b, strong { font-weight: 700; color: #123854; }
  a { color: #007cd8; text-decoration: none; }
  code {
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }
  section::after {
    font-size: 11px;
    color: #94a3b8;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-weight: 600;
  }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
  .grid-2-asym { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: center; }
  img.screenshot {
    display: block;
    width: 100%;
    height: 292px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    box-shadow: none !important;
    object-fit: cover;
    object-position: top center;
    background: #ffffff;
    margin: 0 0 8px 0;
  }
  img.screenshot.shot-compare {
    height: 340px;
    object-fit: contain;
    object-position: center top;
    background: #ffffff;
  }
  img.screenshot.shot-bottom {
    width: auto;
    max-width: 72%;
    height: 520px;
    margin: 0 auto;
    object-fit: contain;
    object-position: top center;
  }
  img.screenshot.shot-page {
    width: auto;
    max-width: 100%;
    height: 600px;
    margin: 0 auto;
    object-fit: contain;
    object-position: center top;
  }
  section.page-proof {
    padding-top: 18px;
    padding-bottom: 28px;
  }
  section.page-proof h2 {
    margin-bottom: 8px;
  }
  img.screenshot.shot-form {
    height: 318px;
    object-position: center 28%;
  }
  img.screenshot.shot-signup {
    height: 340px;
    object-position: center 62%;
  }
  img.screenshot.shot-panel {
    height: 318px;
    object-position: top center;
  }
  img.screenshot.shot-modal {
    height: 318px;
    object-position: center 42%;
  }
  img.screenshot.shot-github {
    height: 360px;
    object-position: center 18%;
  }
  .caption {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
    text-align: center;
    font-style: italic;
  }
  .agenda-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 8px;
  }
  .agenda-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #123854;
    border-radius: 6px;
    padding: 10px 14px;
  }
  .agenda-card:nth-child(2) { border-left-color: #007cd8; }
  .agenda-card:nth-child(3) { border-left-color: #123854; }
  .agenda-card:nth-child(4) { border-left-color: #007cd8; }
  .agenda-card:nth-child(5) { border-left-color: #10b981; grid-column: span 2; }
  .agenda-num {
    font-size: 11px;
    font-weight: 800;
    color: #007cd8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }
  .agenda-card h4 {
    font-size: 13px;
    color: #123854;
    margin: 0 0 3px 0;
    font-weight: 700;
  }
  .agenda-card p {
    font-size: 12px;
    color: #475569;
    margin: 0;
    line-height: 1.35;
  }
  .module-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #123854;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 8px;
  }
  .module-card-alt { border-left-color: #007cd8; }
  .module-card h4 {
    font-size: 13px;
    color: #123854;
    margin: 0 0 4px 0;
    font-weight: 700;
  }
  .module-card p {
    font-size: 12px;
    color: #475569;
    margin: 0;
    line-height: 1.4;
  }
  .lesson-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #123854;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 10px;
  }
  .lesson-card.alt { border-left-color: #007cd8; }
  .lesson-card h4 {
    font-size: 13px;
    color: #123854;
    margin: 0 0 4px 0;
    font-weight: 700;
  }
  .lesson-card p {
    font-size: 12px;
    color: #475569;
    margin: 0;
    line-height: 1.4;
  }
  .badge-module {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 4px 12px;
    border-radius: 4px;
    background: #123854;
    color: #ffffff;
    margin-bottom: 8px;
  }
  .badge-module-alt { background: #007cd8; color: #ffffff; }
  .info-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #007cd8;
    border-radius: 6px;
    padding: 8px 12px;
    margin-top: 8px;
  }
  .info-box p {
    font-size: 13px;
    margin: 0;
    color: #334155;
  }
  /* Estilização para Slides com Fundo Escuro */
  section.brand-cover,
  section.live-vps,
  section.brand-closing {
    color: #ffffff;
  }
  section.brand-cover::after,
  section.live-vps::after,
  section.brand-closing::after {
    display: none;
  }
  section.brand-cover h1, section.brand-cover h2, section.brand-cover h3,
  section.live-vps h1, section.live-vps h2, section.live-vps h3,
  section.brand-closing h1, section.brand-closing h2, section.brand-closing h3 {
    color: #ffffff;
    border: none;
  }
  section.brand-cover b, section.brand-cover strong,
  section.live-vps b, section.live-vps strong,
  section.brand-closing b, section.brand-closing strong {
    color: #ffffff !important;
  }
  section.brand-cover p, section.brand-cover span,
  section.live-vps p, section.live-vps span, section.live-vps li,
  section.brand-closing p, section.brand-closing span {
    color: #e2e8f0;
  }
  section.brand-cover a, section.live-vps a, section.brand-closing a {
    color: #7dd3fc !important;
    text-decoration: underline;
  }
  section.brand-cover {
    background: linear-gradient(135deg, #123854 0%, #0c2340 100%);
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    align-items: center;
    padding: 36px 54px;
  }
  section.brand-cover h1 {
    font-size: 34px;
    margin-bottom: 6px;
  }
  section.brand-cover h3 {
    color: #7dd3fc !important;
    font-size: 18px;
    margin-bottom: 16px;
  }
  section.live-vps {
    background: linear-gradient(135deg, #0c2340 0%, #123854 50%, #007cd8 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 30px 48px;
  }
  section.live-vps h1 {
    font-size: 36px;
    margin-bottom: 6px;
  }
  section.live-vps h2 {
    color: #7dd3fc !important;
    font-size: 19px;
    margin-bottom: 12px;
    padding: 0;
  }
  .pill-production {
    display: inline-block;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 5px 16px;
    border-radius: 9999px;
    background: #007cd8;
    color: #ffffff;
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  .vps-url-box {
    background: #ffffff;
    color: #123854;
    font-size: 32px;
    font-weight: 800;
    padding: 12px 36px;
    border-radius: 10px;
    letter-spacing: 1px;
    margin: 10px 0;
    display: inline-block;
    border: 3px solid #7dd3fc;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
  .tech-pills {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-top: 12px;
    width: 100%;
    max-width: 900px;
  }
  .tech-pills div {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 13px;
    color: #ffffff;
    font-weight: 600;
  }
  .creds-card {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    padding: 10px 20px;
    margin-top: 12px;
    font-size: 14px;
    color: #e0f2fe;
  }
  .creds-card code {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
  section.brand-closing {
    background: linear-gradient(135deg, #123854 0%, #0c2340 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px 60px;
  }
  section.brand-closing h1 {
    font-size: 40px;
    margin-bottom: 6px;
  }
  section.brand-closing h3 {
    color: #7dd3fc !important;
    font-size: 20px;
    margin-bottom: 20px;
  }
---

<!-- _class: brand-cover -->
<!-- _paginate: false -->

<div>

<img src="../../frontend/public/images/logos/logo-horizontal.svg" alt="Empório Henz" style="height: 48px; border: none; margin-bottom: 16px;" />

# Plataforma Digital de Móveis
### Apresentação Técnica · Parcial 1

**Engenharia de Software** · Avaliação de Entrega

**Equipe:**  
João Camilo Mallmann · Luiz Postal  
Cauã Primon · Airton Costa Junior

</div>

<div style="text-align: center;">

<img src="../../frontend/public/images/hero/hero-furniture.png" alt="Mobiliário Empório Henz" style="max-height: 280px; border: none; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.35));" />

<p style="font-size: 13px; color: #cbd5e1; margin-top: 8px;">Design System Oficial · Fidelidade ao Figma</p>

</div>

---

## Sumário da Apresentação · <span>Roteiro da Parcial 1</span>

<div class="agenda-grid">

<div class="agenda-card">
  <div class="agenda-num">01 · Experiência do Cliente</div>
  <h4>Vitrine Digital & Institucional</h4>
  <p>Fidelidade aos protótipos do Figma, identidade visual e homenagem aos 50 anos de história.</p>
</div>

<div class="agenda-card">
  <div class="agenda-num">02 · Segurança & Sessão</div>
  <h4>Autenticação & Autocadastro</h4>
  <p>Hash Argon2id nativo, proteção JWT stateless, tratamento amigável de erro HTTP 401 e Pinia.</p>
</div>

<div class="agenda-card">
  <div class="agenda-num">03 · Módulos Operacionais</div>
  <h4>2 CRUDs Persistentes (PostgreSQL 16)</h4>
  <p>CRUD 1 (Usuários/Clientes) e CRUD 2 (Fornecedores/Marcas), com Soft Delete e reatividade.</p>
</div>

<div class="agenda-card">
  <div class="agenda-num">04 · Engenharia & Qualidade</div>
  <h4>Metodologia & Governança no GitHub</h4>
  <p>Database First, Kanban no GitHub Projects, GitFlow com +50 PRs e tipagem TypeScript 100% estrita.</p>
</div>

<div class="agenda-card">
  <div class="agenda-num">05 · Execução & Produção</div>
  <h4>Deploy Zero-Configuração, Demonstração na VPS & Lições Aprendidas</h4>
  <p>Ambiente em Docker Compose, convite para teste ao vivo na nuvem e desafios reais enfrentados.</p>
</div>

</div>

---

<!-- _class: page-proof -->

## Vitrine Digital · <span>Página inteira, fiel ao Figma</span>

<img class="screenshot shot-page" src="../prints/parcial1/01-home-completa.png" alt="Home completa" />

---

## Figma e a página final · <span>Mesmo enquadramento, lado a lado</span>

<div class="grid-2">
<div>

<img class="screenshot shot-compare" src="../prints/parcial1/28-figma-topo.png" alt="Layout no Figma" />
<div class="caption">Layout no Figma: hero, benefícios e categorias.</div>

</div>
<div>

<img class="screenshot shot-compare" src="../prints/parcial1/01-home-topo.png" alt="Home implementada" />
<div class="caption">Página final: a mesma faixa, já no site publicado.</div>

</div>
</div>

---

## Final da home · <span>Destaques, recomendações e rodapé</span>

<img class="screenshot shot-bottom" src="../prints/parcial1/01-home-final.png" alt="Final da home implementada" />

---

<!-- _class: page-proof -->

## Página Institucional · <span>Sobre a loja, página inteira</span>

<img class="screenshot shot-page" src="../prints/parcial1/02-sobre-completa.png" alt="Sobre a loja completa" />

---

## Autenticação Segura · <span>Login com Argon2id e Feedback Visual de Erro</span>

<div class="grid-2">
<div>

<img class="screenshot shot-form" src="../prints/parcial1/03-login.png" alt="Formulário de login" />
<div class="caption">1. Formulário de login com validação reativa e alternância de visibilidade.</div>

</div>
<div>

<img class="screenshot shot-form" src="../prints/parcial1/04-login-erro.png" alt="Erro de login" />
<div class="caption">2. Tratamento amigável de credenciais inválidas (HTTP 401 sem reload).</div>

</div>
</div>

**Segurança:** Hash de senha nativo no runtime Bun com Argon2id e controle de sessão stateless com Bearer JWT.

---

## Gestão de Sessão · <span>Autocadastro de Clientes e Store Pinia Ativa</span>

<div class="grid-2">
<div>

<img class="screenshot shot-signup" src="../prints/parcial1/05-cadastro.png" alt="Autocadastro" />
<div class="caption">1. Autocadastro com máscara dinâmica (51) 99999-9999 e validação de senha.</div>

</div>
<div>

<img class="screenshot shot-form" src="../prints/parcial1/07-perfil.png" alt="Perfil autenticado" />
<div class="caption">2. Sessão ativa: cabeçalho com o administrador e dados em Meu Perfil.</div>

</div>
</div>

**Persistência Relacional:** Inserção simultânea em `users` e `clients`, token em `localStorage` e interceptor global Axios.

---

## Gestão Operacional no PostgreSQL 16 · <span>Sumário dos Dois CRUDs</span>

<div class="grid-2-asym">
<div>

<img class="screenshot shot-panel" src="../prints/parcial1/08-admin.png" alt="Painel administrativo" />
<div class="caption">Painel Administrativo: Hub central dividindo a gestão operacional da loja.</div>

</div>
<div>

<div class="module-card">
  <h4>Módulo 1 · Usuários & Clientes (CRUD 1)</h4>
  <p>• Gestão de contas e papéis (Admin, Funcionário, Cliente).<br>• Criação, listagem reativa, edição e Soft Delete.</p>
</div>

<div class="module-card module-card-alt">
  <h4>Módulo 2 · Fornecedores & Marcas (CRUD 2)</h4>
  <p>• Gestão de fábricas e fabricantes de móveis.<br>• Notificações toast em tempo real e integridade de catálogo.</p>
</div>

<div class="info-box" style="margin-top: 6px;">
  <p><b>RNF08 Estrito:</b> Exclusão lógica (<code>deleted_at</code>) padronizada em ambos os módulos.</p>
</div>

</div>
</div>

---

<span class="badge-module">CRUD 1 · Usuários & Clientes</span>

## CRUD 1 em Ação · <span>Cadastro de Usuário e Inclusão Imediata no Banco</span>

<div class="grid-2">
<div>

<img class="screenshot shot-form" src="../prints/parcial1/crud/usuarios/03-novo-preenchido.png" alt="Novo usuário" />
<div class="caption">1. Formulário preenchido com validação de senha forte (POST /api/clientes).</div>

</div>
<div>

<img class="screenshot shot-panel" src="../prints/parcial1/crud/usuarios/04-lista-apos-cadastro.png" alt="Lista de usuários" />
<div class="caption">2. Novo usuário persistido na listagem em tempo real (Ana Teste Parcial).</div>

</div>
</div>

<div class="info-box">
<p><b>Persistência no PostgreSQL 16:</b> Inserção atômica com hash Argon2id; a reatividade do Vue 3 reflete o novo registro no topo da tabela sem necessidade de recarregar a tela.</p>
</div>

---

<span class="badge-module">CRUD 1 · Usuários & Clientes</span>

## CRUD 1 Gestão · <span>Edição Cadastral e Exclusão Lógica com Soft Delete</span>

<div class="grid-2">
<div>

<img class="screenshot shot-form" src="../prints/parcial1/crud/usuarios/05-editar.png" alt="Editar usuário" />
<div class="caption">1. Modal de edição de dados cadastrais (telefone, cidade e permissão).</div>

</div>
<div>

<img class="screenshot shot-modal" src="../prints/parcial1/crud/usuarios/07-modal-desativar.png" alt="Desativar usuário" />
<div class="caption">2. Modal de confirmação de exclusão lógica (Soft Delete RNF08).</div>

</div>
</div>

<div class="info-box">
<p><b>Soft Delete (RNF08):</b> O endpoint <code>DELETE</code> preenche <code>deleted_at</code> sem apagar histórico; o índice parcial único <code>idx_users_email_active</code> garante que contas inativas liberem o e-mail para eventuais recadastros.</p>
</div>

---

<span class="badge-module badge-module-alt">CRUD 2 · Fornecedores Parceiros</span>

## CRUD 2 em Ação · <span>Cadastro de Marca com Feedback Toast em Tempo Real</span>

<div class="grid-2">
<div>

<img class="screenshot shot-form" src="../prints/parcial1/crud/fornecedores/03-novo-preenchido.png" alt="Novo fornecedor" />
<div class="caption">1. Formulário preenchido com razão social e contato da fábrica parceira.</div>

</div>
<div>

<img class="screenshot shot-panel" src="../prints/parcial1/crud/fornecedores/04-lista-apos-cadastro.png" alt="Lista de fornecedores" />
<div class="caption">2. Estofados Nobres já na listagem, com status Ativo, sem recarregar a tela.</div>

</div>
</div>

<div class="info-box">
<p><b>Reatividade & Feedback Visual:</b> Endpoint <code>POST /api/fornecedores</code> persistido no PostgreSQL 16 com toast imediato via biblioteca <code>vue3-toastify</code> e listagem reativa.</p>
</div>

---

<span class="badge-module badge-module-alt">CRUD 2 · Fornecedores Parceiros</span>

## CRUD 2 Gestão · <span>Edição Comercial e Integridade Referencial</span>

<div class="grid-2">
<div>

<img class="screenshot shot-form" src="../prints/parcial1/crud/fornecedores/05-editar.png" alt="Editar fornecedor" />
<div class="caption">1. Edição de contatos comerciais, representantes e dados da marca parceira.</div>

</div>
<div>

<img class="screenshot shot-modal" src="../prints/parcial1/crud/fornecedores/07-modal-desativar.png" alt="Desativar fornecedor" />
<div class="caption">2. Modal de confirmação de desativação lógica preservando o histórico.</div>

</div>
</div>

<div class="info-box">
<p><b>Integridade Referencial:</b> A inativação lógica via Soft Delete impede violações de chave estrangeira (<code>supplier_id</code>) no mostruário de produtos e pedidos históricos da loja.</p>
</div>

---

## Metodologia de Trabalho · <span>Database First e Engenharia de Requisitos</span>

<div class="grid-2">
<div>

<img class="screenshot shot-github" src="../prints/parcial1/27-github-kanban-task.png" alt="Kanban no GitHub" />
<div class="caption">Quadro Kanban da Sprint no GitHub Projects.</div>

</div>
<div>

<img class="screenshot shot-github" src="../prints/parcial1/24-issue-github.png" alt="Issue no GitHub" />
<div class="caption">Issue formal com critérios de aceitação e camada técnica.</div>

</div>
</div>

**Engenharia de Processo:** Backlog e sprints organizados via Kanban no GitHub Projects, issues formais com critérios de aceitação e modelagem Database First no PostgreSQL 16.

---

## Governança do Código · <span>GitFlow com Mais de 50 Pull Requests Revisados</span>

<div class="grid-2">
<div>

<img class="screenshot shot-github" src="../prints/parcial1/16-github-commits.png" alt="Commits no GitHub" />
<div class="caption">Histórico de Conventional Commits (feat:, fix:).</div>

</div>
<div>

<img class="screenshot shot-github" src="../prints/parcial1/19-github-network.png" alt="Network do GitHub" />
<div class="caption">Network Graph de branches convergentes.</div>

</div>
</div>

**Governança:** Mais de 50 Pull Requests revisados por pares e zero erros de TypeScript e ESLint.

---

## Facilidade de Execução · <span>Ambiente Completo Subindo em Um Comando</span>

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env

# 2. Modo Desenvolvimento com Live-Reload (HMR)
docker compose --profile dev up -d
# Frontend: :3000 | Backend: :3001

# 3. Modo Produção Compilado (Nginx na porta 80)
docker compose --profile prod up -d --build
```

**Portabilidade Total:** Setup zero-configuração via Docker Compose, com migrações SQL automáticas e banco semeado.

---

<!-- _class: live-vps -->
<!-- _paginate: false -->

<span class="pill-production">Ambiente de Produção · Nuvem</span>

# Venha Ver Ao Vivo na Nossa VPS!
### Convidamos o Professor e a Banca para Testarem Agora em Tempo Real

<div class="vps-url-box">
http://177.44.248.90/
</div>

<p style="font-size: 16px; color: #e0f2fe; margin-top: 8px; max-width: 860px; line-height: 1.45;">
A plataforma está <b>compilada e no ar</b>. Abram o endereço no navegador durante a apresentação.
</p>

<div class="tech-pills">
<div>Docker Compose Produção</div>
<div>Nginx · porta 80</div>
<div>PostgreSQL 16 Nativo</div>
<div>Bun Nativo + Vue 3 SPA</div>
</div>

---

## Lições Aprendidas · <span>Desafios Reais de Infraestrutura, Segurança e Governança</span>

<div class="grid-2">
<div>

<div class="lesson-card">
  <h4>1. Esforço Documental ("Documental Caro")</h4>
  <p>Manter PRD, DER, issues no GitHub e código real alinhados demandou alto tempo e esforço.<br><b>Aprendizado:</b> Garantiu rastreabilidade total: tudo foi implementado sem retrabalho.</p>
</div>

<div class="lesson-card alt">
  <h4>2. Docker e Subir para a VM</h4>
  <p>Dificuldade de testar na VM remota e separar com precisão ambientes de <b>desenvolvimento</b> (Live-Reload) e <b>produção</b> (Nginx proxy reverso).<br><b>Aprendizado:</b> Setup estabilizado em um comando via <code>docker-compose.yml</code>.</p>
</div>

</div>
<div>

<div class="lesson-card">
  <h4>3. Codificação e Detalhes de Segurança</h4>
  <p>Ajustes minuciosos que parecem simples na teoria mas exigiram atenção fina: expiração de JWT, variáveis seguras, isolamento de rede do PostgreSQL na VPS e CORS.</p>
</div>

<div class="lesson-card alt">
  <h4>4. Backend Bun Nativo vs. Framework</h4>
  <p>Escolha de usar Bun nativo puro (<code>Bun.serve</code>) deu altíssima performance e controle.<br><b>Reflexão:</b> Exigiu criar roteamento na mão; um micro-framework poderia ter agilizado a entrega.</p>
</div>

</div>
</div>

---

<!-- _class: brand-closing -->
<!-- _paginate: false -->

<img src="../../frontend/public/images/logos/logo-horizontal.svg" alt="Empório Henz" style="height: 52px; border: none; margin-bottom: 20px;" />

# Obrigado!
### Espaço Aberto para Perguntas da Banca (5 Minutos)

**Empório Henz:** João Camilo Mallmann · Luiz Postal · Cauã Primon · Airton Costa Junior

**Ambiente Operando:** `http://177.44.248.90/`  
**Repositório:** `site-emporio-henz`
