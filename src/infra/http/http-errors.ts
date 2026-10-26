// Errors that only make sense at the HTTP boundary, not in the domain.
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
