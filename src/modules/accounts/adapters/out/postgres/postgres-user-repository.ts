import { eq } from 'drizzle-orm';

import { type DbExecutor, isUniqueViolation, isUuid } from '../../../../../shared/postgres.js';
import { EmailAlreadyInUseError } from '../../../application/errors.js';
import type { UserRepository } from '../../../application/ports/user-repository.js';
import { Email } from '../../../domain/email.js';
import { User } from '../../../domain/user.js';
import { users } from './schema.js';

type UserRow = typeof users.$inferSelect;

function toUser(row: UserRow): User {
  return User.restore({
    id: row.id,
    email: Email.create(row.email),
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  });
}

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: DbExecutor) {}

  async save(user: User): Promise<void> {
    const row: UserRow = {
      id: user.id,
      email: user.email.value,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
    };

    try {
      await this.db
        .insert(users)
        .values(row)
        .onConflictDoUpdate({
          target: users.id,
          set: { email: row.email, passwordHash: row.passwordHash },
        });
    } catch (error) {
      // Lost the race: another sign up saved this email between our check and
      // this insert. Translate the database's refusal into the domain's answer.
      if (isUniqueViolation(error, 'users_email_unique')) {
        throw new EmailAlreadyInUseError();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    if (!isUuid(id)) {
      return null;
    }
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ? toUser(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email.value));
    return row ? toUser(row) : null;
  }
}
