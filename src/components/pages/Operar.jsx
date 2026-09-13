import React, { useState, useEffect } from "react";
import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Button, Skeleton } from "@heroui/react";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import CandlestickChart from "../../components/objetos/CandlestickChart.jsx";
import MarketList from "../../components/objetos/MarketList.jsx";
import MarketWidget from "../objetos/MarketWidget/MarketWidget.jsx";
import TradingTabs from "../objetos/TradingTabs.jsx";
import { Icon } from "@iconify/react";
import useCachedApi from "../services/useCachedApi.js";
import { useLiveCryptoPrice } from "../../hooks/useLiveCryptoPrice.js";
 


const TIME_RANGES = [
  { key: "M30", label: "M30", range: { multiplier: 30, timespan: "minute" } },
  { key: "H1", label: "H1", range: { multiplier: 1, timespan: "hour" } },
  { key: "H4", label: "H4", range: { multiplier: 4, timespan: "hour" } },
  { key: "D1", label: "D1", range: { multiplier: 1, timespan: "day" } },
  { key: "W1", label: "W1", range: { multiplier: 1, timespan: "week" } },
  { key: "MN1", label: "MN1", range: { multiplier: 1, timespan: "month" } },
  { key: "Y1", label: "Año", range: { multiplier: 1, timespan: "year" } },
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
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[4]); // H1
  
  // Cambiar fechas a pasado para obtener datos reales de Polygon si es necesario
  const today = new Date();
  const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]; // 1 año atrás
  const endDate = today.toISOString().split('T')[0]; // Hoy
  
  const [showSkeletons, setShowSkeletons] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  const chartHeight = isMobile ? 300 : 460;

  // Históricos (Polygon aggs REST)
  const url = `https://api.polygon.io/v2/aggs/ticker/${selectedSymbol}/range/${
    selectedRange.range.multiplier
  }/${
    selectedRange.range.timespan
  }/${startDate}/${endDate}?adjusted=true&apiKey=${
    import.meta.env.VITE_POLYGON_API_KEY
  }`;
  
  const { data, loading, error } = useCachedApi(url);
  const ohlcData = data?.results
    ? [...data.results].sort((a, b) => a.t - b.t)
    : [];

  // Precio en vivo real (SSE/REST crypto)
  const { price: livePrice } = useLiveCryptoPrice(selectedSymbol);

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
    if (session.status === "unauthenticated") navigate("/", { replace: true });
  }, [session.status, navigate]);
  if (session.status === "unauthenticated") return null;

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

  return (
    <div className="text-foreground bg-background min-h-screen">
      <div className="flex flex-col gap-4 p-5">
        <Nav />

        <div className="pt-5 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4">
            {/* 
               SOLUCIÓN APLICADA:
               MarketList renderizado directamente. 
               Ya no depende de 'showSkeletons', por lo que no se desmonta al cambiar de moneda.
               Mantendrá su estado (panel abierto) y solo mostrará loading interno la primera vez.
            */}
            <div>
              <MarketList onSelect={handleMarketSelect} />
            </div>

            {/* Columna derecha: Gráfica. Esta SÍ muestra skeletons al cargar nueva data */}
            <div>
              {showSkeletons ? (
                <Skeleton
                  className="rounded-xl w-full"
                  style={{ height: chartHeight + 80 }}
                />
              ) : (
                <Card className="border border-solid border-[#00689b9e] p-3">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">
                        {selectedSymbol}
                      </span>
                      {livePrice != null ? (
                        <span className="text-primary text-sm">
                          Live:{" "}
                          {livePrice.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : error ? (
                        <span className="text-red-500 text-sm">
                          Error live: {error}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Cargando live...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            variant="solid"
                            size="sm"
                            aria-label="Seleccionar tipo de gráfico"
                          >
                            <Icon
                              icon={
                                CHART_TYPES.find((t) => t.key === chartType)
                                  .icon
                              }
                              width={20}
                            />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Tipo de gráfico"
                          selectionMode="single"
                          selectedKeys={[chartType]}
                          onSelectionChange={(keys) =>
                            setChartType(Array.from(keys)[0])
                          }
                        >
                          {CHART_TYPES.map((type) => (
                            <DropdownItem key={type.key} textValue={type.label}>
                              <div className="flex items-center gap-2">
                                <Icon icon={type.icon} className="mr-1" />
                                {type.label}
                              </div>
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </Dropdown>

                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            variant="solid"
                            size="sm"
                            aria-label="Seleccionar rango de tiempo"
                          >
                            <Icon
                              icon="material-symbols:calendar-month"
                              width={20}
                            />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Rango de tiempo"
                          selectionMode="single"
                          selectedKey={selectedRange.key}
                          onSelectionChange={(keySet) => {
                            const key = Array.from(keySet)[0];
                            const range = TIME_RANGES.find(
                              (r) => r.key === key
                            );
                            setSelectedRange(range);
                          }}
                        >
                          {TIME_RANGES.map((range) => (
                            <DropdownItem
                              key={range.key}
                              textValue={range.label}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={
                                    range.key === selectedRange.key
                                      ? "text-primary"
                                      : ""
                                  }
                                >
                                  {range.label}
                                </span>
                              </div>
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>

                  <CardBody className="w-full p-0 overflow-hidden">
                    {error ? (
                      <div
                        className="w-full flex items-center justify-center text-red-500"
                        style={{ height: chartHeight }}
                      >
                        <p>{error}</p>
                      </div>
                    ) : (
                      <CandlestickChart
                        data={ohlcData}
                        loading={loading}
                        title={`${selectedSymbol} (${selectedRange.label})`}
                        height={chartHeight}
                        showToolbar={false}
                        chartType={chartType}
                        showVolume={isMobile}
                        livePrice={livePrice}
                        livePriceSymbol={selectedSymbol}
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
                <Card className="border border-solid border-[#00689b9e]">
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
                <Card className="border border-solid border-[#00689b9e]">
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