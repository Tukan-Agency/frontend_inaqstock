import { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TradingService } from "../services/tradingService";

/**
 * Panel de operación universal (Criptos, Acciones, Forex)
 * Props:
 *  - market: { symbol, price, bid, ask, ... }
 */
export default function MarketTradePanel({ market }) {
  const [quantity, setQuantity] = useState(0.01);
  const [rawQuantity, setRawQuantity] = useState("0.01");
  const [isLoading, setIsLoading] = useState(false);

  const minQty = 0.01;
  const step = 0.01;

  // --- Normaliza cantidad ---
  const normalizeQuantity = useCallback(
    (val) => {
      if (val === "" || val === null || val === undefined) return "";
      let num = Number(val);
      if (Number.isNaN(num)) return "";
      if (num < minQty) num = minQty;
      num = Math.round(num / step) * step;
      return Number(num.toFixed(2));
    },
    [step]
  );

  const handleQuantityChange = (increment) => {
    const newQ = Number((quantity + increment).toFixed(2));
    if (newQ >= minQty) {
      setQuantity(newQ);
      setRawQuantity(newQ.toFixed(2));
    }
  };

  const handleQuantityInput = (e) => {
    const val = e.target.value.replace(",", ".");
    setRawQuantity(val);
    if (val === "") return;
    const normalized = normalizeQuantity(val);
    if (normalized !== "") {
      setQuantity(normalized);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") executeTrade("Compra");
  };

  const handleBlur = () => {
    if (rawQuantity === "" || Number(rawQuantity) < minQty) {
      setQuantity(minQty);
      setRawQuantity(minQty.toFixed(2));
    }
  };

  // --- Lógica de precios ---
  const priceNumber = parseFloat(market?.price);
  const hasValidPrice = !Number.isNaN(priceNumber) && priceNumber > 0;

  // Preferir bid/ask si existen
  const bid = parseFloat(market?.bid) || priceNumber || 0;
  const ask = parseFloat(market?.ask) || priceNumber || 0;

  const sellPriceNumber = bid > 0 ? bid : priceNumber || 0;
  const buyPriceNumber = ask > 0 ? ask : priceNumber || 0;

  const sellDisplay = sellPriceNumber ? sellPriceNumber.toFixed(2) : "--";
  const buyDisplay = buyPriceNumber ? buyPriceNumber.toFixed(2) : "--";

  const calculateUsdValue = () => {
    if (!hasValidPrice) return "0.00";
    return (quantity * priceNumber).toFixed(2);
  };

  const canTrade = hasValidPrice && quantity >= minQty && !isLoading;

  // --- Ejecutar operación ---
  const executeTrade = async (type) => {
    if (!hasValidPrice) {
      console.warn("No hay precio válido para este símbolo.");
      return;
    }

    setIsLoading(true);
    try {
      const tradeData = {
        symbol: market.symbol,
        volume: quantity,
        type,
        openPrice: type === "Compra" ? buyPriceNumber : sellPriceNumber,
        currentPrice: priceNumber,
        openTime: new Date().toISOString(),
        tp: "-",
        sl: "-",
        swap: 0.0,
        commission: 0.0,
        profit: "0.00",
        profitPercentage: "0.00",
        source: market.market || "manual",
      };

      // Guardar en backend (simulación o real)
      const savedPosition = await TradingService.savePosition(tradeData);

      // Disparar evento global para que la tabla se actualice
      window.dispatchEvent(
        new CustomEvent("trade-executed", { detail: savedPosition })
      );
    } catch (error) {
      console.error("Error al ejecutar trade:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Re-render si llega nuevo precio ---
  useEffect(() => {
    if (hasValidPrice && (rawQuantity === "" || Number(rawQuantity) < minQty)) {
      setQuantity(minQty);
      setRawQuantity(minQty.toFixed(2));
    }
  }, [hasValidPrice, rawQuantity, minQty]);

  // --- Render principal ---
  return (
    <div className="p-3 bg-default-50 rounded-md">
      <div className="flex gap-2 mb-4">
        {/* VENTA */}
        <Button
          className="flex-1 bg-[#cb2e47] text-white hover:bg-[#cb2e47]/90 h-14"
          onClick={() => executeTrade("Venta")}
          isLoading={isLoading}
          isDisabled={!canTrade}
        >
          <span className="leading-tight">
            <b>VENTA</b> <br />
            {sellDisplay}
          </span>
        </Button>

        {/* COMPRA */}
        <Button
          className="flex-1 bg-[#06726b] text-white hover:bg-[#06726b]/90 h-14"
          onClick={() => executeTrade("Compra")}
          isLoading={isLoading}
          isDisabled={!canTrade}
        >
          <span className="leading-tight">
            <b>COMPRA</b> <br />
            {buyDisplay}
          </span>
        </Button>
      </div>

      {/* Input cantidad */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={() => handleQuantityChange(-step)}
            className="bg-default-100 rounded-lg w-8 h-8 min-w-8"
            isDisabled={isLoading || quantity <= minQty}
          >
            <Icon icon="material-symbols:remove" />
          </Button>

          <Input
            aria-label="Cantidad"
            value={rawQuantity}
            onChange={handleQuantityInput}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            type="text"
            size="sm"
            variant="bordered"
            className="flex-1"
            inputMode="decimal"
            description={`Mín: ${minQty.toFixed(2)} • Paso: ${step.toFixed(2)}`}
          />

          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={() => handleQuantityChange(step)}
            className="bg-default-100 rounded-lg w-8 h-8 min-w-8"
            isDisabled={isLoading}
          >
            <Icon icon="material-symbols:add" />
          </Button>
        </div>

        <div className="text-center text-xs text-default-500 -mt-1">
          ≈ {calculateUsdValue()} USD
        </div>
      </div>
    </div>
  );
}
