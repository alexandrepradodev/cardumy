import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';

import { connectDatabase, type DatabaseConnection } from '../../../src/infra/database.js';
import { UuidIdGenerator } from '../../../src/shared/adapters/uuid-id-generator.js';
import { PostgresCardRepository } from '../../../src/modules/study/adapters/out/postgres/postgres-card-repository.js';
import { PostgresDeckRepository } from '../../../src/modules/study/adapters/out/postgres/postgres-deck-repository.js';
import { PostgresTransactionRunner } from '../../../src/modules/study/adapters/out/postgres/postgres-transaction-runner.js';
import { DeckNotFoundError } from '../../../src/modules/study/application/errors.js';
import { createStudyUseCases } from '../../../src/modules/study/study-module.js';
import { FixedClock } from '../../support/fixed-clock.js';

let connection: DatabaseConnection;

beforeAll(() => {
  connection = connectDatabase(inject('databaseUrl'));
});

afterAll(async () => {
  await connection.close();
});

function postgresStudy() {
  const { db } = connection;
  const decks = new PostgresDeckRepository(db);
  const cards = new PostgresCardRepository(db);
  const study = createStudyUseCases({
    decks,
    cards,
    transactions: new PostgresTransactionRunner(db),
    clock: new FixedClock(new Date('2026-10-23T10:00:00Z')),
    ids: new UuidIdGenerator(),
  });
  return { decks, cards, study };
}

async function deckWithTwoCards() {
  const kit = postgresStudy();
  const deck = await kit.study.createDeck.execute({ ownerId: 'user-1', name: 'English' });
  for (const front of ['to be', 'to have']) {
    await kit.study.addCard.execute({ userId: 'user-1', deckId: deck.id, front, back: 'x' });
  }
  return { ...kit, deckId: deck.id };
}

beforeEach(async () => {
  await connection.db.execute(sql`TRUNCATE cards, decks`);
});

describe('PostgresTransactionRunner', () => {
  it('keeps every change when the work succeeds (COMMIT)', async () => {
    const { cards, deckId } = await deckWithTwoCards();
    const runner = new PostgresTransactionRunner(connection.db);

    await runner.run(async (tx) => {
      await tx.cards.deleteByDeck(deckId);
      await tx.decks.delete(deckId);
    });

    expect(await cards.findByDeck(deckId)).toEqual([]);
  });

  it('undoes every change when the work fails halfway (ROLLBACK)', async () => {
    const { cards, decks, deckId } = await deckWithTwoCards();
    const runner = new PostgresTransactionRunner(connection.db);

    const failingHalfway = runner.run(async (tx) => {
      await tx.cards.deleteByDeck(deckId);
      throw new Error('server crashed before deleting the deck');
    });

    await expect(failingHalfway).rejects.toThrow('server crashed');
    expect(await cards.findByDeck(deckId)).toHaveLength(2);
    expect(await decks.findById(deckId)).not.toBeNull();
  });
});

describe('DeleteDeck on Postgres', () => {
  it('deletes the deck and all its cards', async () => {
    const { study, cards, deckId } = await deckWithTwoCards();

    await study.deleteDeck.execute({ userId: 'user-1', deckId });

    await expect(study.getDeck.execute({ userId: 'user-1', deckId })).rejects.toThrow(
      DeckNotFoundError,
    );
    expect(await cards.findByDeck(deckId)).toEqual([]);
  });

  it('touches nothing when the deck belongs to someone else', async () => {
    const { study, cards, deckId } = await deckWithTwoCards();

    await expect(study.deleteDeck.execute({ userId: 'intruder', deckId })).rejects.toThrow(
      DeckNotFoundError,
    );
    expect(await cards.findByDeck(deckId)).toHaveLength(2);
  });
});
