import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';

// Agreed in stage 3: access token only, valid for one hour. When it expires
// the user logs in again (refresh tokens can come later if needed).
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

declare module '@fastify/jwt' {
  interface FastifyJWT {
    // What we put inside the token: only the user id, in the standard `sub`
    // (subject) claim. The token is signed, NOT encrypted: anyone can read
    // it, so it must never carry secrets.
    payload: { sub: string };
  }
}

// Registers @fastify/jwt: app.jwt.sign() creates tokens and
// request.jwtVerify() checks them (used by the authenticate hook in step 5).
export function registerAuth(app: FastifyInstance, secret: string): void {
  void app.register(jwt, {
    secret,
    sign: { algorithm: 'HS256', expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    verify: { algorithms: ['HS256'] },
  });
}
