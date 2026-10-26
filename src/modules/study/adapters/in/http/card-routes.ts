import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from 'typebox';

import { authenticate } from '../../../../../infra/http/current-user.js';
import { commonErrors } from '../../../../../infra/http/problem-schema.js';
import type { StudyUseCases } from '../../../study-module.js';
import {
  CardBody,
  CardParams,
  CardResponse,
  DeckParams,
  DueCardsQuery,
  ReviewBody,
  toCardResponse,
} from './schemas.js';

interface CardRoutesOptions {
  study: StudyUseCases;
}

// Cards are created and listed under their deck (/decks/:deckId/cards),
// but have their own address once they exist (/cards/:cardId), because a
// card is its own aggregate (ADR 0005).
export const cardRoutes: FastifyPluginAsyncTypebox<CardRoutesOptions> = (app, { study }) => {
  app.addHook('onRequest', authenticate);

  app.post(
    '/decks/:deckId/cards',
    {
      schema: {
        tags: ['cards'],
        summary: 'Add a card to a deck',
        params: DeckParams,
        body: CardBody,
        response: { 201: CardResponse, ...commonErrors },
      },
    },
    async (request, reply) => {
      const card = await study.addCard.execute({
        userId: request.userId,
        deckId: request.params.deckId,
        ...request.body,
      });
      return reply.status(201).send(toCardResponse(card));
    },
  );

  app.get(
    '/decks/:deckId/cards',
    {
      schema: {
        tags: ['cards'],
        summary: 'List every card of a deck',
        params: DeckParams,
        response: { 200: Type.Array(CardResponse), ...commonErrors },
      },
    },
    async (request) => {
      const cards = await study.listCards.execute({
        userId: request.userId,
        deckId: request.params.deckId,
      });
      return cards.map(toCardResponse);
    },
  );

  app.get(
    '/decks/:deckId/cards/due',
    {
      schema: {
        tags: ['study'],
        summary: 'List cards due for review now, most overdue first',
        params: DeckParams,
        querystring: DueCardsQuery,
        response: { 200: Type.Array(CardResponse), ...commonErrors },
      },
    },
    async (request) => {
      const cards = await study.listDueCards.execute({
        userId: request.userId,
        deckId: request.params.deckId,
        limit: request.query.limit,
      });
      return cards.map(toCardResponse);
    },
  );

  app.patch(
    '/cards/:cardId',
    {
      schema: {
        tags: ['cards'],
        summary: 'Edit a card (its review history is kept)',
        params: CardParams,
        body: CardBody,
        response: { 200: CardResponse, ...commonErrors },
      },
    },
    async (request) => {
      const card = await study.editCard.execute({
        userId: request.userId,
        cardId: request.params.cardId,
        ...request.body,
      });
      return toCardResponse(card);
    },
  );

  app.delete(
    '/cards/:cardId',
    {
      schema: {
        tags: ['cards'],
        summary: 'Delete a card',
        params: CardParams,
        response: { 204: Type.Null({ description: 'Deleted' }), ...commonErrors },
      },
    },
    async (request, reply) => {
      await study.deleteCard.execute({ userId: request.userId, cardId: request.params.cardId });
      return reply.status(204).send(null);
    },
  );

  app.post(
    '/cards/:cardId/reviews',
    {
      schema: {
        tags: ['study'],
        summary: 'Review a card and schedule its next review',
        params: CardParams,
        body: ReviewBody,
        response: { 200: CardResponse, ...commonErrors },
      },
    },
    async (request) => {
      const card = await study.reviewCard.execute({
        userId: request.userId,
        cardId: request.params.cardId,
        rating: request.body.rating,
      });
      return toCardResponse(card);
    },
  );

  return Promise.resolve();
};
