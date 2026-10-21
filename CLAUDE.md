# Cardumy

SaaS de estudos com flashcards (revisão espaçada + geração de cards por IA).
É ao mesmo tempo **produto de portfólio** e **projeto de estudo fullstack**.

O dono do projeto, Alexandre, não escreve o código: ele estuda os conceitos e
dirige o trabalho; o Claude implementa. Por isso, todo trabalho aqui tem que
**ensinar**, não só funcionar.

## Idioma

- Converse, comente decisões e escreva docs em **português (BR)**.
- Código (nomes de variáveis, funções, arquivos) em **inglês**, como no mercado.
- Mensagens de commit em inglês, no padrão Conventional Commits.

## Como trabalhar neste repositório

- O roteiro de estudo está em `docs/roadmap.md`. Cada etapa tem objetivo,
  conceitos e critério de pronto. Não pule etapas sem o Alexandre pedir.
- Para trabalho de etapa, use o agente `tutor` (`.claude/agents/tutor.md`) ou
  o comando `/etapa N`. Para uma dúvida de conceito, `/explica <tema>`.
- Antes de codar, explique o conceito e o plano. Depois de codar, explique o
  que mudou e por quê.
- Passos pequenos: cada passo termina com testes passando.
- Ao concluir uma etapa: nota em `docs/diario/etapa-NN.md`, ADR em `docs/adr/`
  para cada decisão de arquitetura, status atualizado em `docs/roadmap.md`.

## Arquitetura (monólito modular, hexagonal + DDD tático)

Um único código e um único banco, implantado como dois processos a partir da
mesma imagem: `api` (HTTP, webhooks, MCP) e `worker` (consumidores de fila).
Por dentro, um módulo por contexto delimitado (bounded context), cada um
hexagonal:

- `study`: decks, cards e revisão espaçada (o núcleo do produto)
- `accounts`: usuários, planos e limites do plano grátis
- `ai`: geração de cards por LLM
- `notifications`: e-mails e webhooks enviados

```
src/
  modules/
    <modulo>/
      domain/        entidades, value objects, eventos de domínio
      application/   casos de uso + ports (interfaces)
      adapters/
        in/          http (Fastify), workers, webhooks, mcp
        out/         postgres, queue, llm, webhook-sender, storage (R2/S3), email (Resend)
  shared/            tipos e utilitários sem regra de negócio
  infra/             config, logger, telemetria, composição (injeção de dependências)
  main-api.ts        processo da API
  main-worker.ts     processo dos workers
tests/
  unit/              domínio e casos de uso, com adapters em memória
  integration/       rotas via fastify.inject(), banco via Testcontainers
```

Regras que não se quebram:

1. `domain/` não importa nada de fora dele: nem Fastify, nem Drizzle, nem BullMQ.
2. `application/` só depende de `domain/` e das próprias interfaces (ports).
3. Adapters implementam ports; quem liga uma coisa na outra é `infra/`.
4. Regra de negócio mora em entidade ou caso de uso, nunca em rota HTTP.
5. Um módulo não importa o interior de outro nem lê as tabelas dele: conversa
   por eventos ou pela interface pública do módulo. Assim qualquer módulo pode
   virar um serviço separado no futuro.
6. Todo comportamento novo vem com teste.

## Stack

Node 24 LTS, TypeScript 7 (strict), Fastify 5, TypeBox, PostgreSQL + Drizzle,
Redis, BullMQ, Cloudflare R2 (API S3; MinIO local), Resend (e-mail; Mailpit local), Vitest, Testcontainers, Pino, Prometheus, OpenTelemetry,
Docker Compose, GitHub Actions, Terraform (AWS). As escolhas e os motivos
estão em `docs/adr/`.

## Fora do escopo por agora

Frontend, identidade visual e mascote.
