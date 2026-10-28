import { InvalidEmailError } from './errors.js';

const MAX_LENGTH = 254;
// Deliberately simple: "something@something.something". The only real proof
// that an email exists is sending a message to it.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Value object. Normalized to lower case so "Ana@X.com" and "ana@x.com"
// are the same account.
export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const value = raw.trim().toLowerCase();

    if (value.length > MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
      throw new InvalidEmailError('Email is not valid');
    }

    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
