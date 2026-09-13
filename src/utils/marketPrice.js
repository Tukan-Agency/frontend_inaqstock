export function getQuoteCurrency(symbol = "") {
  const normalized = symbol.toUpperCase();
  if (normalized.startsWith("X:") || normalized.startsWith("C:")) return normalized.slice(-3);
  return "USD";
}

export function formatMarketPrice(value, symbol, compact = false) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "--";

  const isForex = String(symbol).startsWith("C:");
  const maximumFractionDigits = isForex ? 5 : Math.abs(price) < 1 ? 6 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: getQuoteCurrency(symbol),
    currencyDisplay: "narrowSymbol",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact ? 0 : Math.min(2, maximumFractionDigits),
    maximumFractionDigits: compact ? 1 : maximumFractionDigits,
  }).format(price);
}
