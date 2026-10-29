import type { Email } from './email.js';

interface CreateUserProps {
  id: string;
  email: Email;
  passwordHash: string;
  now: Date;
}

// Entity: a user is identified by its id. It holds the password HASH,
// never the password itself.
export class User {
  private constructor(
    readonly id: string,
    readonly email: Email,
    readonly passwordHash: string,
    readonly createdAt: Date,
  ) {}

  static create({ id, email, passwordHash, now }: CreateUserProps): User {
    return new User(id, email, passwordHash, now);
  }

  // Rebuilds a user saved earlier (for example, read from the database).
  static restore(props: { id: string; email: Email; passwordHash: string; createdAt: Date }): User {
    return new User(props.id, props.email, props.passwordHash, props.createdAt);
  }

  equals(other: User): boolean {
    return this.id === other.id;
  }
}
