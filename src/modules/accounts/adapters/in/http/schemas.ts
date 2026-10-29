import { Type, type Static } from 'typebox';

import type { UserView } from '../../../application/views.js';

// Format only. The real rules (valid email, 8 to 128 characters) live in the
// domain. The maxLength here is a cheap guard: it stops a 10 MB "password"
// before it reaches the deliberately slow hash.
export const CredentialsBody = Type.Object({
  email: Type.String({ maxLength: 254, examples: ['ana@example.com'] }),
  password: Type.String({
    maxLength: 1024,
    description: 'At least 8 characters to sign up',
    examples: ['correct horse battery'],
  }),
});

export const UserResponse = Type.Object({
  id: Type.String(),
  email: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
});

export type UserResponse = Static<typeof UserResponse>;

export function toUserResponse(user: UserView): UserResponse {
  return { ...user, createdAt: user.createdAt.toISOString() };
}

// Shape of OAuth 2.0 token responses (RFC 6749), which clients already know.
export const TokenResponse = Type.Object({
  accessToken: Type.String({ description: 'Send it as "Authorization: Bearer <token>"' }),
  tokenType: Type.Literal('Bearer'),
  expiresIn: Type.Integer({ description: 'Seconds until the token expires' }),
});
