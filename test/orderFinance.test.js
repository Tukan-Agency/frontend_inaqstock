import test from "node:test";
import assert from "node:assert/strict";

import {
  cumulative,
  getFinalizedOrderDelta,
  summarizeFinalizedOrders,
} from "../src/utils/orderFinance.js";

const finalized = (overrides) => ({
  operationStatus: "Finalizado",
  operationActions: [],
  operationValue: 0,
  isCapital: false,
  isWithdrawl: false,
  ...overrides,
});

const capital = (amount) =>
  finalized({
    isCapital: true,
    operationActions: [{ benefit: amount, quantity: 1 }],
  });

const trade = (amount) => finalized({ operationValue: amount });

const withdrawal = (amount) =>
  finalized({
    isWithdrawl: true,
    operationValue: -amount,
    operationActions: [{ benefit: -amount, quantity: 1 }],
  });

test("capital 100 + ganancias 20 - retiro 20 conserva balance 100", () => {
  const summary = summarizeFinalizedOrders([
    capital(100),
    trade(10),
    trade(10),
    withdrawal(20),
  ]);

  assert.deepEqual(summary, {
    capital: 100,
    ganancia: 20,
    perdida: 0,
    retiros: -20,
    balance: 100,
  });
});

test("solo ganancias incrementan el balance", () => {
  assert.equal(summarizeFinalizedOrders([capital(100), trade(25)]).balance, 125);
});

test("solo pérdidas reducen el balance", () => {
  assert.equal(summarizeFinalizedOrders([capital(100), trade(-25)]).balance, 75);
});

test("varios retiros se debitan una sola vez", () => {
  assert.equal(
    summarizeFinalizedOrders([capital(100), withdrawal(10), withdrawal(15)]).balance,
    75
  );
});

test("órdenes no finalizadas no afectan el balance", () => {
  const pendingWithdrawal = {
    ...withdrawal(20),
    operationStatus: "Pendiente",
  };
  assert.equal(summarizeFinalizedOrders([capital(100), pendingWithdrawal]).balance, 100);
});

test("admin, cliente y gráfico usan el mismo delta firmado", () => {
  const orders = [capital(100), trade(10), trade(10), withdrawal(20)];
  const clientBalance = summarizeFinalizedOrders(orders).balance;
  const adminBalance = orders.reduce(
    (total, order) => total + getFinalizedOrderDelta(order),
    0
  );
  const graphBalance = cumulative(orders.map(getFinalizedOrderDelta)).at(-1);

  assert.equal(clientBalance, 100);
  assert.equal(adminBalance, clientBalance);
  assert.equal(graphBalance, clientBalance);
});
