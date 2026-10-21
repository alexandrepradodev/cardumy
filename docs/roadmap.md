# Roteiro de estudo: base backend do Cardumy

Cada etapa termina com código rodando, testes verdes, nota em `docs/diario/`
e PR aberto. Os temas numerados estão no fim do arquivo.

Status: `[ ]` não começou · `[~]` em andamento · `[x]` concluída

| Status | Etapa | O que se aprende | Critério de pronto | Temas |
| --- | --- | --- | --- | --- |
| [x] | 0. Fundação | Projeto TypeScript, lint, scripts, Docker Compose | Fastify com `GET /health`, Postgres e Redis via `docker compose up`, `pnpm test` rodando | 8 |
| [ ] | 1. Domínio hexagonal | Entidades, value objects, agregados, casos de uso, ports e adapters | Deck, Card e revisão (FSRS simplificado) com repositórios em memória e testes unitários no Vitest | 1, 7 |
| [ ] | 2. API HTTP | Rotas Fastify, schemas TypeBox, erros padronizados, OpenAPI | CRUD de decks e cards, Swagger em `/docs`, testes com `fastify.inject()` | 6, 7 |
| [ ] | 3. Persistência | Adapter de banco, migrações, transações, testes de integração, storage de objetos, URL pré-assinada | Repositórios Postgres com Drizzle, testes com Testcontainers, autenticação simples por JWT, upload de imagens no R2 via porta `FileStorage` (MinIO local) | 1, 7 |
| [ ] | 4. Docker e CI | Dockerfile multi-stage, pipeline de PR | Imagem da API; GitHub Actions rodando lint e testes em todo PR | 8 |
| [ ] | 5. Observabilidade | Logs estruturados, métricas, tracing distribuído | Pino com request id, `/metrics` para Prometheus, OpenTelemetry com Grafana e Jaeger no Compose | 2 |
| [ ] | 6. Eventos | Eventos de domínio, outbox, filas, retry com backoff, dead-letter queue | `CardReviewed` e `DeckCreated` publicados via outbox e consumidos por workers BullMQ; e-mails (boas-vindas, lembrete de revisão) enviados por worker via Resend, com Mailpit local | 4, 5 |
| [ ] | 7. Webhooks | Assinatura HMAC, janela de tempo, idempotência, entrega confiável | Webhooks de pagamento e de status de e-mail do Resend recebidos e verificados; webhooks assinados disparados com log de entregas e retries | 3, 5 |
| [ ] | 8. Resiliência | Idempotency-Key, rate limiting, circuit breaker | `@fastify/rate-limit` com Redis por plano, Idempotency-Key em POSTs, circuit breaker nas chamadas externas | 5 |
| [ ] | 9. IA | Streaming SSE, chamada a LLM, protocolo MCP | Geração de cards a partir de texto via SSE (limite do plano grátis) e MCP server expondo decks e cards | 9 |
| [ ] | 10. Deploy | Deploy contínuo, IaC, ambientes, OIDC, controle de custo | App no ar no Railway com deploy a cada merge; AWS sob demanda via Terraform (ECS Fargate, RDS, ElastiCache, ECR) com alerta de orçamento, subida pelo Actions e `terraform destroy` no mesmo dia | 8 |

Etapa bônus (opcional): adapter RabbitMQ para o `EventBus`, com exchange e DLX
nativos, provando que a troca não toca no domínio.

## Temas

1. Arquitetura hexagonal com DDD tático
2. Observabilidade: Pino, Prometheus, OpenTelemetry
3. Webhooks: receber com assinatura e idempotência, e disparar
4. Event-driven: publicar e consumir eventos com retries e DLQ
5. Sistemas distribuídos: idempotência, retry com backoff, circuit breaker, rate limiting
6. Validação e documentação: TypeBox + Swagger
7. Testes: Vitest, `fastify.inject()`, Testcontainers
8. Docker, CI/CD e IaC: GitHub Actions, Railway e Terraform na AWS
9. IA: endpoint com streaming SSE e MCP server

## Hospedagem e custo

O Cardumy fica no ar no Railway (barato, API + worker + Postgres + Redis).
A AWS é usada sob demanda para estudo: o Terraform sobe tudo, grava-se a demo
e roda-se `terraform destroy` no mesmo dia. Um alerta do AWS Budgets é criado
antes de qualquer recurso. Load balancer, NAT Gateway, RDS e ElastiCache
cobram por hora, por isso nada fica ligado.
