import { ForbiddenError, NotFoundError, UnauthorizedError, ConflictError, DomainError } from "../domain/errors";
import { domainErrorToHttpStatus } from "./httpErrors";

describe("domainErrorToHttpStatus", () => {
  it("mapeia erros do domínio para status HTTP", () => {
    expect(domainErrorToHttpStatus(new UnauthorizedError())).toBe(401);
    expect(domainErrorToHttpStatus(new ForbiddenError())).toBe(403);
    expect(domainErrorToHttpStatus(new NotFoundError())).toBe(404);
    expect(domainErrorToHttpStatus(new ConflictError())).toBe(409);
    expect(domainErrorToHttpStatus(new DomainError("OTHER", "x"))).toBe(500);
  });
});
