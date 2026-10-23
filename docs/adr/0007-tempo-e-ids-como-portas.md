# ADR 0007: tempo e ids como portas

- Status: aceito
- Data: 2026-10-23

## Contexto

A revisão espaçada depende de datas ("volte em 3 dias"), e cada entidade nova
precisa de um id. Chamar `new Date()` ou `randomUUID()` dentro dos casos de uso
deixaria os testes imprevisíveis e lentos (seria preciso esperar o tempo
passar).

## Decisão

- `Clock` (`now()`) e `IdGenerator` (`next()`) são portas em
  `application/ports`.
- Em produção: `SystemClock` e `UuidIdGenerator` (UUID do `node:crypto`).
- Nos testes: `FixedClock`, que só avança quando o teste manda
  (`advanceDays`), e `SequentialIdGenerator` (`id-1`, `id-2`…).
- O domínio não chama o relógio: recebe `now` como parâmetro.

## Consequências

- Testes de semanas de estudo rodam em milissegundos e sempre dão o mesmo
  resultado.
- Os casos de uso recebem duas dependências a mais no construtor.
