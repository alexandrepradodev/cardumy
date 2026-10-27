import { randomUUID } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { connectDatabase, type DatabaseConnection } from '../../../src/infra/database.js';
import { PostgresCardRepository } from '../../../src/modules/study/adapters/out/postgres/postgres-card-repository.js';
import { PostgresDeckRepository } from '../../../src/modules/study/adapters/out/postgres/postgres-deck-repository.js';
import { CardText } from '../../../src/modules/study/domain/card-text.js';
import { Card } from '../../../src/modules/study/domain/card.js';
import { DeckName } from '../../../src/modules/study/domain/deck-name.js';
import { Deck } from '../../../src/modules/study/domain/deck.js';
import { studyRepositoriesContract } from '../../support/contracts/study-repositories-contract.js';

let connection: DatabaseConnection;

beforeAll(() => {
  connection = connectDatabase(inject('databaseUrl'));
});

afterAll(async () => {
  await connection.close();
});

// Every test starts with empty tables.
async function freshRepositories() {
  await connection.db.execute(sql`TRUNCATE cards, decks`);
  return {
    decks: new PostgresDeckRepository(connection.db),
    cards: new PostgresCardRepository(connection.db),
  };
}

studyRepositoriesContract('Postgres', freshRepositories);

describe('Postgres study tables', () => {
  it('refuse to delete a deck that still has cards (no cascade)', async () => {
    const { decks, cards } = await freshRepositories();
    const now = new Date();
    const deck = Deck.create({ id: randomUUID(), ownerId: 'u', name: DeckName.create('A'), now });
    await decks.save(deck);
    await cards.save(
      Card.create({
        id: randomUUID(),
        deckId: deck.id,
        front: CardText.create('f'),
        back: CardText.create('b'),
        now,
      }),
    );

    await expect(decks.delete(deck.id)).rejects.toThrow();
    expect(await decks.findById(deck.id)).not.toBeNull();
  });
});
