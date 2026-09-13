import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Skeleton,
} from "@heroui/react";
import CandlestickChart from "../../components/objetos/CandlestickChart.jsx";
import MarketList from "../../components/objetos/MarketList.jsx";
import MarketWidget from "../objetos/MarketWidget/MarketWidget.jsx";
import TradingTabs from "../objetos/TradingTabs.jsx";
import { Icon } from "@iconify/react";
import useCachedApi from "../services/useCachedApi.js";
import { useLivePrice } from "../../hooks/useLivePrice.js";
import { formatMarketPrice } from "../../utils/marketPrice.js";
 


const TIME_PERIODS = [
  { key: "1M", label: "1M", days: 30, multiplier: 1, timespan: "day" },
  { key: "3M", label: "3M", days: 90, multiplier: 1, timespan: "day" },
  { key: "6M", label: "6M", days: 180, multiplier: 1, timespan: "day" },
  { key: "YTD", label: "YTD", yearToDate: true, multiplier: 1, timespan: "day" },
  { key: "1Y", label: "1A", days: 365, multiplier: 1, timespan: "week" },
  { key: "5Y", label: "5A", days: 1825, multiplier: 1, timespan: "month" },
];

const CHART_TYPES = [
  {
    key: "candlestick",
    label: "Velas",
    icon: "material-symbols:candlestick-chart-rounded",
  },
  { key: "line", label: "Línea", icon: "mdi:chart-line" },
];

