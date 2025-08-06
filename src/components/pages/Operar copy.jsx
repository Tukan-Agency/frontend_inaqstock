import { useSession } from "../../hooks/use-session.jsx";
import { useState } from "react";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Select, SelectItem, CircularProgress } from "@heroui/react";
import CandlestickChart from "../../components/objetos/CandlestickChart.jsx";
import useCachedApi from "../services/useCachedApi.js";
import MarketList from "../../components/objetos/MarketList.jsx";
import { Icon } from "@iconify/react";

const TIME_RANGES = [
  { key: "M1", label: "M1", range: { multiplier: 1, timespan: "minute" } },
  { key: "M5", label: "M5", range: { multiplier: 5, timespan: "minute" } },
  { key: "M15", label: "M15", range: { multiplier: 15, timespan: "minute" } },
  { key: "M30", label: "M30", range: { multiplier: 30, timespan: "minute" } },
  { key: "H1", label: "H1", range: { multiplier: 1, timespan: "hour" } },
  { key: "H4", label: "H4", range: { multiplier: 4, timespan: "hour" } },
  { key: "D1", label: "D1", range: { multiplier: 1, timespan: "day" } },
  { key: "W1", label: "W1", range: { multiplier: 1, timespan: "week" } },
  { key: "MN1", label: "MN1", range: { multiplier: 1, timespan: "month" } },
  { key: "Y1", label: "Año", range: { multiplier: 1, timespan: "year" } },
];

const CHART_TYPES = [
  { key: "candlestick", label: "Velas", icon: "mdi:candle" },
  { key: "line", label: "Línea", icon: "mdi:chart-line" },
];

export default function Operar() {
  const { session } = useSession();
  const navigate = useNavigate();

  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSD");
  const [chartType, setChartType] = useState("candlestick");
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[6]); // D1 por defecto
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");

  // Construye la URL según los filtros
  const url = `https://api.polygon.io/v2/aggs/ticker/X:${selectedSymbol}/range/${selectedRange.range.multiplier}/${selectedRange.range.timespan}/${startDate}/${endDate}?apiKey=MF98h8vorj239xqQzHGEgjZ4JefrmFOj`;

  const { data, loading, error } = useCachedApi(url);

  // Procesar datos solo si ya están cargados
  const ohlcData = data?.results
    ? [...data.results].sort((a, b) => a.t - b.t)
    : [];

  if (session.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  const handleMarketSelect = (symbol) => {
    setSelectedSymbol(symbol);
  };

  // Si está cargando, muestra spinner grande y oculta todo el chart/filtros
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[100vh] bg-background text-foreground">
        <Nav />
        <div className="mt-24 flex flex-col items-center gap-4">
          <CircularProgress
            size="lg"
            strokeWidth={5}
            aria-label="Cargando datos del mercado..."
            color="primary"
          />
          <span className="text-lg font-medium text-primary">Cargando datos del mercado...</span>
        </div>
      </div>
    );
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
              <MarketList onSelect={handleMarketSelect} />
            </div>

            {/* Chart and Toolbar */}
            <div className="flex-[3]">
              <Card className="border border-solid border-[#00689b9e] h-[520px] p-3">
                {/* Toolbar estilo imagen 2 */}
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">{selectedSymbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Botón tipo de gráfico */}
                    <Select
                      size="sm"
                      variant="bordered"
                      selectedKey={chartType}
                      onSelectionChange={(keySet) =>
                        setChartType(Array.from(keySet)[0])
                      }
                      className="min-w-[120px]"
                    >
                      {CHART_TYPES.map((type) => (
                        <SelectItem key={type.key} textValue={type.label}>
                          <Icon icon={type.icon} className="mr-2" />
                          {type.label}
                        </SelectItem>
                      ))}
                    </Select>
                    {/* Botón rango de tiempo */}
                    <Select
                      size="sm"
                      variant="bordered"
                      selectedKey={selectedRange.key}
                      onSelectionChange={(keySet) => {
                        const key = Array.from(keySet)[0];
                        const range = TIME_RANGES.find((r) => r.key === key);
                        setSelectedRange(range);
                      }}
                      className="min-w-[100px]"
                    >
                      {TIME_RANGES.map((range) => (
                        <SelectItem key={range.key} textValue={range.label}>
                          <span
                            className={
                              range.key === selectedRange.key
                                ? "text-primary"
                                : ""
                            }
                          >
                            {range.label}
                          </span>
                        </SelectItem>
                      ))}
                    </Select>
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
                      loading={false} // Ya controlas loading aquí
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
                <CardBody></CardBody>
              </Card>
            </div>

            <div className="flex-[3]">
              <Card className="min-h-[350px] border border-solid border-[#00689b9e]">
                <CardBody>
                  <p></p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}