import type { DomainError } from "../domain/errors";

export type HttpErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export function domainErrorToHttpStatus(error: DomainError): number {
  switch (error.code) {
    case "UNAUTHORIZED":
      return 401;
    case "SUBSCRIPTION_REQUIRED":
      return 402;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    default:
      return 500;
  }
}
