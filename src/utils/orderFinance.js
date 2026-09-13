const numberOrZero = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const sumOrderActions = (actions = []) =>
  actions.reduce(
    (total, action) =>
      total + numberOrZero(action?.benefit) * numberOrZero(action?.quantity),
    0
  );

export const isFinalizedOrder = (order) =>
  String(order?.operationStatus ?? order?.status ?? "")
    .trim()
    .toLowerCase() === "finalizado";

export function getOrderFinancials(order) {
  const actionsTotal = sumOrderActions(order?.operationActions);
  const operationValue = numberOrZero(order?.operationValue);
  const isCapital = Boolean(order?.isCapital);
  const isWithdrawl = Boolean(order?.isWithdrawl || order?.isWithdrawal);

  if (isCapital) {
    const amount = actionsTotal !== 0 ? actionsTotal : operationValue;
    return {
      capital: isWithdrawl ? 0 : amount,
      ganancia: 0,
      perdida: 0,
      retiros: isWithdrawl ? amount : 0,
      delta: amount,
    };
  }

  // Los retiros de ganancias tienen acciones y operationValue negativos.
  // operationValue se usa para el balance para no aplicar el retiro dos veces.
  if (isWithdrawl && actionsTotal !== 0) {
    return {
      capital: 0,
      ganancia: 0,
      perdida: 0,
      retiros: actionsTotal,
      delta: operationValue !== 0 ? operationValue : actionsTotal,
    };
  }

  return {
    capital: 0,
    ganancia: operationValue > 0 ? operationValue : 0,
    perdida: operationValue < 0 ? Math.abs(operationValue) : 0,
    retiros: 0,
    delta: operationValue,
  };
}

export function summarizeFinalizedOrders(orders = []) {
  return orders.reduce(
    (summary, order) => {
      if (!isFinalizedOrder(order)) return summary;

      const values = getOrderFinancials(order);
      summary.capital += values.capital;
      summary.ganancia += values.ganancia;
      summary.perdida += values.perdida;
      summary.retiros += values.retiros;
      summary.balance += values.delta;
      return summary;
    },
    { capital: 0, ganancia: 0, perdida: 0, retiros: 0, balance: 0 }
  );
}

export const getFinalizedOrderDelta = (order) =>
  isFinalizedOrder(order) ? getOrderFinancials(order).delta : 0;

export function cumulative(values = []) {
  let total = 0;
  return values.map((value) => {
    total += numberOrZero(value);
    return total;
  });
}
