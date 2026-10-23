# Etapa 1: Domínio hexagonal

Data: 2026-10-23 · Branch: `etapa-01-dominio`

## O que foi construído

O coração do Cardumy, sem Fastify e sem banco de dados:

- objetos de valor `DeckName`, `CardText`, `Rating` e `ReviewSchedule`;
- entidades `Deck` e `Card` (cada card é seu próprio agregado);
- revisão espaçada com um FSRS simplificado (`ReviewSchedule.next`);
- portas `DeckRepository`, `CardRepository`, `Clock` e `IdGenerator`;
- adaptadores em memória, relógio do sistema e gerador de UUID;
- casos de uso `CreateDeck`, `AddCard`, `ReviewCard` e `ListDueCards`;
- 63 testes, incluindo uma sessão de estudo completa com relógio parado.

## Conceitos, em poucas palavras

**Arquitetura hexagonal.** As regras ficam no centro; o mundo de fora (HTTP,
banco, testes) só conversa com elas por **portas**, usando **adaptadores**
trocáveis. Analogia: a tomada. A rede elétrica não sabe o que você vai ligar.

**Pastas.** O router vira adaptador de entrada (`adapters/in`). O service vira
casos de uso, um por ação (`application/`). O repository é partido em dois: a
promessa (porta) em `application/ports`, a implementação em `adapters/out`.
As dependências só apontam para dentro: o domínio não importa ninguém.

**DDD tático.** Organiza as regras do centro com palavras do negócio.
- **Entidade:** tem identidade (o "CPF"). Um card editado continua o mesmo card.
- **Objeto de valor:** é o próprio valor (a nota de R$ 10). Imutável e se
  confere sozinho: um `DeckName` inválido não consegue existir.
- **Agregado:** um grupo com um chefe que protege as regras (o caixa do banco).
  A data da revisão só muda por `card.review()`.

**Hexagonal + DDD.** Complementares: o hexagonal define as fronteiras (as
paredes e tomadas da casa); o DDD organiza o que está dentro (os cômodos).

**Revisão espaçada.** Revisar logo antes de esquecer. Cada card tem
estabilidade (quantos dias a memória dura) e dificuldade (1 a 10). Acertar
aumenta o intervalo; esquecer traz o card de volta em 10 minutos e o deixa
mais difícil. Lembrar algo quase esquecido fortalece mais a memória.

**Casos de uso.** O gerente do restaurante: busca, pede ao domínio, guarda.
Não contém regra de negócio, só organiza os passos.

## Decisões

- Card como agregado próprio, ligado ao deck só pelo id
  ([ADR 0005](../adr/0005-card-como-agregado-proprio.md)).
- FSRS simplificado, com constantes fixas
  ([ADR 0006](../adr/0006-fsrs-simplificado.md)).
- Tempo e ids atrás de portas (`Clock`, `IdGenerator`)
  ([ADR 0007](../adr/0007-tempo-e-ids-como-portas.md)).
- Recurso de outro usuário responde "não encontrado", para não revelar que ele
  existe.
- Casos de uso devolvem dados simples (`DueCardView`), nunca entidades.
- Repositórios devolvem `Promise` desde já, no formato do banco real.

## Tropeços do caminho

- O teste da sessão de estudo falhou duas vezes por expectativas erradas
  minhas, não do código. Resolvido simulando as datas exatas antes de
  escrever a expectativa.
- O Prettier reformatou o `review-schedule.ts`, e o ESLint sugeriu `?.` nas
  checagens de dono (`!deck?.isOwnedBy(...)`).

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `pnpm test` | Roda os 63 testes |
| `pnpm test:watch` | Roda os testes a cada mudança |
| `pnpm typecheck` | Mostra, por exemplo, quando um adaptador não cumpre a porta |

## Como eu explicaria numa entrevista

> "Construí o núcleo do produto antes de escolher framework ou banco. Com
> arquitetura hexagonal, as regras ficam no centro e falam com o mundo por
> portas: repositórios, relógio e gerador de ids. Nos testes, uso adaptadores
> em memória e um relógio parado, então testo a revisão espaçada em
> milissegundos. Com DDD, modelei `Deck` e `Card` como entidades, e nome, texto,
> nota e agendamento como objetos de valor imutáveis que se validam sozinhos.
> Cada card é seu próprio agregado: revisar um card não carrega o deck inteiro,
> o que deixa a ação mais comum leve e evita conflitos. Os casos de uso só
> orquestram, a regra mora no domínio."
