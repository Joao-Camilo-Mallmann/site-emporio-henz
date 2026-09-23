## 1. Ajustes no Dockerfile

- [x] 1.1 Remover o estágio `migration` do `Dockerfile`
- [x] 1.2 Atualizar o comando de inicialização (`CMD`) do estágio `backend` para executar `bun run migrate` antes da API Bun
- [x] 1.3 Atualizar o comando de inicialização (`CMD`) do estágio `backend-dev` para executar `bun run migrate` antes do modo live-reload

## 2. Ajustes no Script de Deploy e Orquestração

- [x] 2.1 Atualizar `deploy.sh` removendo a etapa de container temporário `docker compose run --rm migration`
- [x] 2.2 Validar conformidade de dependências em `docker-compose.yml`

## 3. Atualização de Documentação e Validação

- [x] 3.1 Atualizar `AGENTS.md` refletindo a arquitetura de container único de backend com auto-migration
- [x] 3.2 Executar checagem de tipos (`bun run check-types`) e lint (`bun run lint`)
