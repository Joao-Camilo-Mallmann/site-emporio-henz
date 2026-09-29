---
marp: true
theme: default
paginate: true
header: 'Empório Henz · Parcial 1'
footer: 'Parcial 1 · Engenharia de Software'
style: |
  section {
    background-color: #ffffff;
    color: #1d1d24;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    padding: 24px 36px;
    box-shadow: none !important;
  }
  h1 { font-size: 36px; color: #123854; margin-bottom: 6px; }
  h2 { font-size: 23px; color: #123854; border-bottom: 2px solid #007cd8; padding-bottom: 4px; margin-bottom: 12px; }
  h2 span { color: #007cd8; }
  h3 { font-size: 18px; color: #123854; margin-bottom: 6px; }
  p, span, li { font-size: 14px; color: #475569; }
  b { color: #123854; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
  .grid-2-asym { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: center; }
  img {
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    box-shadow: none !important;
    max-height: 420px;
    object-fit: contain;
  }
  .caption {
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
    text-align: center;
    font-style: italic;
  }
  .tag {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 3px 10px;
    border-radius: 4px;
    background: #e0f2fe;
    color: #0369a1;
    margin-bottom: 8px;
  }
  .tag-accent {
    background: #007cd8;
    color: #ffffff;
  }
  .tag-success {
    background: #dcfce7;
    color: #15803d;
  }
  .tag-cherry {
    display: inline-block;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 6px 18px;
    border-radius: 9999px;
    background: #e11d48;
    color: #ffffff;
    margin-bottom: 12px;
    box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);
  }
  .info-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #007cd8;
    border-radius: 6px;
    padding: 10px 14px;
    margin-top: 8px;
  }
  .info-box p {
    font-size: 13px;
    margin: 0;
    color: #334155;
  }
  section.divider {
    background: linear-gradient(135deg, #123854 0%, #091a27 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 60px;
  }
  section.divider h1 {
    color: #ffffff;
    font-size: 38px;
    border-bottom: 3px solid #007cd8;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
  section.divider h2 {
    color: #7dd3fc;
    font-size: 22px;
    border: none;
    margin-bottom: 14px;
    padding: 0;
  }
  section.divider p, section.divider li {
    color: #cbd5e1;
    font-size: 15px;
  }
  section.divider b {
    color: #ffffff;
  }
  section.divider .op-card {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 8px;
  }
  section.live-demo {
    background: linear-gradient(135deg, #0c2333 0%, #123854 50%, #007cd8 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 30px 48px;
  }
  section.live-demo h1 {
    color: #ffffff;
    font-size: 38px;
    border: none;
    margin-bottom: 8px;
  }
  section.live-demo h2 {
    color: #7dd3fc;
    font-size: 20px;
    border: none;
    margin-bottom: 14px;
    padding: 0;
  }
  .url-box {
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
  .grid-tech {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-top: 14px;
    width: 100%;
    max-width: 920px;
  }
  .grid-tech div {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 13px;
    color: #f1f5f9;
    font-weight: 600;
  }
  .credentials-box {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 10px 20px;
    margin-top: 14px;
    font-size: 14px;
    color: #e0f2fe;
  }
  .credentials-box code {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
  table.comp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-top: 10px;
  }
  table.comp-table th {
    background: #123854;
    color: #ffffff;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
  }
  table.comp-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }
  table.comp-table tr:nth-child(even) {
    background: #f8fafc;
  }
---

<!-- _class: lead -->
<!-- _paginate: false -->
# 🏛️ Empório Henz
### Plataforma Digital de Móveis · **Apresentação Parcial 1**

**Engenharia de Software** · Apresentação de Entrega e Avaliação da Parcial 1

**Equipe:** João Camilo Mallmann · Luiz Postal · Cauã Primon · Airton Costa Junior

---

## Vitrine Digital · <span>Fidelidade aos Protótipos do Figma</span>

![center width:980px](../prints/parcial1/01-home.png)

**Interface Web:** Vue 3 + Tailwind CSS v4, identidade visual refinada e homenagem aos 50 anos de história.

---

## Página Institucional · <span>Homenagem aos 50 Anos e a Reconstrução</span>

![center width:980px](../prints/parcial1/02-sobre-a-loja.png)

**História de Superação:** Trajetória da família Henz pós-enchente histórica no Vale do Taquari.

---

## Autenticação Segura · <span>Login com Argon2id e Feedback Visual de Erro</span>

<div class="grid-2">
<div>

![width:560px](../prints/parcial1/03-login.png)
<div class="caption">1. Formulário de login com validação reativa.</div>

</div>
<div>

![width:560px](../prints/parcial1/04-login-erro.png)
<div class="caption">2. Tratamento amigável de credenciais inválidas (HTTP 401).</div>

</div>
</div>

**Segurança:** Hash nativo do runtime Bun e middleware de proteção Bearer JWT.

---

## Gestão de Sessão · <span>Autocadastro de Clientes e Store Pinia Ativa</span>

<div class="grid-2">
<div>

![width:560px](../prints/parcial1/05-cadastro.png)
<div class="caption">1. Cadastro com máscara dinâmica (51) 99999-9999.</div>

</div>
<div>

![width:560px](../prints/parcial1/06-home-autenticada.png)
<div class="caption">2. Home autenticada reconhecendo o usuário via Pinia.</div>

</div>
</div>

**Persistência:** Inserção simultânea em `users` e `clients` e Bearer JWT em `localStorage`.

---

## Rápido Sumário no Meio · <span>Painel Administrativo & Os Dois CRUDs</span>

<div class="grid-2-asym">
<div>

![width:560px](../prints/parcial1/08-admin.png)
<div class="caption">Painel Administrativo: Hub central dividindo a gestão operacional.</div>

</div>
<div>

<span class="tag tag-accent">Sumário da Demonstração</span>

### Gestão Operacional no PostgreSQL 16

* **Módulo 1 · Usuários & Clientes (CRUD 1):**
  * Tabela `users` & `clients` com papéis de acesso.
  * Autonomia de cadastro, edição e **Soft Delete**.
* **Módulo 2 · Fornecedores & Marcas (CRUD 2):**
  * Tabela `suppliers` com dados comerciais.
  * Notificações toast instantâneas e integridade referencial.
* **RNF08 Estrito:** Exclusão lógica (`deleted_at`) em ambos.

</div>
</div>

---

<!-- _class: divider -->
<!-- _paginate: false -->

<span class="tag tag-accent">SEÇÃO 01 · INÍCIO DO CRUD 1</span>

# CRUD 1: Gestão de Usuários & Clientes
## Início da Demonstração · Criação, Leitura, Edição e Desativação Lógica

<div class="grid-2">
<div class="op-card">

* **[C] Create:** Cadastro de novos clientes e colaboradores com perfil de acesso e validação de senha forte.
* **[R] Read:** Listagem reativa com paginação e busca instantânea com debounce por nome e e-mail.

</div>
<div class="op-card">

* **[U] Update:** Atualização de contatos, cidade e permissões cadastrais.
* **[D] Delete:** **Soft Delete (RNF08)** via `deleted_at = CURRENT_TIMESTAMP` com índice parcial único.

</div>
</div>

---

## CRUD 1 em Ação · <span>Cadastro de Usuário e Inclusão Imediata no Banco</span>

<div class="grid-2">
<div>

![width:560px](../prints/parcial1/crud/usuarios/03-novo-preenchido.png)
<div class="caption">1. Formulário preenchido com validação de senha forte (POST /api/clientes).</div>

</div>
<div>

![width:560px](../prints/parcial1/crud/usuarios/04-lista-apos-cadastro.png)
<div class="caption">2. Novo usuário persistido na listagem em tempo real (Ana Teste Parcial).</div>

</div>
</div>

**Persistência no PostgreSQL 16:** A listagem reflete o novo registro imediatamente sem reload da página.

---

## CRUD 1 Gestão · <span>Edição Cadastral e Exclusão Lógica (Soft Delete)</span>

<div class="grid-2">
<div>

![width:560px](../prints/parcial1/crud/usuarios/05-editar.png)
<div class="caption">1. Modal de edição de dados cadastrais (telefone, cidade e permissão).</div>

</div>
<div>

![width:560px](../prints/parcial1/crud/usuarios/07-modal-desativar.png)
<div class="caption">2. Modal de confirmação de exclusão lógica (Soft Delete).</div>

</div>
</div>

**Soft Delete (RNF08):** O endpoint `DELETE` inativa o registro sem apagar histórico; índice parcial único permite reuso futuro.

---

<!-- _class: divider -->
<!-- _paginate: false -->

<span class="tag tag-success">✓ CRUD 1 CONCLUÍDO</span> &nbsp; <span class="tag tag-accent">SEÇÃO 02 · INÍCIO DO CRUD 2</span>

# CRUD 2: Fornecedores & Fábricas Parceiras
## Início da Demonstração · Cadastro com Toast, Listagem Ativa e Integridade

<div class="grid-2">
<div class="op-card">

* **[C] Create:** Cadastro de marcas e indústrias parceiras com notificação toast instantânea (`vue3-toastify`).
* **[R] Read:** Listagem de marcas ativas com contatos comerciais e status operacional em tempo real.

</div>
<div class="op-card">

* **[U] Update:** Atualização de canais de atendimento, representantes e razão social da fábrica.
* **[D] Delete:** **Soft Delete** preservando chaves estrangeiras (`supplier_id`) no mostruário de produtos.

</div>
</div>

---

## CRUD 2 em Ação · <span>Cadastro de Marca Parceira com Toast em Tempo Real</span>

<div class="grid-2">
<div>

![width:560px](../prints/parcial1/crud/fornecedores/03-novo-preenchido.png)
<div class="caption">1. Formulário de cadastro preenchido com dados da fábrica parceira.</div>

</div>
<div>

![width:560px](../prints/parcial1/crud/fornecedores/04-lista-apos-cadastro.png)
<div class="caption">2. Fornecedor persistido na tabela com notificação toast verde de sucesso.</div>

</div>
</div>

**Reatividade:** Feedback visual verde via `vue3-toastify` e persistência imediata no PostgreSQL 16.

---

## CRUD 2 Gestão · <span>Edição Comercial e Integridade Referencial</span>

<div class="grid-2">
<div>

![width:560px](../prints/parcial1/crud/fornecedores/05-editar.png)
<div class="caption">1. Edição de contatos comerciais, representantes e dados da marca.</div>

</div>
<div>

![width:560px](../prints/parcial1/crud/fornecedores/07-modal-desativar.png)
<div class="caption">2. Modal de confirmação de desativação lógica sem afetar produtos vinculados.</div>

</div>
</div>

**Integridade Referencial:** Inativação lógica (`deleted_at`) que impede a quebra de chaves estrangeiras no mostruário.

---

## Síntese dos CRUDs · <span>100% de Conformidade com o Edital e Requisitos</span>

<table class="comp-table">
  <thead>
    <tr>
      <th>Critério / Recurso</th>
      <th>CRUD 1: Usuários & Clientes</th>
      <th>CRUD 2: Fornecedores & Marcas</th>
      <th>Status Parcial 1</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Persistência Relacional</b></td>
      <td>Tabelas <code>users</code> e <code>clients</code></td>
      <td>Tabela <code>suppliers</code></td>
      <td>✅ Persistente no PostgreSQL 16</td>
    </tr>
    <tr>
      <td><b>Operações C-R-U-D</b></td>
      <td>Create, Read, Update, Delete</td>
      <td>Create, Read, Update, Delete</td>
      <td>✅ 100% Operacional</td>
    </tr>
    <tr>
      <td><b>Soft Delete (RNF08)</b></td>
      <td><code>deleted_at</code> + Índice Parcial Único</td>
      <td><code>deleted_at</code> + Preservação de FK</td>
      <td>✅ Em Conformidade</td>
    </tr>
    <tr>
      <td><b>Feedback Visual na UI</b></td>
      <td>Atualização reativa em tempo real</td>
      <td>Notificação Toast (<code>vue3-toastify</code>)</td>
      <td>✅ Testado e Validado</td>
    </tr>
    <tr>
      <td><b>Segurança / Acesso</b></td>
      <td>Argon2id + Validação de Senha Forte</td>
      <td>Controle de contatos comerciais</td>
      <td>✅ Implementado</td>
    </tr>
  </tbody>
</table>

<div class="info-box">
<p><b>Transição da Apresentação:</b> Com ambos os CRUDs validados de ponta a ponta no banco de dados e na interface, apresentamos a governança e a engenharia de processo do projeto.</p>
</div>

---

## Metodologia de Trabalho · <span>Database First e Gestão Nominal de Tarefas</span>

<div class="grid-2">
<div>

![width:560px](../prints/parcial1/27-github-kanban-task.png)
<div class="caption">Quadro Kanban da Sprint no GitHub Projects.</div>

</div>
<div>

![width:560px](../prints/parcial1/24-issue-github.png)
<div class="caption">Issue formal com critérios de aceitação e camada técnica.</div>

</div>
</div>

**Divisão Nominal:** João Camilo (Full Stack/Docker), Luiz Postal (DER/PRD), Cauã Primon (Domínio/Testes), Airton Junior (QA/PRs).

---

## Governança do Código · <span>GitFlow com Mais de 50 Pull Requests Revisados</span>

<div class="grid-2">
<div>

![width:560px](../prints/parcial1/16-github-commits.png)
<div class="caption">Histórico de Conventional Commits (feat:, fix:).</div>

</div>
<div>

![width:560px](../prints/parcial1/19-github-network.png)
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

<!-- _class: live-demo -->
<!-- _paginate: false -->

<span class="tag-cherry">🍒 CEREJA DO BOLO · AMBIENTE REAL DE PRODUÇÃO</span>

# 🌐 Venha Ver Ao Vivo na Nossa VPS!
### Convidamos o Professor e a Banca para Testarem Agora em Tempo Real

<div class="url-box">
http://177.44.248.90/
</div>

<p style="font-size: 17px; color: #e0f2fe; margin-top: 10px; max-width: 860px; line-height: 1.5;">
Tudo o que apresentamos não ficou apenas em ambiente local: nossa plataforma inteira está <b>compilada, implantada e operando ao vivo</b> na VPS pública na nuvem! Podem acessar pelo navegador ou smartphone agora mesmo.
</p>

<div class="grid-tech">
<div>🐳 Docker Compose Produção</div>
<div>🌐 Nginx Proxy Reverso (Porta 80)</div>
<div>🐘 PostgreSQL 16 Nativo</div>
<div>⚡ Bun Nativo + Vue 3 SPA</div>
</div>

<div class="credentials-box">
🔑 <b>Acesso Admin Pré-Cadastrado:</b> <code>admin@gmail.com</code> &nbsp;|&nbsp; <b>Senha:</b> <code>admin123</code>
</div>

---

## Lições Aprendidas · <span>Desafios Reais de Infraestrutura, Segurança e Governança</span>

<div class="grid-2">
<div>

### 1. Esforço Documental ("Documental Caro")
* Manter PRD, DER, issues no GitHub e código real rigorosamente alinhados demandou alto tempo e esforço.
* **Aprendizado:** Garantiu rastreabilidade total: tudo o que foi planejado foi implementado sem retrabalho.

### 2. Docker e Subir para a VM
* Dificuldade de testar na VM remota e separar com precisão os ambientes de **desenvolvimento** (Live-Reload) e de **produção** (Nginx proxy reverso).
* **Aprendizado:** Setup estabilizado em um único comando via `docker-compose.yml`.

</div>
<div>

### 3. Codificação e Detalhes de Segurança
* Ajustes minuciosos que parecem simples na teoria ("problemas bobos"), mas foram trabalhosos de alinhar:
* Expiração de JWT, variáveis de ambiente seguras, isolamento de rede do PostgreSQL na VPS (sem expor portas) e CORS.

### 4. Backend Bun Nativo vs. Framework
* Escolha de usar Bun nativo puro (`Bun.serve`) sem Express ou Nest deu altíssima performance e controle.
* **Reflexão:** Exigiu criar roteamento e validações na mão. Um framework talvez pudesse ter agilizado a entrega inicial.

</div>
</div>

---

<!-- _class: lead -->
# Obrigado!
### Espaço Aberto para Perguntas da Banca (5 Minutos)

**Empório Henz:** João Camilo · Luiz Postal · Cauã Primon · Airton Junior

🌐 **Sistema Operando:** `http://177.44.248.90/`  
📁 **Repositório:** `site-emporio-henz`
