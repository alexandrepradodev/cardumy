# ADR 0012: transações pela porta `TransactionRunner`

- Status: aceito
- Data: 2026-10-27

## Contexto

Como cada card é seu próprio agregado (ADR 0005), apagar um deck exige apagar
os cards e depois o deck. Se o processo cair entre as duas operações, o deck
fica pela metade. Era preciso "tudo ou nada" sem que o caso de uso conhecesse
o banco.

## Opções consideradas

- **`ON DELETE CASCADE` no banco:** mais simples, mas a regra fica escondida
  no banco e o adaptador em memória precisaria imitá-la.
- **Porta `TransactionRunner`:** o caso de uso declara o que é atômico.

## Decisão

Porta `TransactionRunner.run(work)`, em `application/ports`. `work` recebe
repositórios ligados à transação. Adaptadores:

- `PostgresTransactionRunner`: `db.transaction(...)` (BEGIN/COMMIT, ROLLBACK
  se `work` lançar erro);
- `InMemoryTransactionRunner`: só executa `work`, sem atomicidade real.

`DeleteDeck` apaga cards e deck dentro de `run`.

## Consequências

- A atomicidade fica visível no caso de uso e testada no Postgres (COMMIT e
  ROLLBACK simulando uma pane no meio).
- Os testes em memória não provam atomicidade; isso é coberto pelos testes de
  integração com Postgres.
- Outros casos de uso que precisem de "tudo ou nada" reutilizam a mesma porta.
