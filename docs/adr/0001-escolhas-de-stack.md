# ADR 0001: escolhas de stack da base backend

- Status: proposto
- Data: 2026-10-21

## Contexto

O Cardumy é projeto de portfólio e de estudo. A base precisa cobrir os temas
pedidos em vagas fullstack sem virar uma coleção de tecnologias soltas. Quatro
escolhas estavam em aberto.

## Decisões

1. **Filas: BullMQ** (em vez de RabbitMQ). Roda sobre o Redis que já usamos no
   rate limit, e traz retries com backoff e fila de falhas prontos. A fila fica
   atrás da porta `EventBus`, então um adapter RabbitMQ pode entrar depois.
2. **Schemas: TypeBox** (em vez de Zod). Gera JSON Schema, formato nativo do
   Fastify: validação com Ajv, tipos TypeScript e Swagger sem conversão.
3. **IaC: Terraform** (em vez de CDK). Mais pedido em vagas, multi-nuvem, e o
   estado explícito ensina bem como IaC funciona.
4. **Hospedagem: Railway contínuo + AWS sob demanda.** O app fica no Railway
   (custo baixo, processos sempre ligados para os workers). A AWS com Terraform
   é estudada subindo e destruindo o ambiente no mesmo dia, com alerta de
   orçamento. Vercel foi descartada: é serverless e não sustenta workers.
5. **Arquivos: Cloudflare R2** pela API compatível com S3, atrás da porta
   `FileStorage`. Plano grátis e sem custo de saída de dados; MinIO no
   Docker Compose para desenvolvimento local; na etapa AWS vira S3 só por
   configuração. Uploads por URL pré-assinada, sem passar pela API.
6. **E-mail: Resend**, atrás da porta `EmailSender`, sempre enviado por
   worker (nunca dentro da requisição). Mailpit no Docker Compose para ver os
   e-mails localmente. Os webhooks de entrega e bounce do Resend servem de
   caso real na etapa de webhooks.
7. **Monólito modular** (em vez de microsserviços). Um código, um banco e dois
   processos (`api` e `worker`). Módulos por contexto (`study`, `accounts`,
   `ai`, `notifications`) só conversam por eventos ou interfaces públicas.
   Microsserviços trariam rede, deploy e consistência distribuída sem ganho
   para um time de uma pessoa; as fronteiras permitem extrair um módulo depois.
8. **IA: SSE e MCP**, nessa ordem. O SSE entrega uma função do MVP (gerar cards
   a partir de texto). O MCP server reaproveita os mesmos casos de uso como mais
   um adapter de entrada.

## Consequências

- Exchanges, roteamento e DLX do RabbitMQ ficam para uma etapa bônus.
- O frontend, quando vier, pode usar Zod sem conflito com o backend.
- A etapa de AWS tem custo por hora; o ambiente é destruído após a demo,
  e o Railway mantém o app no ar para o portfólio.
