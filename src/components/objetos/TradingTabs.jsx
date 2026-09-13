import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TradingService } from "../services/tradingService.js";
import OpenPositionsTable from "./OpenPositionsTable.jsx";
import ClosedPositionsTable from "./ClosedPositionsTable.jsx";
import { useAccountMode } from "../../context/AccountModeContext";
import { useMultiLivePrices } from "../../hooks/useMultiLivePrices";
import { calculatePositionPnl } from "../../utils/positionPnl.js";

export default function TradingTabs() {
  const { mode } = useAccountMode();
  const [selectedTab, setSelectedTab] = useState("open");
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const handleTrade = (event) => {
      const newPosition = event.detail;
      if (newPosition && newPosition.mode === mode) {
        setOpenPositions((prev) => [
          {
            ...newPosition,
            profit: null,
            profitPercentage: null,
            currentPrice: null,
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

  const positionSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          openPositions.map((p) => String(p.symbol || "").trim().toUpperCase()).filter(Boolean)
        )
      ),
    [openPositions]
  );

  const { prices: positionPrices, status: priceStatus } = useMultiLivePrices(positionSymbols);

  // Una vez que crypto tuvo tick live, no vuelve a skeleton por reconexión.
  const liveLockedRef = useRef(new Set());
  useEffect(() => {
    Object.entries(priceStatus).forEach(([symbol, status]) => {
      if (status === "live") liveLockedRef.current.add(symbol);
    });
  }, [priceStatus]);

  // Derivado: no reescribe estado en cada tick.
  const liveOpenPositions = useMemo(
    () =>
      openPositions.map((position) => {
        const symbol = String(position.symbol || "").trim().toUpperCase();
        const feedStatus = liveLockedRef.current.has(symbol)
          ? "live"
          : priceStatus[symbol] || null;
        return calculatePositionPnl(position, positionPrices[symbol], {
          status: feedStatus,
        });
      }),
    [openPositions, positionPrices, priceStatus]
  );

  const handleClosePosition = async (position) => {
    try {
      const positionToClose = openPositions.find((p) => p._id === position._id);
      setOpenPositions((prev) => prev.filter((p) => p._id !== position._id));

      const closeTimeISO = new Date().toISOString();
      const closePriceVal = position.currentPrice || position.openPrice;
      const response = await TradingService.closePosition(position._id, {
        closePrice: closePriceVal,
        closeTime: closeTimeISO,
      });

      const finalClosedPosition = {
        ...positionToClose,
        ...response,
        closePrice: response.closePrice || closePriceVal,
        closeTime: response.closeTime || response.closedAt || closeTimeISO,
        openTime:
          response.openTime ||
          response.createdAt ||
          positionToClose?.openTime ||
          positionToClose?.createdAt,
        profit: response.profit !== undefined ? response.profit : position.profit,
        profitPercentage:
          response.profitPercentage !== undefined
            ? response.profitPercentage
            : position.profitPercentage,
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
                  positions={liveOpenPositions}
                  onClosePosition={handleClosePosition}
                  isLoading={isLoading}
                />
              </div>
            )}

            {tab.id === "closed" && (
              <div className="py-4">
                <ClosedPositionsTable positions={closedPositions} isLoading={isLoading} />
              </div>
            )}

            {tab.id === "pending" && (
              <div className="py-4">
                <div className="m-auto flex min-h-[200px] flex-col items-center justify-center">
                  <div
                    style={{
                      background: "#18A77724",
                      padding: "26px",
                      borderRadius: "73px",
                      marginBottom: "13px",
                    }}
                  >
                    <Icon color="#18A777" icon={tab.icon} width={80} />
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
                <div className="m-auto flex min-h-[200px] flex-col items-center justify-center">
                  <div
                    style={{
                      background: "#18A77724",
                      padding: "26px",
                      borderRadius: "73px",
                      marginBottom: "13px",
                    }}
                  >
                    <Icon color="#18A777" icon={tab.icon} width={80} />
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
