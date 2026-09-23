# Guia Operacional de Backup e Restauração — PostgreSQL

Este guia documenta o procedimento de salvaguarda e recuperação de dados do banco de dados PostgreSQL do Portal Empório Henz rodando em container Docker.

---

## 1. Backup Manual

Para gerar um backup pontual do banco de dados em formato compactado (`.sql.gz`), execute o script na raiz do projeto:

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

- O arquivo gerado será armazenado no diretório `backups/` com a seguinte convenção:
  `backups/backup_<nome_do_banco>_<YYYY-MM-DD_HHMMSS>.sql.gz`
- O script remove automaticamente backups com mais de **30 dias** de idade para preservar o espaço em disco da VM.

---

## 2. Restauração de Backup

Para restaurar um backup existente em caso de falha ou recuperação de desastres:

1. Certifique-se de que o container do PostgreSQL está ativo (`docker compose up -d postgres`).
2. Execute o script de restauração indicando o caminho do arquivo de backup:

```bash
chmod +x scripts/restore.sh
./scripts/restore.sh backups/backup_emporio_henz_2026-09-13_120000.sql.gz
```

3. O script solicitará a confirmação digitando `sim`. Para execução não-interativa (ex.: scripts de automação), passe a flag `--force`:

```bash
./scripts/restore.sh backups/backup_emporio_henz_2026-09-13_120000.sql.gz --force
```

---

## 3. Agendamento Automático via Cron na VM

Para garantir rotina diária de backups sem intervenção manual, configure o `cron` do Linux na VM host:

1. Abra o editor de tarefas agendadas:

   ```bash
   crontab -e
   ```

2. Adicione a linha abaixo para executar o backup todos os dias às **03:00 da madrugada**:
   ```cron
   0 3 * * * /caminho/completo/site-emporio-henz/scripts/backup.sh >> /var/log/emporio-backup.log 2>&1
   ```

---

## 4. Salvaguarda Externa (Recomendação de Boas Práticas)

Para proteger os dados contra falhas físicas na VM, recomenda-se sincronizar periodicamente o diretório `backups/` com um armazenamento remoto em nuvem (ex.: AWS S3, Google Cloud Storage ou rsync para outra máquina):

```bash
# Exemplo utilizando AWS CLI para sincronizar com S3
aws s3 sync /caminho/completo/site-emporio-henz/backups s3://emporio-henz-backups/database/
```
