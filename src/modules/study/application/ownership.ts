import type { Card } from '../domain/card.js';
import type { Deck } from '../domain/deck.js';
import { CardNotFoundError, DeckNotFoundError } from './errors.js';
import type { CardRepository } from './ports/card-repository.js';
import type { DeckRepository } from './ports/deck-repository.js';

// Every use case that touches an existing deck or card starts here.
// Not found and "belongs to someone else" look the same from outside.

export async function findOwnedDeck(
  decks: DeckRepository,
  deckId: string,
  userId: string,
): Promise<Deck> {
  const deck = await decks.findById(deckId);
  if (!deck?.isOwnedBy(userId)) {
    throw new DeckNotFoundError(deckId);
  }
  return deck;
}

export async function findOwnedCard(
  decks: DeckRepository,
  cards: CardRepository,
  cardId: string,
  userId: string,
): Promise<Card> {
  const card = await cards.findById(cardId);
  const deck = card === null ? null : await decks.findById(card.deckId);
  if (card === null || !deck?.isOwnedBy(userId)) {
    throw new CardNotFoundError(cardId);
  }
  return card;
}
