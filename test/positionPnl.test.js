import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePositionPnl,
  formatProfitAmount,
  isCryptoSymbol,
} from "../src/utils/positionPnl.js";

test("calcula ganancia de una compra con precio actualizado", () => {
  const result = calculatePositionPnl(
    { type: "Compra", openPrice: 100, volume: 2, symbol: "AAPL" },
    105,
    { status: "live" }
  );
  assert.equal(result.currentPrice, 105);
  assert.equal(result.profit, "10.00");
  assert.equal(result.profitPercentage, "5.00");
  assert.equal(result.pnlReady, true);
});

test("calcula ganancia de una venta cuando baja el precio", () => {
  const result = calculatePositionPnl(
    { type: "Venta", openPrice: 100, volume: 2, symbol: "AAPL" },
    95
  );
  assert.equal(result.profit, "10.00");
  assert.equal(result.profitPercentage, "5.00");
});

test("mantiene el beneficio pendiente sin una cotización", () => {
  const result = calculatePositionPnl(
    { type: "Compra", openPrice: 100, volume: 1, symbol: "X:BTCUSD" },
    null
  );
  assert.equal(result.pnlReady, false);
  assert.equal(result.profitLoading, true);
  assert.equal(result.profit, null);
});

test("crypto espera tick live antes de mostrar PnL (skeleton, no 0.00)", () => {
  const result = calculatePositionPnl(
    { type: "Compra", openPrice: 77060.88, volume: 0.01, symbol: "X:BTCUSD" },
    77060.88,
    { status: "seeded" }
  );
  assert.equal(result.pnlReady, false);
  assert.equal(result.profitLoading, true);
  assert.equal(result.profit, null);
});

test("crypto con live muestra PnL con decimales finos", () => {
  const result = calculatePositionPnl(
    { type: "Compra", openPrice: 77060.88, volume: 0.01, symbol: "X:BTCUSD" },
    77060.89,
    { status: "live" }
  );
  assert.equal(result.pnlReady, true);
  assert.equal(result.profit, "0.0001");
});

test("acciones en 0.00 quedan listas", () => {
  const result = calculatePositionPnl(
    { type: "Compra", openPrice: 100, volume: 1, symbol: "AAPL" },
    100
  );
  assert.equal(result.pnlReady, true);
  assert.equal(result.profit, "0.00");
});

test("formatProfitAmount adapta decimales", () => {
  assert.equal(formatProfitAmount(0), "0.00");
  assert.equal(formatProfitAmount(0.0001), "0.0001");
  assert.equal(formatProfitAmount(0.5), "0.500");
  assert.equal(formatProfitAmount(10), "10.00");
});

test("detecta símbolo crypto", () => {
  assert.equal(isCryptoSymbol("X:BTCUSD"), true);
  assert.equal(isCryptoSymbol("AAPL"), false);
});
