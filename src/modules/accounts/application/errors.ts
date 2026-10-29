import { ConflictError, UnauthorizedError } from '../../../shared/errors.js';

export class EmailAlreadyInUseError extends ConflictError {
  constructor() {
    super('This email is already in use');
  }
}

// One error for "no such email" AND "wrong password": telling them apart
// would let anyone find out which emails have an account here.
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Email or password is incorrect');
  }
}
