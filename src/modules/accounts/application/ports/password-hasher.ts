// Port for turning a password into a one-way "fingerprint" and checking it.
// Production uses Argon2id; tests use an instant fake, because real hashing is
// deliberately slow (that slowness is what stops brute force attacks).
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(passwordHash: string, password: string): Promise<boolean>;
}
