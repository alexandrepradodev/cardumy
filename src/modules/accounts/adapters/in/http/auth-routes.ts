import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { ACCESS_TOKEN_TTL_SECONDS } from '../../../../../infra/http/auth.js';
import { ProblemResponse } from '../../../../../infra/http/problem-schema.js';
import type { AccountsUseCases } from '../../../accounts-module.js';
import { CredentialsBody, TokenResponse, toUserResponse, UserResponse } from './schemas.js';

interface AuthRoutesOptions {
  accounts: AccountsUseCases;
}

const tags = ['auth'];

// Inbound adapter for sign up and login. Public routes: no token needed.
export const authRoutes: FastifyPluginAsyncTypebox<AuthRoutesOptions> = (app, { accounts }) => {
  app.post(
    '/auth/register',
    {
      schema: {
        tags,
        summary: 'Create an account',
        security: [],
        body: CredentialsBody,
        response: { 201: UserResponse, 400: ProblemResponse, 409: ProblemResponse },
      },
    },
    async (request, reply) => {
      const user = await accounts.registerUser.execute(request.body);
      return reply.status(201).send(toUserResponse(user));
    },
  );

  app.post(
    '/auth/login',
    {
      schema: {
        tags,
        summary: 'Log in and get an access token',
        security: [],
        body: CredentialsBody,
        response: { 200: TokenResponse, 400: ProblemResponse, 401: ProblemResponse },
      },
    },
    async (request) => {
      const { userId } = await accounts.authenticateUser.execute(request.body);
      // The use case said WHO it is; turning that into a token is HTTP's job.
      const accessToken = app.jwt.sign({ sub: userId });
      return { accessToken, tokenType: 'Bearer' as const, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
    },
  );

  return Promise.resolve();
};
