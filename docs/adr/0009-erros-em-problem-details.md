# ADR 0009: erros em Problem Details (RFC 9457)

- Status: aceito
- Data: 2026-10-26

## Contexto

Os clientes da API precisam tratar erros de forma previsível. Cada rota
inventar seu formato de erro obriga quem consome a API a tratar casos
diferentes, e erros inesperados podem vazar detalhes internos.

## Decisão

Todo erro responde com `application/problem+json` no formato da RFC 9457:
`type` (`about:blank`), `title`, `status`, `detail` e `instance`, mais duas
extensões: `code`, estável para programas, e `errors`, com os campos que
falharam na validação. Um único error handler traduz:

| Erro | Status |
| --- | --- |
| Validação do schema | 400 (`VALIDATION_FAILED`) |
| `DomainError` | 400 |
| `NotFoundError` | 404 |
| `UnauthorizedError` | 401 |
| Rota inexistente | 404 (`ROUTE_NOT_FOUND`) |
| Qualquer outro | 500 (`INTERNAL_ERROR`), sem a mensagem original |

## Consequências

- O domínio e os casos de uso não conhecem HTTP: lançam erros com nome, e o
  balcão traduz.
- Só erros 500 são registrados como erro no log; 4xx são engano do cliente.
- Regras de negócio quebradas usam 400. O 422 (conteúdo bem formado, mas
  inválido) seria uma alternativa; ficou 400 pela simplicidade.
