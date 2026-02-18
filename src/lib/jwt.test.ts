import { decodeJwtPayload } from "./jwt";

describe("decodeJwtPayload", () => {
  it("retorna null para token inválido", () => {
    expect(decodeJwtPayload("abc")).toBeNull();
  });

  it("decodifica payload base64url", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "u1", org_id: "o1" })).toString("base64url");
    const token = `${header}.${payload}.`;
    expect(decodeJwtPayload(token)).toEqual({ sub: "u1", org_id: "o1" });
  });
});

