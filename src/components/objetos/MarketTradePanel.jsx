import { useState, useEffect, useCallback } from "react";
import { Button, Input, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";

import { TradingService } from "../services/tradingService.js";
import { useTradingPermission } from "../../hooks/useTradingPermission.js";

export default function MarketTradePanel({ market }) {
  const [quantity, setQuantity] = useState(0.01);
  const [rawQuantity, setRawQuantity] = useState("0.01");
  const [isLoading, setIsLoading] = useState(false);

  const minQty = 0.01;
  const step = 0.01;

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

  const handleBlur = () => {
    if (rawQuantity === "" || Number(rawQuantity) < minQty) {
      setQuantity(minQty);
      setRawQuantity(minQty.toFixed(2));
    }
  };

  const priceNumber = parseFloat(market?.price);
  const hasValidPrice = !Number.isNaN(priceNumber) && priceNumber > 0;

  const bid = parseFloat(market?.bid) || priceNumber || 0;
  const ask = parseFloat(market?.ask) || priceNumber || 0;

  const sellPriceNumber = bid > 0 ? bid : priceNumber || 0;
  const buyPriceNumber = ask > 0 ? ask : priceNumber || 0;

  const sellDisplay = sellPriceNumber ? sellPriceNumber.toFixed(2) : "--";
  const buyDisplay = buyPriceNumber ? buyPriceNumber.toFixed(2) : "--";

  const { canTrade, reason, requiredCost, capital, mode, refresh } = useTradingPermission({
    quantity,
    price: ask > 0 ? ask : priceNumber || 0,
  });

  const executeTrade = async (type) => {
    if (!hasValidPrice) {
      addToast({
        title: "Precio inválido",
        description: "No hay precio válido para este símbolo.",
        color: "warning",
        duration: 2500,
      });
      return;
    }

    // Si es demo y no tiene capital, abrir modal manualmente
    if (!canTrade && mode === "demo" && Number(capital) < Number(requiredCost)) {
       window.dispatchEvent(new Event("open-demo-funding"));
       return;
    }

    if (!canTrade) {
      addToast({
        title: "No puedes operar",
        description: reason,
        color: "danger",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const openPrice = type === "Compra" ? buyPriceNumber : sellPriceNumber;

      const savedPosition = await TradingService.savePosition({
        symbol: market.symbol,
        volume: quantity,
        type,
        openPrice,
        mode: mode // Enviamos el modo al backend
      });

      // --- CORRECCIÓN CLAVE ---
      // Forzamos que el evento tenga el 'mode' y una fecha válida
      // Esto asegura que la tabla (TradingTabs) reconozca la operación inmediatamente
      const eventData = {
        ...savedPosition,
        mode: mode, // Aseguramos que el modo esté presente
        createdAt: savedPosition.createdAt || new Date().toISOString() // Evita "Invalid Date"
      };

      window.dispatchEvent(new CustomEvent("trade-executed", { detail: eventData }));

      setTimeout(refresh, 500);
    } catch (error) {
      console.error("Error al ejecutar trade:", error);
      addToast({
        title: "Error",
        description: "No se pudo ejecutar la operación.",
        color: "danger",
        duration: 2800,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasValidPrice && (rawQuantity === "" || Number(rawQuantity) < minQty)) {
      setQuantity(minQty);
      setRawQuantity(minQty.toFixed(2));
    }
  }, [hasValidPrice, rawQuantity, minQty]);

  const usdValue = hasValidPrice ? (quantity * priceNumber).toFixed(2) : "0.00";
  
  const disabledTrade = (mode === "real" && !canTrade) || isLoading;

  return (
    <div className="p-3 bg-default-50 rounded-md">
      {mode === "real" && !canTrade && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {reason}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Button
          className="flex-1 bg-[#cb2e47] text-white hover:bg-[#cb2e47]/90 h-14"
          onClick={() => executeTrade("Venta")}
          isLoading={isLoading}
          isDisabled={disabledTrade}
          title={!canTrade ? reason : undefined}
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
          isDisabled={disabledTrade}
          title={!canTrade ? reason : undefined}
        >
          <span className="leading-tight">
            <b>COMPRA</b> <br />
            {buyDisplay}
          </span>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={() => quantity > minQty && handleQuantityChange(-step)}
            className="bg-default-100 rounded-lg w-8 h-8 min-w-8"
            isDisabled={isLoading || quantity <= minQty || disabledTrade}
          >
            <Icon icon="material-symbols:remove" />
          </Button>

          <Input
            aria-label="Cantidad"
            value={rawQuantity}
            onChange={handleQuantityInput}
            onBlur={handleBlur}
            type="text"
            size="sm"
            variant="bordered"
            className="flex-1"
            inputMode="decimal"
            description={`Mín: ${minQty.toFixed(2)} • Paso: ${step.toFixed(2)}`}
            isDisabled={disabledTrade}
          />

          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onClick={() => handleQuantityChange(step)}
            className="bg-default-100 rounded-lg w-8 h-8 min-w-8"
            isDisabled={isLoading || disabledTrade}
          >
            <Icon icon="material-symbols:add" />
          </Button>
        </div>

        <div className="text-center text-xs text-default-500 -mt-1">
          ≈ {usdValue} USD
        </div>

        <div className="text-[11px] mt-2 grid grid-cols-2 gap-y-1 text-default-600">
          <span>Capital disponible ({mode === 'demo' ? 'Demo' : 'Real'}):</span>
          <span className={Number(capital) >= Number(requiredCost) ? "text-success-600" : "text-danger-600"}>
            {Number(capital).toFixed(2)}
          </span>
          <span>Costo requerido:</span>
          <span>{Number(requiredCost).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}