import { describe, expect, it } from 'vitest';

import { InvalidDeckNameError } from '../../../../src/modules/study/domain/errors.js';
import { makeStudyKit, START } from '../../../support/study-test-kit.js';

describe('CreateDeck', () => {
  it('creates and stores a deck for the owner', async () => {
    const { createDeck, decks } = makeStudyKit();

    const { deckId } = await createDeck.execute({ ownerId: 'user-1', name: ' English ' });

    const deck = await decks.findById(deckId);
    expect(deck?.name.value).toBe('English');
    expect(deck?.ownerId).toBe('user-1');
    expect(deck?.createdAt).toEqual(START);
  });

  it('stores nothing when the name is invalid', async () => {
    const { createDeck, decks } = makeStudyKit();

    await expect(createDeck.execute({ ownerId: 'user-1', name: '' })).rejects.toThrow(
      InvalidDeckNameError,
    );
    expect(await decks.findById('id-1')).toBeNull();
  });
});
