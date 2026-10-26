import { Type } from 'typebox';

// Schema of a Problem Details body, so error responses show up in the docs.
export const ProblemResponse = Type.Object(
  {
    type: Type.String(),
    title: Type.String(),
    status: Type.Integer(),
    detail: Type.String(),
    instance: Type.String(),
    code: Type.String({ description: 'Stable error code for programs to branch on' }),
    errors: Type.Optional(
      Type.Array(Type.Object({ field: Type.String(), message: Type.String() })),
    ),
  },
  { description: 'Problem Details (RFC 9457)' },
);

// Errors every authenticated route can answer with.
export const commonErrors = {
  400: ProblemResponse,
  401: ProblemResponse,
  404: ProblemResponse,
};
