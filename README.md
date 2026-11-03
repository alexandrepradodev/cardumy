# Cardumy

API do Cardumy, um SaaS de estudos com flashcards, revisão espaçada e geração
de cards por IA.

Este repositório também é um projeto de estudo: cada parte da base backend foi
construída em etapas, documentadas em [`docs/roadmap.md`](docs/roadmap.md),
com notas de aprendizado em [`docs/diario/`](docs/diario/) e decisões de
arquitetura em [`docs/adr/`](docs/adr/).

## Como rodar

Requisitos: Node 24+, pnpm e Docker.

```bash
pnpm install
cp .env.example .env   # opcional: tudo tem valor padrão
pnpm infra:up          # Postgres (5433), Redis (6379) e RustFS (9000)
pnpm db:migrate        # cria ou atualiza as tabelas do banco
pnpm dev               # API em http://localhost:3000
curl localhost:3000/health
```

A documentação interativa fica em http://localhost:3000/docs.

## Autenticação

As rotas de decks e cards exigem um access token (JWT). Para conseguir um:

```bash
curl -X POST localhost:3000/auth/register -H 'content-type: application/json' \
  -d '{"email":"ana@example.com","password":"uma-senha-longa"}'
curl -X POST localhost:3000/auth/login -H 'content-type: application/json' \
  -d '{"email":"ana@example.com","password":"uma-senha-longa"}'
# devolve { "accessToken": "...", "tokenType": "Bearer", "expiresIn": 3600 }
curl localhost:3000/decks -H 'authorization: Bearer <accessToken>'
```

No `/docs`, faça o login, copie o `accessToken` e cole no botão **Authorize**.
O token vale 1 hora. Em produção, defina `JWT_SECRET` (veja `.env.example`).

## Imagens dos cards

O arquivo não passa pela API: ela entrega uma URL pré-assinada e o cliente
envia direto para o storage (Cloudflare R2 em produção, RustFS no Compose).
São três passos, com o token do login em `TOKEN`:

```bash
# 1. pedir a URL, declarando o tipo e o tamanho exatos do arquivo
curl -X POST localhost:3000/cards/<cardId>/image/upload \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"contentType\":\"image/png\",\"sizeBytes\":$(stat -f%z foto.png)}"
# devolve { "key": "...", "url": "...", "method": "PUT", "headers": {...} }

# 2. enviar o arquivo direto para a URL, com o mesmo tipo
curl -X PUT '<url>' -H 'content-type: image/png' --data-binary @foto.png

# 3. confirmar: a API confere o arquivo no storage e prende ao card
curl -X PUT localhost:3000/cards/<cardId>/image \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"key":"<key>"}'
```

Aceita PNG, JPEG e WebP de até 5 MB. Todo card volta com `imageUrl`, um link
de download válido por 1 hora (ou `null`). `DELETE /cards/<cardId>/image`
remove a imagem. O painel do RustFS fica em http://localhost:9001 (usuário
`cardumy`, senha `cardumy-local-secret`). Em produção, defina as variáveis
`S3_*` (veja `.env.example`).

Outros scripts: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm format`,
`pnpm build && pnpm start`, `pnpm infra:down`, `pnpm test:fast` (sem Docker),
`pnpm db:generate` (nova migração), `pnpm db:studio` (ver os dados).

## Temas cobertos

Arquitetura hexagonal com DDD tático · observabilidade (Pino, Prometheus,
OpenTelemetry) · webhooks · event-driven com BullMQ · idempotência, retry,
circuit breaker e rate limiting · TypeBox + Swagger · Vitest, `fastify.inject()`
e Testcontainers · Docker, GitHub Actions e Terraform na AWS · streaming SSE
com LLM e MCP server.

## Estudando com o tutor

O repositório traz um agente tutor para o Claude Code:

- `/etapa N` inicia ou retoma uma etapa do roteiro;
- `/explica <tema>` explica um conceito sem alterar o código.

O tutor explica o conceito, implementa em passos pequenos justificando cada
decisão, roda os testes e fecha a etapa com perguntas de entrevista.
