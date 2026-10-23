# ADR 0005: card como agregado próprio

- Status: aceito
- Data: 2026-10-23

## Contexto

Um deck tem muitos cards. Em DDD, era possível modelar o `Deck` como agregado
com a lista de cards dentro dele, ou cada `Card` como seu próprio agregado.
A ação mais frequente do produto é revisar **um** card.

## Decisão

Cada `Card` é seu próprio agregado e guarda só o `deckId`. O `Deck` não tem
lista de cards. Regras que envolvem os dois (o deck pertence ao usuário?)
são conferidas nos casos de uso.

## Consequências

- Revisar um card carrega só aquele card: menos dados lidos, ação mais rápida
  e mais barata.
- Duas edições em cards diferentes do mesmo deck não disputam o mesmo bloco de
  dados, o que reduz conflitos de concorrência.
- O deck não controla diretamente regras sobre o conjunto de cards (por
  exemplo, "no máximo N cards por deck"). Se uma regra assim aparecer, ela
  fica num caso de uso ou num serviço de domínio.
