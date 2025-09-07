import React, { useState, useEffect } from "react";
import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Button } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import CandlestickChart from "../../components/objetos/CandlestickChart.jsx";
import MarketList from "../../components/objetos/MarketList.jsx";
import MarketWidget from "../objetos/MarketWidget/MarketWidget.jsx";
import TradingTabs from "../objetos/TradingTabs.jsx";
import { Icon } from "@iconify/react";
import useCachedData from "../../hooks/useCachedData.js";

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
  { key: "candlestick", label: "Velas", icon: "material-symbols:candlestick-chart-rounded" },
  { key: "line", label: "Línea", icon: "mdi:chart-line" },
];

export default function Operar() {
  const { session } = useSession();
  const navigate = useNavigate();

  const [selectedSymbol, setSelectedSymbol] = useState("X:BTCUSD");
  const [chartType, setChartType] = useState("candlestick");
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[4]); // D1 por defecto

  // Construye la URL según los filtros
  const url = `https://api.polygon.io/v2/aggs/ticker/${selectedSymbol}/range/${selectedRange.range.multiplier}/${selectedRange.range.timespan}/2025-01-01/2025-12-31?apiKey=MF98h8vorj239xqQzHGEgjZ4JefrmFOj`;

  // Hook para el manejo de caché
  const { data, loading, error } = useCachedData(url, async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al cargar los datos.");
    return await response.json();
  });

  const ohlcData = data?.results
    ? [...data.results].sort((a, b) => a.t - b.t)
    : [];

  if (session.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  return (
    <div className="text-foreground bg-background h-[100vh]">
      <div className="flex flex-col gap-4 p-5">
        <Nav />
        <div className="pt-5 flex flex-col gap-6">
          {/* Primera fila de tarjetas */}
          <div className="flex flex-row gap-4">
            {/* Market List */}
            <div className="flex-[1]">
              <MarketList onSelect={(symbol) => setSelectedSymbol(symbol)} />
            </div>

            {/* Chart and Toolbar */}
            <div className="flex-[3]">
              <Card className="border border-solid border-[#00689b9e] h-[520px] p-3">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">{selectedSymbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Botón tipo de gráfico */}
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="solid" size="sm" aria-label="Seleccionar tipo de gráfico">
                          <Icon icon={CHART_TYPES.find((t) => t.key === chartType).icon} width={20} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Tipo de gráfico"
                        selectionMode="single"
                        selectedKeys={[chartType]}
                        onSelectionChange={(keys) => setChartType(Array.from(keys)[0])}
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
                        <Button isIconOnly variant="solid" size="sm" aria-label="Seleccionar rango de tiempo">
                          <Icon icon="material-symbols:calendar-month" width={20} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Rango de tiempo"
                        selectionMode="single"
                        selectedKey={selectedRange.key}
                        onSelectionChange={(keySet) => {
                          const key = Array.from(keySet)[0];
                          const range = TIME_RANGES.find((r) => r.key === key);
                          setSelectedRange(range);
                        }}
                      >
                        {TIME_RANGES.map((range) => (
                          <DropdownItem key={range.key} textValue={range.label}>
                            <div className="flex items-center gap-2">
                              <span className={range.key === selectedRange.key ? "text-primary" : ""}>
                                {range.label}
                              </span>
                            </div>
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
                {/* Chart */}
                <CardBody className="w-full h-[460px] p-0 overflow-hidden">
                  {error ? (
                    <div className="w-full h-full flex items-center justify-center text-red-500">
                      <p>{error}</p>
                    </div>
                  ) : (
                    <CandlestickChart
                      data={ohlcData}
                      loading={loading}
                      title={`${selectedSymbol} (${selectedRange.label})`}
                      height={460}
                      showToolbar={false}
                      chartType={chartType}
                    />
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Segunda fila de tarjetas */}
          <div className="flex flex-row gap-4">
            <div className="flex-[1]">
              <Card className="min-h-[350px] border border-solid border-[#00689b9e]">
                <CardBody>
                  <MarketWidget selectedSymbol={selectedSymbol} />
                </CardBody>
              </Card>
            </div>

            <div className="flex-[3]">
              <Card className="min-h-[350px] border border-solid border-[#00689b9e]">
                <CardBody>
                  <TradingTabs openPositions={[]} />
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}