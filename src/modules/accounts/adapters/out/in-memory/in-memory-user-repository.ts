import { EmailAlreadyInUseError } from '../../../application/errors.js';
import type { UserRepository } from '../../../application/ports/user-repository.js';
import type { Email } from '../../../domain/email.js';
import type { User } from '../../../domain/user.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  save(user: User): Promise<void> {
    // Behaves like the unique index on users.email in Postgres.
    const owner = [...this.users.values()].find((other) => other.email.equals(user.email));
    if (owner && !owner.equals(user)) {
      return Promise.reject(new EmailAlreadyInUseError());
    }

    this.users.set(user.id, user);
    return Promise.resolve();
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByEmail(email: Email): Promise<User | null> {
    const user = [...this.users.values()].find((candidate) => candidate.email.equals(email));
    return Promise.resolve(user ?? null);
  }
}
