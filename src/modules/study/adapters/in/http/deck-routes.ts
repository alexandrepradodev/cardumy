import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';

import { authenticate } from '../../../../../infra/http/current-user.js';
import { commonErrors } from '../../../../../infra/http/problem-schema.js';
import type { StudyUseCases } from '../../../study-module.js';
import { DeckBody, DeckParams, DeckResponse, toDeckResponse } from './schemas.js';

interface DeckRoutesOptions {
  study: StudyUseCases;
}

const tags = ['decks'];

// Inbound adapter: each route only translates HTTP <-> use case.
// No business rule lives here.
export const deckRoutes: FastifyPluginAsyncTypebox<DeckRoutesOptions> = (app, { study }) => {
  // Every route in this plugin needs a user; /health, outside it, does not.
  app.addHook('onRequest', authenticate);

  app.post(
    '/decks',
    {
      schema: {
        tags,
        summary: 'Create a deck',
        body: DeckBody,
        response: { 201: DeckResponse, ...commonErrors },
      },
    },
    async (request, reply) => {
      const deck = await study.createDeck.execute({
        ownerId: request.userId,
        name: request.body.name,
      });
      return reply.status(201).send(toDeckResponse(deck));
    },
  );

  app.get(
    '/decks',
    {
      schema: {
        tags,
        summary: 'List my decks',
        response: { 200: Type.Array(DeckResponse), ...commonErrors },
      },
    },
    async (request) => {
      const decks = await study.listDecks.execute({ userId: request.userId });
      return decks.map(toDeckResponse);
    },
  );

  app.get(
    '/decks/:deckId',
    {
      schema: {
        tags,
        summary: 'Get a deck',
        params: DeckParams,
        response: { 200: DeckResponse, ...commonErrors },
      },
    },
    async (request) => {
      const deck = await study.getDeck.execute({
        userId: request.userId,
        deckId: request.params.deckId,
      });
      return toDeckResponse(deck);
    },
  );

  app.patch(
    '/decks/:deckId',
    {
      schema: {
        tags,
        summary: 'Rename a deck',
        params: DeckParams,
        body: DeckBody,
        response: { 200: DeckResponse, ...commonErrors },
      },
    },
    async (request) => {
      const deck = await study.renameDeck.execute({
        userId: request.userId,
        deckId: request.params.deckId,
        name: request.body.name,
      });
      return toDeckResponse(deck);
    },
  );

  app.delete(
    '/decks/:deckId',
    {
      schema: {
        tags,
        summary: 'Delete a deck and all its cards',
        params: DeckParams,
        response: { 204: Type.Null({ description: 'Deleted' }), ...commonErrors },
      },
    },
    async (request, reply) => {
      await study.deleteDeck.execute({ userId: request.userId, deckId: request.params.deckId });
      return reply.status(204).send(null);
    },
  );

  return Promise.resolve();
};
