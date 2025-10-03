import { useState, useEffect, useCallback } from "react";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TradingService } from "../services/tradingService";

/**
 * Props:
 *  - market: { symbol, price, ... }
 */
export default function MarketTradePanel({ market }) {
  // Volumen siempre en número interno
  const [quantity, setQuantity] = useState(0.01);
  const [rawQuantity, setRawQuantity] = useState("0.01"); // para controlar el input
  const [isLoading, setIsLoading] = useState(false);

  const minQty = 0.01;
  const step = 0.01;

  const normalizeQuantity = useCallback(
    (val) => {
      if (val === "" || val === null || val === undefined) return "";
      let num = Number(val);
      if (Number.isNaN(num)) return "";
      if (num < minQty) num = minQty;
      // Redondear a 2 decimales según step
      num = Math.round(num / step) * step;
      return Number(num.toFixed(2));
    },
    [step]
  );

  // Maneja cambios por botones + / -
  const handleQuantityChange = (increment) => {
    const newQ = Number((quantity + increment).toFixed(2));
    if (newQ >= minQty) {
      setQuantity(newQ);
      setRawQuantity(newQ.toFixed(2));
    }
  };

  // Maneja cambios tipeados
  const handleQuantityInput = (e) => {
    const val = e.target.value.replace(",", "."); // permitir coma
    setRawQuantity(val);
    if (val === "") return;
    const normalized = normalizeQuantity(val);
    if (normalized !== "") {
      setQuantity(normalized);
    }
  };

  // Enter dentro del input ejecuta compra rápida (opcional)
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      executeTrade("Compra");
    }
  };

  // Si el user borra todo y sale del input, restaurar mínimo
  const handleBlur = () => {
    if (rawQuantity === "" || Number(rawQuantity) < minQty) {
      setQuantity(minQty);
      setRawQuantity(minQty.toFixed(2));
    }
  };

  const priceNumber = parseFloat(market?.price);
  const hasValidPrice = !Number.isNaN(priceNumber) && priceNumber > 0;

  const sellPriceNumber = hasValidPrice ? Math.max(priceNumber - 0.41, 0) : 0;
  const sellPrice = sellPriceNumber.toFixed(2);
  const buyDisplay = hasValidPrice ? priceNumber.toFixed(2) : "--";
  const sellDisplay = hasValidPrice ? sellPrice : "--";

  const calculateUsdValue = () => {
    if (!hasValidPrice) return "0.00";
    return (quantity * priceNumber).toFixed(2);
  };

  const canTrade = hasValidPrice && quantity >= minQty && !isLoading;

  const executeTrade = async (type) => {
    if (!hasValidPrice) {
      console.warn("No hay precio válido todavía para este símbolo.");
      return;
    }
    if (quantity < minQty) {
      console.warn("La cantidad es inválida.");
      return;
    }

    setIsLoading(true);
    try {
      const tradeData = {
        symbol: market.symbol,
        volume: quantity,
        type,
        openPrice:
          type === "Compra"
            ? priceNumber
            : sellPriceNumber, // precio de apertura
        currentPrice: priceNumber,
        openTime: new Date().toISOString(),
        tp: "-",
        sl: "-",
        swap: 0.0,
        commission: 0.0,
        profit: "0.00",
        profitPercentage: "0.00",
      };

      // Guardar en backend
      const savedPosition = await TradingService.savePosition(tradeData);

      // Emitir evento global para que Operar.jsx actualice la tabla
      window.dispatchEvent(
        new CustomEvent("trade-executed", { detail: savedPosition })
      );

      // Reset opcional (si quieres volver a 0.01 tras cada trade)
      // setQuantity(minQty);
      // setRawQuantity(minQty.toFixed(2));
    } catch (error) {
      console.error("Error al ejecutar trade:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Si llega un nuevo precio y el botón mostraba "--", forzar re-render de cantidades
  useEffect(() => {
    if (hasValidPrice && (rawQuantity === "" || Number(rawQuantity) < minQty)) {
      setQuantity(minQty);
      setRawQuantity(minQty.toFixed(2));
    }
  }, [hasValidPrice, rawQuantity, minQty]);

  return (
    <div className="p-3 bg-default-50 rounded-md">
      {/* Botones de Compra/Venta */}
      <div className="flex gap-2 mb-4">
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

      {/* Control de cantidad con input manual */}
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