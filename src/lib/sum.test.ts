import { sum } from "./sum";

describe("sum", () => {
  it("soma dois números", () => {
    expect(sum(1, 2)).toBe(3);
  });
});

