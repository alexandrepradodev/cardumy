# ADR 0011: Postgres com Drizzle e migrações versionadas

- Status: aceito
- Data: 2026-10-27

## Contexto

Os dados viviam em memória e sumiam a cada reinício. A stack já previa
PostgreSQL com Drizzle (ADR 0001). Faltava decidir como organizar as tabelas,
como mudar o banco com segurança e como guardar a ficha de memória do card.

## Decisão

- **Drizzle como query builder** sobre o driver `pg`, com um pool de conexões
  por processo (`infra/database.ts`). Os repositórios recebem um `DbExecutor`
  (banco ou transação), então o mesmo código roda dentro e fora de transações.
- **Uma pasta de schema por módulo** (`modules/<m>/adapters/out/postgres/schema.ts`);
  só os adaptadores do próprio módulo leem suas tabelas (regra 5 do CLAUDE.md).
- **Migrações geradas** pelo drizzle-kit em `migrations/`, versionadas no Git e
  aplicadas por um passo separado (`pnpm db:migrate`), **não** na subida da API:
  várias réplicas subindo juntas não podem disputar a mesma migração.
- **A ficha de memória vira colunas** (`stability_days`, `difficulty`, `due_at`…)
  em vez de JSON, com o índice `(deck_id, due_at)` para os cards do dia.
- **Ids `uuid`**; ids malformados vindos da URL viram "não encontrado"
  (`isUuid`) em vez de erro 500 do Postgres.
- **Chave estrangeira sem cascade** de `cards.deck_id` para `decks.id`: apagar
  os cards de um deck é um passo explícito do caso de uso (ADR 0012).
- O domínio ganhou `restore()` em `Deck`, `Card` e `ReviewSchedule` para
  reconstruir o que foi salvo; os mappers convertem linha ↔ entidade.
- `DATABASE_URL` tem padrão local (o Postgres do Compose) só fora de produção;
  em produção é obrigatório.

## Consequências

- Os dados sobrevivem a reinícios; a troca de memória para Postgres aconteceu
  só no composition root, sem mudar casos de uso nem rotas.
- Todo ambiente (local, CI, produção) tem o mesmo schema, aplicado em ordem.
- O deploy precisa de um passo de migração antes de subir a nova versão.
