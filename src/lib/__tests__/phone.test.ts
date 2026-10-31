import { describe, expect, it } from "vitest";
import { formatPhone, normalizeItalianMobile } from "../phone";

describe("normalizeItalianMobile", () => {
  it.each([
    ["333 123 4567", "+393331234567"],
    ["+39 333-1234567", "+393331234567"],
    ["0039 3331234567", "+393331234567"],
    ["393331234567", "+393331234567"],
    ["3311234567", "+393311234567"],
  ])("%s -> %s", (input, out) => expect(normalizeItalianMobile(input)).toBe(out));

  it.each(["0721 123456", "12345", "abc", "+44 7700 900123", ""])("rifiuta %s", (input) =>
    expect(normalizeItalianMobile(input)).toBeNull(),
  );

  it("formatta per la lettura", () => {
    expect(formatPhone("+393331234567")).toBe("+39 333 123 4567");
  });
});
