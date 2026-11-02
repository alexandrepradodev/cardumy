# ADR 0014: kernel compartilhado em `src/shared`

- Status: aceito
- Data: 2026-11-02

## Contexto

O módulo `accounts` chegou precisando de peças que já existiam dentro de
`study`: os erros base (`DomainError`, `NotFoundError`), as portas `Clock` e
`IdGenerator` e seus adaptadores, e os tipos do Drizzle. Importar o interior
de `study` quebraria a regra 5 (um módulo não importa o interior de outro), e
copiar o código faria as duas versões divergirem com o tempo.

## Decisão

As peças sem regra de negócio passam para um **kernel compartilhado** em
`src/shared`, que todos os módulos podem importar:

- `errors.ts`: `DomainError` (400), `NotFoundError` (404) e os novos
  `ConflictError` (409) e `UnauthorizedError` (401). Cada módulo estende esses
  erros com os seus (`EmailAlreadyInUseError`, `InvalidCredentialsError`...),
  e o tradutor de Problem Details só conhece os erros base.
- `ports/` e `adapters/`: `Clock`, `IdGenerator`, `SystemClock` e
  `UuidIdGenerator`.
- `postgres.ts`: os tipos `Database`, `Transaction` e `DbExecutor` e os
  utilitários `isUuid` e `isUniqueViolation`.

## Consequências

- Os módulos continuam sem se conhecer: os dois dependem só do kernel.
- O kernel tem que ficar **pequeno e estável**, porque uma mudança nele afeta
  todos os módulos. Regra de negócio nunca entra nele.
- Um erro novo de um módulo vira a resposta HTTP certa sem mexer no tradutor,
  desde que estenda um erro base.
