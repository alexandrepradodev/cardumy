// Base error classes shared by every module. Modules extend them with their
// own errors; the HTTP adapter translates each family into a status code.

// A broken business rule (an empty deck name, a weak password...). HTTP: 400.
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// Something looked for does not exist, or belongs to someone else (reported
// the same way so ids of other users never leak). HTTP: 404.
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// The request clashes with data that already exists (an email already in
// use...). HTTP: 409.
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// We could not confirm who the caller is (no token, wrong password...). HTTP: 401.
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
