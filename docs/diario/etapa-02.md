# Etapa 2: API HTTP

Data: 2026-10-26 · Branch: `etapa-02-api-http`

## O que foi construído

A porta de entrada do Cardumy: o mundo agora usa a cozinha da etapa 1 pela
internet.

- CRUD completo na cozinha: 11 casos de uso, com a checagem de dono
  (`ownership.ts`) e as respostas (`views.ts`) num lugar só.
- Fábrica do módulo (`createStudyUseCases`) e composition root
  (`infra/container.ts`), o único lugar que escolhe os plugues.
- 11 rotas Fastify (decks, cards, revisão, cards do dia) com schemas TypeBox.
- Erros no padrão Problem Details (RFC 9457), com `code` estável.
- Identificação provisória pelo cabeçalho `x-user-id`.
- Documentação OpenAPI 3.1 com Swagger UI em `/docs`.
- 108 testes, incluindo rotas via `fastify.inject()`.

## Conceitos, em poucas palavras

**API HTTP.** O balcão do restaurante: recebe o pedido, confere, passa para a
cozinha e devolve a resposta. Na arquitetura hexagonal, é um adaptador de
entrada. A cozinha não mudou nada.

**Verbos e códigos.** `POST` cria, `GET` lê, `PATCH` altera, `DELETE` apaga.
`200` ok, `201` criado, `204` feito sem corpo, `400` pedido errado, `401` não
sei quem é você, `404` não encontrado, `500` erro nosso.

**Validação em duas camadas.** O schema confere o formato (o raio-X do
aeroporto: veio um texto?). O domínio confere a regra (a imigração: o nome
pode ser vazio?). Cada uma no seu lugar.

**Um schema, três trabalhos.** O mesmo TypeBox valida o pedido, ensina os tipos
ao TypeScript e gera a documentação. A documentação não tem como mentir.

**Problem Details.** Toda reclamação no mesmo formulário: `type`, `title`,
`status`, `detail`, `instance` e o nosso `code`. A cozinha lança erros com
nome; o balcão traduz para códigos HTTP. Erro 500 nunca revela a mensagem
original.

**Composition root.** O único lugar que decide qual plugue vai em qual tomada.
Os testes entregam outro container (relógio parado, ids previsíveis).

**Plugins do Fastify.** Salas separadas: o pedido de identificação vale dentro
da sala das rotas de estudo; o `/health` e o `/docs`, fora dela, são públicos.
Plugins carregam em fila, por isso a documentação é registrada antes das rotas.

**Pirâmide de testes.** Muitos testes rápidos da cozinha (unitários) e menos
testes do balcão ligado à cozinha (integração, mais lentos).

## Decisões

- Cabeçalho provisório `x-user-id`, só no balcão
  ([ADR 0008](../adr/0008-identificacao-provisoria-por-cabecalho.md)).
- Erros em Problem Details
  ([ADR 0009](../adr/0009-erros-em-problem-details.md)).
- Schemas HTTP validam formato; regras de negócio ficam no domínio
  ([ADR 0010](../adr/0010-schemas-http-como-fonte-unica.md)).
- Cards com dois endereços: criados e listados em `/decks/:deckId/cards`,
  depois acessados por `/cards/:cardId` (consequência do ADR 0005).
- Casos de uso devolvem o recurso completo (`DeckView`, `CardView`).
- Limite de paginação (`limit` até 100) é regra do balcão, fica no schema.

## Tropeços do caminho

- O `sed` do macOS não entende `\b`; a troca nos testes foi feita com `perl`.
- O ESLint barrou um `String(...)` que podia virar `[object Object]`.
- Documentar o `204` como nulo fez o TypeScript exigir `send(null)`.

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Liga a API em `http://localhost:3000` |
| abrir `http://localhost:3000/docs` | Documentação; use **Authorize** com o seu usuário |
| `curl localhost:3000/decks -H 'x-user-id: alexandre'` | Lista os seus decks |
| `pnpm test` | Roda os 108 testes |

## Como eu explicaria numa entrevista

> "Expus o núcleo do produto como uma API REST com Fastify, sem mudar nenhuma
> regra de negócio: as rotas são adaptadores de entrada que só traduzem HTTP
> para casos de uso. Uso schemas TypeBox como fonte única: eles validam o
> formato dos pedidos, geram os tipos do TypeScript e a documentação OpenAPI,
> então a documentação nunca fica desatualizada. As regras continuam no
> domínio. Todos os erros seguem o padrão Problem Details, da RFC 9457, com um
> código estável para os clientes, e erros inesperados nunca vazam detalhes.
> Testo as rotas com `fastify.inject()`, sem abrir porta, e um composition root
> deixa trocar os adaptadores sem tocar no resto."
