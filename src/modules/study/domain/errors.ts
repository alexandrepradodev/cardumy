import { DomainError } from '../../../shared/errors.js';

export { DomainError };

export class InvalidDeckNameError extends DomainError {}

export class InvalidCardTextError extends DomainError {}

export class InvalidRatingError extends DomainError {}

export class ReviewInThePastError extends DomainError {}

export class UnsupportedImageTypeError extends DomainError {}

export class ImageTooLargeError extends DomainError {}

export class ImageOfAnotherCardError extends DomainError {}