export default function Operar() {
  const [openPositions, setOpenPositions] = useState([]);
  const { session } = useSession();

  const navigate = useNavigate();

  // Mantén formato cripto "X:BTCUSD", "X:ETHUSD", etc.
  const [selectedSymbol, setSelectedSymbol] = useState("X:BTCUSD");
  const [chartType, setChartType] = useState("candlestick");
  const [selectedRange, setSelectedRange] = useState(TIME_PERIODS[4]);

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = selectedRange.yearToDate
      ? new Date(end.getFullYear(), 0, 1)
      : new Date(end.getTime() - selectedRange.days * 86400000);
    const toDate = (value) => {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    return { startDate: toDate(start), endDate: toDate(end) };
  }, [selectedRange]);
  
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [marketReady, setMarketReady] = useState(false);
  const [showMarketSkeleton, setShowMarketSkeleton] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  const chartHeight = isMobile ? 300 : 280;

  // Históricos (Polygon aggs REST)
  const historyParams = new URLSearchParams({
    symbol: selectedSymbol,
    multiplier: String(selectedRange.multiplier),
    timespan: selectedRange.timespan,
    from: startDate,
    to: endDate,
  });
  const url = `${import.meta.env.VITE_API_URL}/api/prices/history?${historyParams}`;
  
  const { data, loading, error: historyError } = useCachedApi(url);
  const ohlcData = data?.results
    ? [...data.results].sort((a, b) => a.t - b.t)
    : [];

  const {
    symbol: liveSymbol,
    price: livePrice,
    ts: liveTimestamp,
    status: liveStatus,
    mode: liveMode,
    error: liveError,
  } = useLivePrice(selectedSymbol);

  const currentLivePrice = liveSymbol === selectedSymbol ? livePrice : null;
  const lastHistoricalPrice = ohlcData.at(-1)?.c ?? null;
  const displayedPrice = currentLivePrice ?? lastHistoricalPrice;
  const referencePrice = ohlcData.at(-2)?.c ?? lastHistoricalPrice;
  const priceChange = displayedPrice != null && referencePrice
    ? displayedPrice - referencePrice
    : null;
  const priceChangePercent = priceChange != null && referencePrice
    ? (priceChange / referencePrice) * 100
    : null;

  // Retardo para los skeletons (Solo afectará a la gráfica y widgets laterales, NO a la lista)
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowSkeletons(false);
      }, 1000); // 1 segundo de retardo después de que todo cargue
      return () => clearTimeout(timer);
    } else {
      setShowSkeletons(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!marketReady || loading) return undefined;
    const timer = setTimeout(() => setShowMarketSkeleton(false), 700);
    return () => clearTimeout(timer);
  }, [loading, marketReady]);

  useEffect(() => {
    if (session.status === "unauthenticated") navigate("/", { replace: true });
  }, [session.status, navigate]);
  const handleMarketSelect = (symbol) => setSelectedSymbol(symbol);

  useEffect(() => {
    const handleTrade = (event) => {
      const tradeData = event.detail;
      setOpenPositions((prev) => [
        ...prev,
        { id: Math.random().toString(36).substr(2, 9), ...tradeData },
      ]);
    };
    window.addEventListener("trade-executed", handleTrade);
    return () => window.removeEventListener("trade-executed", handleTrade);
  }, []);

  if (session.status === "unauthenticated") return null;

  return (
    <div className="text-foreground bg-background min-h-screen">
      <div className="flex flex-col gap-4 p-5">
        <Nav />

        <div className="pt-5 flex flex-col gap-6">
          <div className="grid grid-cols-1 items-stretch gap-4 md:h-[400px] md:grid-cols-[1fr_3fr]">
            {/* 
               SOLUCIÓN APLICADA:
               MarketList renderizado directamente. 
               Ya no depende de 'showSkeletons', por lo que no se desmonta al cambiar de moneda.
               Mantendrá su estado (panel abierto) y solo mostrará loading interno la primera vez.
            */}
            <div className="relative h-full min-h-0 overflow-hidden rounded-xl">
              <MarketList onSelect={handleMarketSelect} onInitialLoad={() => setMarketReady(true)} />
              {showMarketSkeleton && (
                <div className="absolute inset-0 z-20 overflow-hidden rounded-xl bg-content1 p-3">
                  <Skeleton className="mb-3 h-9 w-48 rounded-lg" />
                  <Skeleton className="mb-3 h-10 w-full rounded-lg" />
                  <div className="space-y-2">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Skeleton key={index} className="h-[70px] w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha: Gráfica. Esta SÍ muestra skeletons al cargar nueva data */}
            <div className="h-full min-h-0 overflow-hidden rounded-xl">
              {showSkeletons ? (
                <Skeleton
                  className="h-full min-h-[380px] w-full rounded-xl md:min-h-0"
                />
              ) : (
                <Card className="h-full min-h-0 overflow-hidden border border-solid border-[#11172766] p-3 dark:border-[#18A77766]">
                  <div className="px-2 pb-3 border-b border-divider">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-foreground/60">
                          <span className="font-semibold text-foreground">{selectedSymbol}</span>
                          <span>·</span>
                          <span>{selectedSymbol.startsWith("X:") ? "Cripto" : selectedSymbol.startsWith("C:") ? "Forex" : "Acción"}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-baseline gap-3">
                          <span className="text-2xl font-bold tabular-nums tracking-tight">
                            {formatMarketPrice(displayedPrice, selectedSymbol)}
                          </span>
                          {priceChangePercent != null && (
                            <span className={`text-sm font-semibold tabular-nums ${priceChange >= 0 ? "text-success" : "text-danger"}`}>
                              {priceChange >= 0 ? "+" : ""}{formatMarketPrice(priceChange, selectedSymbol)} ({priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%)
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-foreground/55" title={liveError || undefined}>
                          <span className={`h-2 w-2 rounded-full ${liveStatus === "live" ? "bg-success animate-pulse" : liveStatus === "error" ? "bg-danger" : "bg-warning"}`} />
                          <span>
                            {liveStatus === "live"
                              ? liveMode === "provider-ws" ? "Tiempo real" : "Último cierre disponible"
                              : liveStatus === "reconnecting" ? "Reconectando precios" : "Conectando precios"}
                          </span>
                          {liveTimestamp && <span>· {new Date(liveTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex rounded-lg bg-default-100 p-1">
                          {CHART_TYPES.map((type) => (
                            <Button
                              key={type.key}
                              size="sm"
                              variant={chartType === type.key ? "solid" : "light"}
                              color={chartType === type.key ? "primary" : "default"}
                              onPress={() => setChartType(type.key)}
                              startContent={<Icon icon={type.icon} width={17} />}
                            >
                              {type.label}
                            </Button>
                          ))}
                        </div>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              size="sm"
                              variant="flat"
                              startContent={<Icon icon="material-symbols:calendar-month" width={18} />}
                            >
                              {selectedRange.label}
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Periodo del gráfico"
                            selectionMode="single"
                            selectedKeys={[selectedRange.key]}
                            onSelectionChange={(keys) => {
                              const next = TIME_PERIODS.find((period) => period.key === Array.from(keys)[0]);
                              if (next) setSelectedRange(next);
                            }}
                          >
                            {TIME_PERIODS.map((period) => (
                              <DropdownItem key={period.key}>{period.label}</DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  </div>

                  <CardBody className="min-h-0 w-full flex-1 overflow-hidden p-0">
                      {historyError ? (
                      <div
                        className="w-full flex items-center justify-center text-red-500"
                        style={{ height: chartHeight }}
                      >
                          <div className="max-w-sm text-center px-6">
                            <Icon icon="material-symbols:query-stats" width={30} className="mx-auto mb-2" />
                            <p className="font-medium">No pudimos cargar el historial</p>
                            <p className="mt-1 text-sm text-foreground/55">Intenta nuevamente en unos momentos o selecciona otro periodo.</p>
                          </div>
                      </div>
                    ) : (
                      <CandlestickChart
                        data={ohlcData}
                        loading={loading}
                        title={`${selectedSymbol} (${selectedRange.label})`}
                        height={chartHeight}
                        showToolbar={false}
                        chartType={chartType}
                        livePrice={currentLivePrice}
                        livePriceSymbol={selectedSymbol}
                        liveMode={liveMode}
                      />
                    )}
                  </CardBody>
                </Card>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4">
            <div>
              {showSkeletons ? (
                <Skeleton className="rounded-xl w-full h-64" />
              ) : (
                <Card className="border border-solid border-[#11172766] dark:border-[#18A77766]">
                  <CardBody>
                    <MarketWidget selectedSymbol={selectedSymbol} />
                  </CardBody>
                </Card>
              )}
            </div>

            <div>
              {showSkeletons ? (
                <Skeleton className="rounded-xl w-full h-64" />
              ) : (
                <Card className="border border-solid border-[#11172766] dark:border-[#18A77766]">
                  <CardBody>
                    <TradingTabs openPositions={openPositions} />
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
