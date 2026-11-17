# Frontend — Empório Henz

Aplicação web do Empório Henz construída com Vue 3, Vite, Tailwind CSS v4, Vue Router e Pinia.

## Requisitos

- Bun
- API do back-end em execução

## Configuração

O Vite lê as variáveis no diretório raiz do repositório. Para desenvolvimento, defina o destino do proxy da API:

```dotenv
VITE_API_URL=http://localhost:3001
```

As chamadas à API usam `/api/v1` na mesma origem do frontend; o proxy do Vite encaminha `/api` para `VITE_API_URL` (padrão `http://localhost:3001`). Em produção, configure o proxy reverso do servidor para encaminhar `/api` ao backend.

## Executar

```bash
cd frontend
bun install
bun run dev
```

Inicia em `http://localhost:3000`.

## Scripts

```bash
bun run dev          # servidor Vite
bun run check-types  # valida tipos Vue e TypeScript
bun run lint         # executa o ESLint
bun run build        # gera a aplicação em dist/
bun run preview      # serve o build localmente
```

## Estrutura

- `src/api/`: integração com a API
- `src/components/`: componentes reutilizáveis
- `src/router/`: rotas e guards
- `src/stores/`: estado global
- `src/views/`: páginas da aplicação
- `public/`: arquivos estáticos

Consulte a [documentação técnica do front-end](../docs/frontend/README.md) e o [design system](../docs/frontend/design-system-cores.md).
