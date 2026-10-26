# ADR 0010: schemas HTTP como fonte única de formato

- Status: aceito
- Data: 2026-10-26

## Contexto

Uma API precisa validar pedidos, ter tipos no código e documentação. Escritos
separadamente, os três se desencontram. Também era preciso decidir onde ficam
os limites: no schema HTTP ou no domínio.

## Decisão

- Cada rota declara schemas TypeBox (`params`, `querystring`, `body`,
  `response`). Com o `@fastify/type-provider-typebox`, o mesmo schema valida o
  pedido, tipa `request` e alimenta o OpenAPI (`@fastify/swagger`, UI em
  `/docs`).
- O schema confere **formato** (tipo, campos obrigatórios, valores de uma
  lista). **Regras de negócio** (nome de 1 a 100 caracteres) ficam nos objetos
  de valor do domínio, para valerem em qualquer porta de entrada (HTTP, MCP,
  workers).
- Limites que são do balcão, como o `limit` máximo de 100 na paginação, ficam
  no schema.
- A lista de notas da revisão vem do domínio (`RATINGS`), para existir em um
  lugar só.
- Respostas também têm schema, o que filtra campos e acelera a serialização.

## Consequências

- A documentação não tem como ficar desatualizada em relação à validação.
- Os limites de tamanho aparecem nas descrições dos campos, mas são conferidos
  pelo domínio (a documentação mostra o texto, não um `maxLength`).
