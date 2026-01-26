import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TradingService } from "../services/tradingService.js";
import OpenPositionsTable from "./OpenPositionsTable.jsx";
import ClosedPositionsTable from "./ClosedPositionsTable.jsx";
import { useAccountMode } from "../../context/AccountModeContext";
import { useCryptoPrices } from "../../hooks/useCryptoPrices.js";
import { useMultiLivePrices } from "../../hooks/useMultiLivePrices";

export default function TradingTabs() {
  const { mode } = useAccountMode();
  const [selectedTab, setSelectedTab] = useState("open");

  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. CARGAR POSICIONES
  const loadPositions = useCallback(async () => {
    try {
      setIsLoading(true);
      const [openData, closedData] = await Promise.all([
        TradingService.getOpenPositions(mode),
        TradingService.getClosedPositions(mode),
      ]);
      setOpenPositions(Array.isArray(openData) ? openData : []);
      setClosedPositions(Array.isArray(closedData) ? closedData : []);
    } catch (error) {
      console.error("Error cargando posiciones:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  // 2. ACTUALIZACIÓN EN TIEMPO REAL
  useEffect(() => {
    const handleTrade = (event) => {
      const newPosition = event.detail;
      if (newPosition && newPosition.mode === mode) {
        setOpenPositions((prev) => [
          {
            ...newPosition,
            profit: 0,
            profitPercentage: 0,
            pnlReady: false,
            profitLoading: true,
            openTime: newPosition.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
        setSelectedTab("open");
      }
    };

    window.addEventListener("trade-executed", handleTrade);
    return () => window.removeEventListener("trade-executed", handleTrade);
  }, [mode]);

  // 3. PRECIOS LIVE
  // Crypto (como ya lo tenías)
  const cryptoSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          openPositions
            .filter((p) => String(p.symbol).startsWith("X:"))
            .map((p) => String(p.symbol).trim().toUpperCase())
        )
      ),
    [openPositions]
  );
  const cryptoPrices = useCryptoPrices(cryptoSymbols);

  // Stocks (NUEVO): también pedimos live price para NO-crypto
  const stockSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          openPositions
            .filter((p) => !String(p.symbol).startsWith("X:"))
            .map((p) => String(p.symbol).trim().toUpperCase())
        )
      ),
    [openPositions]
  );
  const stockPrices = useMultiLivePrices(stockSymbols);

  const recalc = (positions) =>
    positions.map((p) => {
      const sym = String(p.symbol).trim().toUpperCase();
      const isCrypto = sym.startsWith("X:");

      const livePrice = isCrypto ? cryptoPrices[sym] : stockPrices[sym];

      const currentPriceNum =
        typeof livePrice === "number" && !Number.isNaN(livePrice)
          ? livePrice
          : Number(p.currentPrice) || Number(p.openPrice) || 0;

      const hasLive = typeof livePrice === "number" && livePrice > 0;
      const open = Number(p.openPrice);
      const qty = Number(p.volume) || 0;
      const commission = Number(p.commission) || 0;
      const swap = Number(p.swap) || 0;

      let profit = p.profit;
      let profitPercentage = p.profitPercentage;

      if (hasLive && open && qty) {
        const diff =
          p.type === "Compra"
            ? currentPriceNum - open
            : open - currentPriceNum;

        profit = (diff * qty - commission - swap).toFixed(2);
        profitPercentage = ((diff / open) * 100).toFixed(2);
      }

      const pnlReady = Boolean(p.pnlReady) || hasLive;

      return {
        ...p,
        currentPrice: currentPriceNum,
        profit,
        profitPercentage,
        pnlReady,
        profitLoading: !pnlReady,
      };
    });

  // Recalcular cuando cambie cualquier feed de precios
  useEffect(() => {
    if (!openPositions.length) return;
    setOpenPositions((prev) => recalc(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoPrices, stockPrices]);

  // 4. CERRAR POSICIÓN (Optimista + Mapeo correcto)
  const handleClosePosition = async (position) => {
    try {
      const positionToClose = openPositions.find((p) => p._id === position._id);

      setOpenPositions((prev) => prev.filter((p) => p._id !== position._id));

      const closeTimeISO = new Date().toISOString();
      const closePriceVal = position.currentPrice || position.openPrice;

      const closingData = {
        closePrice: closePriceVal,
        closeTime: closeTimeISO,
      };

      const response = await TradingService.closePosition(position._id, closingData);

      const finalClosedPosition = {
        ...positionToClose,
        ...response,
        closePrice: response.closePrice || closePriceVal,
        closeTime: response.closeTime || response.closedAt || closeTimeISO,
        openTime:
          response.openTime ||
          response.createdAt ||
          positionToClose.openTime ||
          positionToClose.createdAt,
        profit:
          response.profit !== undefined
            ? response.profit
            : positionToClose.profit,
        profitPercentage:
          response.profitPercentage !== undefined
            ? response.profitPercentage
            : positionToClose.profitPercentage,
      };

      setClosedPositions((prev) => [finalClosedPosition, ...prev]);
    } catch (error) {
      console.error("No se pudo cerrar la posición:", error);
      loadPositions();
    }
  };

  const tabs = [
    { id: "open", label: "Posiciones abiertas", icon: "famicons:book" },
    { id: "pending", label: "Órdenes pendientes", icon: "lets-icons:order-fill" },
    { id: "closed", label: "Posiciones cerradas", icon: "zondicons:close-solid" },
    { id: "finances", label: "Finanzas", icon: "majesticons:creditcard" },
  ];

  return (
    <div className="w-full">
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        aria-label="Trading Tabs"
        className="w-full"
        variant="bordered"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            title={
              <div className="flex items-center gap-2">
                <Icon icon={tab.icon} width={20} />
                <span>{tab.label}</span>
              </div>
            }
          >
            {tab.id === "open" && (
              <div className="py-4">
                <OpenPositionsTable
                  positions={openPositions}
                  onClosePosition={handleClosePosition}
                  isLoading={isLoading}
                />
              </div>
            )}

            {tab.id === "closed" && (
              <div className="py-4">
                <ClosedPositionsTable
                  positions={closedPositions}
                  isLoading={isLoading}
                />
              </div>
            )}

            {tab.id === "pending" && (
              <div className="py-4">
                <div className="flex items-center justify-center flex-col min-h-[200px] m-auto">
                  <div
                    style={{
                      background: "#00689824",
                      padding: "26px",
                      borderRadius: "73px",
                      marginBottom: "13px",
                    }}
                  >
                    <Icon color="#3285ab" icon={tab.icon} width={80} />
                  </div>
                  <h2>No tienes órdenes pendientes.</h2>
                  <p className="text-default-500">
                    Comienza a operar y aquí verás tus órdenes pendientes.
                  </p>
                </div>
              </div>
            )}

            {tab.id === "finances" && (
              <div className="py-4">
                <div className="flex items-center justify-center flex-col min-h-[200px] m-auto">
                  <div
                    style={{
                      background: "#00689824",
                      padding: "26px",
                      borderRadius: "73px",
                      marginBottom: "13px",
                    }}
                  >
                    <Icon color="#3285ab" icon={tab.icon} width={80} />
                  </div>
                  <h2>Información financiera no disponible.</h2>
                </div>
              </div>
            )}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}