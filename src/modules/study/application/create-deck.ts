import { DeckName } from '../domain/deck-name.js';
import { Deck } from '../domain/deck.js';
import type { Clock } from '../../../shared/ports/clock.js';
import type { DeckRepository } from './ports/deck-repository.js';
import type { IdGenerator } from '../../../shared/ports/id-generator.js';
import { type DeckView, toDeckView } from './views.js';

export interface CreateDeckInput {
  ownerId: string;
  name: string;
}

// Use case: one user action, written as a short recipe.
// It receives its ports in the constructor and never knows which adapters they are.
export class CreateDeck {
  constructor(
    private readonly decks: DeckRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateDeckInput): Promise<DeckView> {
    const deck = Deck.create({
      id: this.ids.next(),
      ownerId: input.ownerId,
      name: DeckName.create(input.name),
      now: this.clock.now(),
    });

    await this.decks.save(deck);

    return toDeckView(deck);
  }
}
