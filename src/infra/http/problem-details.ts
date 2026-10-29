import { STATUS_CODES } from 'node:http';

import type { FastifyError } from 'fastify';

import {
  ConflictError,
  DomainError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors.js';

// Problem Details (RFC 9457): one shape for every error of the API.
// "type: about:blank" means the HTTP status itself explains the problem;
// `code` is our extension, stable for clients to branch on.
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  errors?: { field: string; message: string }[];
}

export function problem(
  status: number,
  code: string,
  detail: string,
  instance: string,
): ProblemDetails {
  return {
    type: 'about:blank',
    title: STATUS_CODES[status] ?? 'Error',
    status,
    detail,
    instance,
    code,
  };
}

function missingProperty(params: Record<string, unknown>): string {
  return typeof params.missingProperty === 'string' ? params.missingProperty : '';
}

function isFastifyError(error: unknown): error is FastifyError {
  return error instanceof Error && typeof (error as Partial<FastifyError>).statusCode === 'number';
}

// Translates any thrown error into a ProblemDetails. The order matters:
// known errors first, and anything unexpected becomes a 500 without leaking details.
export function toProblemDetails(error: unknown, instance: string): ProblemDetails {
  if (isFastifyError(error) && error.validation) {
    return {
      ...problem(400, 'VALIDATION_FAILED', 'The request is not in the expected format', instance),
      errors: error.validation.map((issue) => ({
        field: issue.instancePath || missingProperty(issue.params),
        message: issue.message ?? 'is invalid',
      })),
    };
  }
  if (error instanceof DomainError) {
    return problem(400, error.name, error.message, instance);
  }
  if (error instanceof NotFoundError) {
    return problem(404, error.name, error.message, instance);
  }
  if (error instanceof ConflictError) {
    return problem(409, error.name, error.message, instance);
  }
  if (error instanceof UnauthorizedError) {
    return problem(401, error.name, error.message, instance);
  }
  if (isFastifyError(error) && error.statusCode !== undefined && error.statusCode < 500) {
    return problem(error.statusCode, error.code, error.message, instance);
  }
  return problem(500, 'INTERNAL_ERROR', 'Something went wrong on our side', instance);
}
