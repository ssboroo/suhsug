import test from "node:test";
import assert from "node:assert/strict";
import { countPhoneOccurrences, parsePhoneCell } from "../lib/lottery-import";

test("one valid phone row creates one occurrence", () => {
  const parsed = parsePhoneCell("86050503");
  assert.equal(parsed.phone, "86050503");
  assert.equal(countPhoneOccurrences([parsed.phone!]).get("86050503"), 1);
});
test("five rows with the same phone create five tickets", () => {
  assert.equal(countPhoneOccurrences(Array(5).fill("88512990")).get("88512990"), 5);
});
test("one hundred repeated rows create one hundred tickets", () => {
  assert.equal(countPhoneOccurrences(Array(100).fill("99112233")).get("99112233"), 100);
});
test("payment amount is not an input to occurrence counting", () => {
  const rows = [{ phone: "86050503", amount: 1000 }, { phone: "86050503", amount: 500000 }];
  assert.equal(countPhoneOccurrences(rows.map(row => row.phone)).get("86050503"), 2);
});
test("consecutive duplicate phone rows are preserved", () => {
  assert.equal(countPhoneOccurrences(["86050503", "86050503"]).get("86050503"), 2);
});
test("non-consecutive duplicate phone rows are preserved", () => {
  assert.equal(countPhoneOccurrences(["86050503", "88512990", "86050503"]).get("86050503"), 2);
});
test("empty phone is invalid", () => assert.equal(parsePhoneCell("").phone, null));
test("invalid phone is rejected", () => assert.equal(parsePhoneCell("12345678").phone, null));
test("spaces and country code are normalized", () => assert.equal(parsePhoneCell(" +976 860-505-03 ").phone, "86050503"));
test("phone number embedded in text is extracted", () => assert.equal(parsePhoneCell("Холбоо барих: 99112233").phone, "99112233"));
test("multiple phone numbers in one cell are not guessed", () => assert.equal(parsePhoneCell("86050503, 99112233").reason, "MULTIPLE"));
