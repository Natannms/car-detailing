import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "./errors";

describe("Domain errors", () => {
  it("expõe códigos esperados", () => {
    expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
    expect(new ForbiddenError().code).toBe("FORBIDDEN");
    expect(new NotFoundError().code).toBe("NOT_FOUND");
    expect(new ConflictError().code).toBe("CONFLICT");
  });
});

