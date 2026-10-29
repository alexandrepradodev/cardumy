import { DomainError } from '../../../shared/errors.js';

export class InvalidEmailError extends DomainError {}

export class WeakPasswordError extends DomainError {}
