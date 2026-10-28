import { DomainError } from '../../../shared/errors.js';

export { DomainError };

export class InvalidDeckNameError extends DomainError {}

export class InvalidCardTextError extends DomainError {}

export class InvalidRatingError extends DomainError {}

export class ReviewInThePastError extends DomainError {}
