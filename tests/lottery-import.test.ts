import { describe, expect, it } from "vitest";
import { parsePhoneCell } from "../lib/lottery-import";

describe("lottery occurrence phone parsing", () => {
  it("accepts one valid 8 digit Mongolian phone", () => {
    expect(parsePhoneCell("86050503").phone).toBe("86050503");
  });
  it("trims spaces and formatted phone numbers", () => {
    expect(parsePhoneCell("  +976 860-505-03 ").phone).toBe("86050503");
  });
  it("extracts a single phone from text", () => {
    expect(parsePhoneCell("Утас: 88512990").phone).toBe("88512990");
  });
  it("rejects empty cells", () => {
    expect(parsePhoneCell("").reason).toBe("EMPTY");
  });
  it("rejects invalid numbers", () => {
    expect(parsePhoneCell("12345678").phone).toBeNull();
  });
  it("does not guess when multiple numbers occur in one cell", () => {
    expect(parsePhoneCell("86050503, 88512990").reason).toBe("MULTIPLE");
  });
  it("keeps each repeated occurrence as a separate row", () => {
    const occurrences = ["86050503", "88512990", "88512990", "88512990", "99112233", "99112233"].map(parsePhoneCell);
    expect(occurrences.filter(item => item.phone === "88512990")).toHaveLength(3);
    expect(occurrences.filter(item => item.phone).length).toBe(6);
  });
});
