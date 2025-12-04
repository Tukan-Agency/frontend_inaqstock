import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Chart from "react-apexcharts";
import MarketList from "../../components/objetos/MarketList.jsx";
import MarketWidget from "../objetos/MarketWidget/MarketWidget.jsx";
import { useOrdersAggregates } from "../../hooks/useOrdersAggregates.js";

export default function Analitica() {
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.status === "unauthenticated") navigate("/", { replace: true });
  }, [session.status, navigate]);
  if (session.status === "unauthenticated") return null;

  const clientId = useMemo(
    () =>
      session?.user?.clientId ||
      session?.user?.id ||
      session?.user?._id ||
      session?.user?.uid ||
      null,
    [session]
  );

  const [selectedSymbol, setSelectedSymbol] = useState("X:BTCUSD");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const set = () => setIsMobile(mql.matches);
    set();
    mql.addEventListener?.("change", set);
    return () => mql.removeEventListener?.("change", set);
  }, []);
  const chartHeight = isMobile ? 280 : 400;
  const roiHeight = isMobile ? 220 : 260;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState("M"); // "M" | "T" | "S" | "Y"
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedTrimestre, setSelectedTrimestre] = useState("1");
  const [selectedSemestre, setSelectedSemestre] = useState("1");
  const [selectedYearIndex, setSelectedYearIndex] = useState("1"); // 1..N como string (Select)

  const { isLoading, chartData, roiTime, currentBalance, roiData, operationalYears } =
    useOrdersAggregates({
      clientId,
      selectedYear,
      selectedPeriod,
      selectedMonth,
      selectedTrimestre,
      selectedSemestre,
      selectedYearIndex: Number(selectedYearIndex || 1),
    });

  const primaryColor = "#00689b";

  const chartOptions = useMemo(
    () => ({
      chart: { type: "area", height: chartHeight, toolbar: { show: false }, background: "transparent", zoom: { enabled: false } },
      dataLabels: {
        enabled: selectedPeriod === "M" && !isMobile,
        style: { fontSize: "11px", colors: [primaryColor], fontWeight: 300 },
        background: { enabled: true, foreColor: "#fff", borderRadius: 2, padding: 4, opacity: 0.9, borderWidth: 1, borderColor: primaryColor },
      },
      stroke: { curve: "smooth", width: selectedPeriod === "M" ? 3 : 2, colors: [primaryColor] },
      markers: { size: selectedPeriod === "M" ? (isMobile ? 4 : 6) : 4, colors: [primaryColor], strokeColors: "#fff", strokeWidth: 2, hover: { size: 8 } },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 100],
          colorStops: [{ offset: 0, color: primaryColor, opacity: 0.4 }, { offset: 100, color: primaryColor, opacity: 0.1 }] },
      },
      xaxis: {
        categories: chartData.labels,
        labels: { style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px" },
          rotate: selectedPeriod === "M" ? (isMobile ? -30 : -45) : 0,
          maxHeight: selectedPeriod === "M" ? (isMobile ? 40 : 60) : 40 },
        axisBorder: { show: false }, axisTicks: { show: false }, crosshairs: { show: false },
      },
      yaxis: { show: true, labels: { style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px" }, formatter: (v) => "$" + v.toFixed(0) } },
      grid: { show: true, borderColor: "var(--nextui-colors-default-200)" },
      tooltip: { shared: true, intersect: false, theme: "light", y: { formatter: (v) => "$" + v.toFixed(2) + " USD" } },
      legend: { show: false }, colors: [primaryColor],
    }),
    [chartHeight, selectedPeriod, isMobile, primaryColor, chartData.labels]
  );
  const chartSeries = useMemo(() => [{ name: "Total", data: chartData.totalValues || [] }], [chartData.totalValues]);

  const roiChartOptions = useMemo(
    () => ({
      chart: { type: "area", height: roiHeight, toolbar: { show: false }, background: "transparent", zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2, colors: ["#4a9ece"] },
      fill: { type: "solid", colors: ["#b3d4ea"], opacity: 0.3 },
      xaxis: { categories: roiTime.labels, labels: { style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px" } } },
      yaxis: { labels: { style: { colors: "var(--nextui-colors-default-500)" }, formatter: (v) => `${v.toFixed(0)}%` } },
      grid: { show: true, borderColor: "var(--nextui-colors-default-200)" },
      tooltip: { enabled: true, theme: "light", y: { formatter: (v) => `${v.toFixed(2)}%` } },
      legend: { show: false },
    }),
    [roiHeight, roiTime.labels]
  );
  const roiChartSeries = useMemo(() => [{ name: "ROI acumulado", data: roiTime.values }], [roiTime.values]);

  const formatCurrency = (n) =>
    Number(n || 0)?.toLocaleString("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

  return (
    <div className="text-foreground bg-background min-h-screen">
      <div className="flex flex-col gap-4 p-5">
        <Nav />

        <div className="pt-5 grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4">
          {/* Dashboard */}
          <Card className="order-1 md:order-2 border border-solid border-[#00689b9e]">
            <CardBody className="p-4 md:p-6">
              <div className="space-y-6">
                {/* Filtros */}
                <div className="flex flex-wrap gap-3 items-center p-3 md:p-4 bg-default-50 dark:bg-default-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-default-700">Año</span>
                    <Input size="sm" type="number" value={String(selectedYear)}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value || "0", 10))}
                      min="2020" max="2035" className="w-24" />
                  </div>

                  <Tabs selectedKey={selectedPeriod} onSelectionChange={(key) => setSelectedPeriod(String(key))}
                    variant="underlined" size="sm" aria-label="Periodo de análisis" color="primary" className="h-10">
                    <Tab key="M" title="Mes" />
                    <Tab key="T" title="Trimestre" />
                    <Tab key="S" title="Semestre" />
                    <Tab key="Y" title="Año" /> {/* Año relativo */}
                  </Tabs>

                  {selectedPeriod === "M" && (
                    <Select size="sm" selectedKeys={[String(selectedMonth)]}
                      onSelectionChange={(keys) => setSelectedMonth(parseInt(Array.from(keys)[0], 10))}
                      className="w-32" placeholder="Mes">
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={String(i + 1)} value={String(i + 1)}>
                          {new Date(2025, i, 1).toLocaleDateString("es-ES", { month: "short" })}
                        </SelectItem>
                      ))}
                    </Select>
                  )}

                  {selectedPeriod === "T" && (
                    <Select size="sm" selectedKeys={[selectedTrimestre]}
                      onSelectionChange={(keys) => setSelectedTrimestre(Array.from(keys)[0])}
                      className="w-36" placeholder="Trimestre">
                      <SelectItem key="1" value="1">1° Trimestre</SelectItem>
                      <SelectItem key="2" value="2">2° Trimestre</SelectItem>
                      <SelectItem key="3" value="3">3° Trimestre</SelectItem>
                      <SelectItem key="4" value="4">4° Trimestre</SelectItem>
                    </Select>
                  )}

                  {selectedPeriod === "S" && (
                    <Select size="sm" selectedKeys={[selectedSemestre]}
                      onSelectionChange={(keys) => setSelectedSemestre(Array.from(keys)[0])}
                      className="w-36" placeholder="Semestre">
                      <SelectItem key="1" value="1">1° Semestre</SelectItem>
                      <SelectItem key="2" value="2">2° Semestre</SelectItem>
                    </Select>
                  )}

                  {selectedPeriod === "Y" && (
                    <Select
                      size="sm"
                      selectedKeys={[String(selectedYearIndex)]}
                      onSelectionChange={(keys) => setSelectedYearIndex(Array.from(keys)[0])}
                      className="w-52"
                      placeholder="Año de operación"
                      isDisabled={!operationalYears.length}
                    >
                      {operationalYears.map((y) => (
                        <SelectItem key={String(y.index)} value={String(y.index)}>
                          {y.label}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>

                {/* Movimientos */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-medium text-default-700">Movimientos</h3>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        {isLoading ? (
                          <Skeleton className="h-[280px] md:h-[400px] w-full rounded-xl" />
                        ) : (
                          <Chart options={chartOptions} series={chartSeries} type="area" height={chartHeight} />
                        )}
                      </div>

                      <div className="w-full md:w-72 space-y-4">
                        <h4 className="text-base font-medium text-default-700">Rendimiento de trades</h4>

                        <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                          <CardBody className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Icon icon="mdi:wallet" className="text-blue-600 w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-default-600 mb-1">Balance</p>
                                <p className="text-lg font-semibold text-default-900">
                                  {Number(currentBalance || 0).toLocaleString("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 2 })} USD
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>

                        <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                          <CardBody className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Icon icon="mdi:trending-up" className="text-emerald-600 w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-default-600 mb-1">Ganancia promedio</p>
                                <p className="text-lg font-semibold text-default-900 mb-1">
                                  {Number(roiData.avgWin || 0).toLocaleString("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 2 })} USD
                                </p>
                                <p className="text-xs text-default-400">
                                  {Number(roiData.avgWin || 0).toFixed(2)} PUNTOS
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>

                        <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                          <CardBody className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Icon icon="mdi:trending-down" className="text-red-600 w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-default-600 mb-1">Pérdida promedio</p>
                                <p className="text-lg font-semibold text-default-900">
                                  {Number(roiData.avgLoss || 0).toLocaleString("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 2 })} USD
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* ROI acumulado */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <h3 className="text-base font-medium flex items-center gap-2 text-default-700">
                          ROI acumulado: {roiTime.last ? roiTime.last.toFixed(2) : 0}%
                          <Icon icon="mdi:information-outline" className="text-default-400 w-4 h-4" />
                        </h3>
                        <p className="text-sm text-default-500">
                          {Number(currentBalance || 0).toLocaleString("es-EC", { style: "currency", currency: "USD", minimumFractionDigits: 2 })} USD
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="flat" className="text-xs px-2 py-1 h-6">3M</Button>
                        <Button size="sm" variant="flat" className="text-xs px-2 py-1 h-6">1Y</Button>
                        <Button size="sm" variant="solid" color="default" className="text-xs px-2 py-1 h-6">TODO</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    {isLoading ? (
                      <Skeleton className="h-[220px] md:h-[260px] w-full rounded-xl" />
                    ) : (
                      <Chart options={roiChartOptions} series={roiChartSeries} type="area" height={roiHeight} />
                    )}
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>

          {/* Mercados */}
          <div className="order-2 md:order-1 flex flex-col gap-4">
            <MarketList onSelect={(symbol) => setSelectedSymbol(symbol)} />
            <Card className="border border-solid border-[#00689b9e]">
              <CardBody>
                <MarketWidget selectedSymbol={selectedSymbol} />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}