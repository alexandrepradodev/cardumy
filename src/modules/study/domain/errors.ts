// Base class for every broken business rule in the study module.
// Adapters translate it later (for example, HTTP turns it into a 400).
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidDeckNameError extends DomainError {}

export class InvalidCardTextError extends DomainError {}

export class InvalidRatingError extends DomainError {}

export class ReviewInThePastError extends DomainError {}
