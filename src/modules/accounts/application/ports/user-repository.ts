import type { Email } from '../../domain/email.js';
import type { User } from '../../domain/user.js';

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
}
