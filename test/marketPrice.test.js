import assert from "node:assert/strict";
import test from "node:test";

import { formatMarketPrice, getQuoteCurrency } from "../src/utils/marketPrice.js";

test("identifica la moneda cotizada", () => {
  assert.equal(getQuoteCurrency("X:BTCUSD"), "USD");
  assert.equal(getQuoteCurrency("C:EURUSD"), "USD");
  assert.equal(getQuoteCurrency("AAPL"), "USD");
});

test("muestra símbolo monetario y precisión adecuada", () => {
  assert.match(formatMarketPrice(77418.8, "X:BTCUSD"), /^\$77,418\.80$/);
  assert.match(formatMarketPrice(1.15981, "C:EURUSD"), /^\$1\.15981$/);
});
