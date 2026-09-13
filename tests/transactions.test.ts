import test from "node:test";
import assert from "node:assert/strict";
import { parseAmount, validateTransaction } from "../shared/transactions.ts";

test("converts decimal amounts into exact cents", () => {
  assert.equal(parseAmount("0.29"), 29);
  assert.equal(parseAmount("12,5"), 1250);
  assert.equal(parseAmount(" 100 "), 10000);
  for (const invalid of ["0", "-1", "1.234", "1e3", "", "Infinity", "1,000.00"]) {
    assert.equal(parseAmount(invalid), null);
  }
});

const valid = { type: "expense", amountCents: 29, date: "2024-02-29", category: "Groceries", description: "" };
test("validates real calendar dates and transaction fields", () => {
  assert.equal(validateTransaction(valid), null);
  for (const change of [{ date: "2025-02-29" }, { date: "2026-04-31" }, { amountCents: 1.5 }, { amountCents: 0 }, { amountCents: "29" }, { type: "transfer" }, { category: "Unknown" }, { description: "a".repeat(201) }]) {
    assert.equal(typeof validateTransaction({ ...valid, ...change }), "string");
  }
  assert.equal(typeof validateTransaction(null), "string");
});
