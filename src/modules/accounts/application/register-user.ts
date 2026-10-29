import type { Clock } from '../../../shared/ports/clock.js';
import type { IdGenerator } from '../../../shared/ports/id-generator.js';
import { Email } from '../domain/email.js';
import { Password } from '../domain/password.js';
import { User } from '../domain/user.js';
import { EmailAlreadyInUseError } from './errors.js';
import type { PasswordHasher } from './ports/password-hasher.js';
import type { UserRepository } from './ports/user-repository.js';
import { type UserView, toUserView } from './views.js';

export interface RegisterUserInput {
  email: string;
  password: string;
}

// Use case: sign up. Validates, refuses a repeated email, and stores only the
// password hash.
export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: RegisterUserInput): Promise<UserView> {
    const email = Email.create(input.email);
    const password = Password.create(input.password);

    // Friendly check. Two sign ups at the same instant can both pass it, so the
    // database also has a unique index on email as the final guard (next step).
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyInUseError();
    }

    const user = User.create({
      id: this.ids.next(),
      email,
      passwordHash: await this.hasher.hash(password.value),
      now: this.clock.now(),
    });

    await this.users.save(user);

    return toUserView(user);
  }
}
