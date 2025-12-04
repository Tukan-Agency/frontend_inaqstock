import { Tab, Tabs } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import OpenPositionsTable from "./OpenPositionsTable";
import ClosedPositionsTable from "./ClosedPositionsTable";
import { TradingService } from "../../components/services/tradingService";
import { useCryptoPrices } from "../../hooks/useCryptoPrices";
import { polygonService } from "../services/polygonService"; // Fallback REST

export default function TradingTabs() {
  const [selectedTab, setSelectedTab] = useState("open");
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  useEffect(() => {
    const handleTrade = (event) => {
      const savedPosition = event.detail;
      // Al crear, marcamos como pendiente para que muestre Skeleton
      setOpenPositions((prev) => [
        ...prev,
        {
          ...savedPosition,
          profit: null,
          profitPercentage: null,
          pnlReady: false,
          profitLoading: true,
        },
      ]);
    };
    window.addEventListener("trade-executed", handleTrade);
    return () => window.removeEventListener("trade-executed", handleTrade);
  }, []);

  // Solo cripto (X:)
  const cryptoSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          openPositions
            .filter((p) => String(p.symbol).startsWith("X:"))
            .map((p) => p.symbol)
        )
      ),
    [openPositions]
  );
  const cryptoPrices = useCryptoPrices(cryptoSymbols);

  const recalc = (positions, priceMap = {}) =>
    positions.map((p) => {
      const sym = String(p.symbol).trim();
      const isCrypto = sym.startsWith("X:");

      // Precio vivo proveniente de WS (cripto) o del mapa (fallback REST)
      const mapPrice = priceMap[sym];
      const wsPrice = isCrypto ? cryptoPrices[sym] : undefined;
      const livePrice =
        typeof mapPrice === "number" && !Number.isNaN(mapPrice)
          ? mapPrice
          : typeof wsPrice === "number" && !Number.isNaN(wsPrice)
          ? wsPrice
          : undefined;

      const hasLive = typeof livePrice === "number" && livePrice > 0;

      const currentPriceNum = hasLive
        ? Number(livePrice)
        : Number(p.currentPrice) || Number(p.openPrice) || 0;

      const open = Number(p.openPrice);
      const qty = Number(p.volume) || 0;
      const commission = Number(p.commission) || 0;
      const swap = Number(p.swap) || 0;

      // Mantén valores previos si aún no hay precio vivo
      let profit =
        hasLive && open && qty
          ? ((p.type === "Compra" ? currentPriceNum - open : open - currentPriceNum) * qty - commission - swap).toFixed(2)
          : p.profit ?? "0.00";

      let profitPercentage =
        hasLive && open
          ? (((p.type === "Compra" ? currentPriceNum - open : open - currentPriceNum) / open) * 100).toFixed(2)
          : p.profitPercentage ?? "0.00";

      const pnlReady = p.pnlReady || hasLive;
      const profitLoading = !pnlReady;

      return {
        ...p,
        currentPrice: currentPriceNum,
        profit,
        profitPercentage,
        pnlReady,
        profitLoading,
      };
    });

  // Recalcular cuando entran ticks WS (cripto)
  useEffect(() => {
    if (!openPositions.length) return;
    setOpenPositions((prev) => recalc(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoPrices, openPositions.length]);

  // Fallback: si no hay ticks, actualizar por REST cada 12s (y 1º intento a los 2s)
  useEffect(() => {
    if (!openPositions.length) return;
    let cancel = false;

    const tick = async () => {
      try {
        const symbols = Array.from(new Set(openPositions.map((p) => p.symbol)));
        const entries = await Promise.all(
          symbols.map(async (sym) => {
            try {
              const price = await polygonService.getRealtimePrice(sym);
              return [sym, price];
            } catch {
              return [sym, undefined];
            }
          })
        );
        if (cancel) return;
        const map = Object.fromEntries(entries);
        setOpenPositions((prev) => recalc(prev, map));
      } catch {
        // silencioso
      }
    };

    const first = setTimeout(tick, 2000);
    const id = setInterval(tick, 12000);

    return () => {
      cancel = true;
      clearTimeout(first);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPositions.length]);

  const loadPositions = async () => {
    setIsLoading(true);
    try {
      const [open, closed] = await Promise.all([
        TradingService.getOpenPositions(),
        TradingService.getClosedPositions(),
      ]);

      // Marcar todas las abiertas como “pendiente” para que muestren Skeleton hasta el primer precio
      const openWithFlags = (open || []).map((p) => ({
        ...p,
        profit: p.profit ?? null,
        profitPercentage: p.profitPercentage ?? null,
        pnlReady: false,
        profitLoading: true,
      }));

      setOpenPositions(openWithFlags);
      setClosedPositions(closed || []);
    } catch (error) {
      console.error("No se pudieron cargar las posiciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async (position) => {
    try {
      const closingData = {
        closePrice: position.currentPrice,
        closeTime: new Date().toISOString(),
      };
      const closedPosition = await TradingService.closePosition(
        position._id,
        closingData
      );
      setOpenPositions((prev) => prev.filter((p) => p._id !== position._id));
      setClosedPositions((prev) => [...prev, closedPosition]);
    } catch (error) {
      console.error("No se pudo cerrar la posición:", error);
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