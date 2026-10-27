# ADR 0013: testes de contrato com Testcontainers

- Status: aceito
- Data: 2026-10-27

## Contexto

Os casos de uso são testados com repositórios em memória. Para confiar nesses
testes em produção, é preciso garantir que o adaptador Postgres se comporta
igual ao de memória, testando contra um Postgres real, sem depender do banco
de desenvolvimento.

## Decisão

- **Testes de contrato:** uma única suíte (`tests/support/contracts/`) descreve
  o comportamento das portas `DeckRepository` e `CardRepository` e roda contra
  os dois adaptadores.
- **Testcontainers:** um `globalSetup` do Vitest sobe um Postgres
  `postgres:18-alpine` (a mesma imagem do Compose), aplica as migrações reais e
  entrega a URL aos testes; as tabelas são esvaziadas antes de cada teste e o
  contêiner é descartado no fim.
- **Dois projetos no Vitest:** `fast` (unitários e HTTP em memória, sem Docker)
  e `postgres` (adaptadores, transações e API completa no banco), com arquivos
  executados em sequência por compartilharem o banco.
- Scripts: `pnpm test` (tudo), `pnpm test:fast` e `pnpm test:watch` (só os
  rápidos).

## Consequências

- Se os dois adaptadores passam no contrato, são intercambiáveis, e os testes
  rápidos dos casos de uso valem também para o Postgres.
- `pnpm test` precisa de Docker; o CI (etapa 4) também.
- Scripts de instalação opcionais das dependências do Testcontainers
  (`ssh2`, `cpu-features`, `protobufjs`) ficam negados no `pnpm-workspace.yaml`.
