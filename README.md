# Cardumy

API do Cardumy, um SaaS de estudos com flashcards, revisão espaçada e geração
de cards por IA.

Este repositório também é um projeto de estudo: cada parte da base backend foi
construída em etapas, documentadas em [`docs/roadmap.md`](docs/roadmap.md),
com notas de aprendizado em [`docs/diario/`](docs/diario/) e decisões de
arquitetura em [`docs/adr/`](docs/adr/).

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
