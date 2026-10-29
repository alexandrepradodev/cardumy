import { InvalidEmailError } from '../domain/errors.js';
import { Email } from '../domain/email.js';
import { InvalidCredentialsError } from './errors.js';
import type { PasswordHasher } from './ports/password-hasher.js';
import type { UserRepository } from './ports/user-repository.js';

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  userId: string;
}

// Use case: login. Answers "who is this?" and nothing more. Issuing the token
// is an HTTP concern (a JWT today, maybe a cookie tomorrow), so it lives in
// the adapter, not here.
export class AuthenticateUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticatedUser> {
    const email = parseEmail(input.email);
    const user = email ? await this.users.findByEmail(email) : null;

    if (!user) {
      // Burn the same time a real check would. Otherwise "unknown email"
      // answers faster than "wrong password", and the clock gives it away.
      await this.hasher.hash(input.password);
      throw new InvalidCredentialsError();
    }

    // No Password.create() here: the rules are for choosing a password, and
    // login must not reveal them (or lock out users if the rules change).
    if (!(await this.hasher.verify(user.passwordHash, input.password))) {
      throw new InvalidCredentialsError();
    }

    return { userId: user.id };
  }
}

function parseEmail(raw: string): Email | null {
  try {
    return Email.create(raw);
  } catch (error) {
    if (error instanceof InvalidEmailError) return null;
    throw error;
  }
}
