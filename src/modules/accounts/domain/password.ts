import { WeakPasswordError } from './errors.js';

// OWASP: at least 8 characters, and allow long passphrases.
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

// Value object for a password typed by the user. It only lives during sign up
// or login: it is never stored, only its hash is.
export class Password {
  private constructor(readonly value: string) {}

  static create(raw: string): Password {
    // No trim: spaces are valid characters in a password.
    if (raw.length < MIN_LENGTH) {
      throw new WeakPasswordError(`Password must have at least ${String(MIN_LENGTH)} characters`);
    }
    if (raw.length > MAX_LENGTH) {
      throw new WeakPasswordError(`Password cannot exceed ${String(MAX_LENGTH)} characters`);
    }

    return new Password(raw);
  }
}
