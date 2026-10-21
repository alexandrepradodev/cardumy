# Etapa 0: Fundação

Data: 2026-10-21 · Branch: `etapa-00-fundacao`

## O que foi construído

A "cozinha montada" do projeto: nada de regra de negócio ainda, mas tudo
pronto para começar a cozinhar.

- Projeto TypeScript (strict) com pnpm e Node 24.
- ESLint (qualidade) e Prettier (formatação).
- Vitest com os primeiros testes.
- API Fastify com `GET /health` e desligamento gracioso.
- Configuração lida de variáveis de ambiente e conferida ao ligar.
- Postgres 18 e Redis 8 com Docker Compose.

## Conceitos, em poucas palavras

**TypeScript strict.** O compilador é o corretor de gramática: avisa antes de
rodar que `cards[0]` pode não existir.

**ESLint e Prettier.** O ESLint é o revisor experiente: pega código que compila
mas costuma virar bug (como esquecer o `await`). O Prettier é o diagramador:
só cuida da aparência, para ninguém discutir estilo.

**Testes (AAA).** Preparar, agir, verificar. Um teste que nunca falhou pode não
estar testando nada, por isso vimos cada um falhar antes de passar.

**Montar ≠ ligar.** `buildApp()` monta a API sem abrir porta; `main-api.ts`
liga. Assim os testes conversam com a API na memória (`app.inject()`), sem rede.

**Health check (liveness).** `/health` responde "estou vivo". Ele não olha o
banco de propósito: se olhasse, um banco lento faria a plataforma reiniciar uma
API saudável.

**Desligamento gracioso.** Ao receber SIGTERM (todo deploy manda), a API termina
de atender quem já estava na fila e só então fecha. Como a loja que atende os
últimos clientes antes de baixar a porta.

**Configuração por ambiente.** A receita (código) é a mesma, o forno muda
(porta, nível de log). A config é conferida ao ligar: se vier errada, a API nem
sobe e diz o que está errado (*fail fast*).

**Docker Compose.** Contêineres são como contêineres de navio: levam tudo que o
programa precisa e funcionam igual em qualquer máquina. Volumes são a gaveta
onde os dados sobrevivem quando o contêiner é apagado.

**Redis.** A mesa de trabalho (rápida, na memória, coisas temporárias); o
Postgres é o arquivo de aço (permanente). No Cardumy, o Redis vai guardar filas
e contadores de limite.

## Decisões

- Node 24 LTS; TypeScript 6.0 porque o typescript-eslint ainda não suporta o
  TypeScript 7 ([ADR 0002](../adr/0002-ferramentas-da-fundacao.md)).
- ESLint + Prettier em vez de Biome (mesmo ADR).
- Config validada na inicialização com TypeBox
  ([ADR 0003](../adr/0003-config-validada-na-inicializacao.md)).
- `/health` só checa se o processo está vivo
  ([ADR 0004](../adr/0004-health-check-de-liveness.md)).
- Postgres exposto na porta 5433 do computador, porque a 5432 costuma estar
  ocupada por um Postgres instalado localmente.

## Tropeços do caminho

- **TypeScript 7 x typescript-eslint:** o TS 7 foi reescrito em Go e ainda não
  oferece a API que o linter usa. Voltamos para o 6.0, que tem a mesma
  linguagem.
- **pnpm 11 bloqueia scripts de instalação:** proteção contra pacotes
  maliciosos. Liberamos só o `esbuild` em `pnpm-workspace.yaml`.
- **Porta 5432 ocupada:** resolvido mapeando o contêiner para a 5433.

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Liga a API e reinicia a cada mudança |
| `pnpm test` / `pnpm test:watch` | Roda os testes uma vez / a cada mudança |
| `pnpm lint` / `pnpm format` | Confere qualidade / arruma a formatação |
| `pnpm typecheck` | Confere os tipos |
| `pnpm build && pnpm start` | Gera o JavaScript e liga em modo produção |
| `pnpm infra:up` / `pnpm infra:down` | Liga / desliga Postgres e Redis |
| `curl localhost:3000/health` | Pergunta se a API está viva |

## Como eu explicaria numa entrevista

> "Montei a base do projeto pensando em produção desde o início. TypeScript em
> modo strict e ESLint com regras que usam os tipos pegam erros antes de rodar,
> como promises sem await. Separei a criação do app Fastify da subida do
> servidor, o que permite testar as rotas na memória com `inject()`. A API tem
> um health check de liveness, que de propósito não depende do banco, e faz
> graceful shutdown no SIGTERM, para não derrubar requisições num deploy. As
> configurações vêm de variáveis de ambiente e são validadas na inicialização:
> se algo estiver errado, a API falha na hora com uma mensagem clara. Postgres
> e Redis sobem com Docker Compose, com healthchecks e volumes, então qualquer
> pessoa roda o projeto com um comando."
