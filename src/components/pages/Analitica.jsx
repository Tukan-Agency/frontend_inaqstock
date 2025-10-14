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
  RadioGroup, 
  Radio, 
  Select, 
  SelectItem 
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Chart from "react-apexcharts";
import MarketList from "../../components/objetos/MarketList.jsx";
import MarketWidget from "../objetos/MarketWidget/MarketWidget.jsx";
import TradingTabs from "../objetos/TradingTabs.jsx";
import useCachedData from "../../hooks/useCachedData.js";

export default function Analitica() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState("X:BTCUSD");

  const url = `https://api.polygon.io/v2/aggs/ticker/${selectedSymbol}/range/1/day/2025-01-01/2025-12-31?apiKey=${import.meta.env.VITE_POLYGON_API_KEY}`;

  const { data, loading, error } = useCachedData(url, async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al cargar los datos.");
    return await response.json();
  });

  if (session.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  // Datos mock mejorados distribuidos por semanas
  const mockOrdersData = [
    // Septiembre 2025 - Semana 1 (1-7)
    { id: 1, operationDate: new Date("2025-09-02"), operationValue: 180, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 90, quantity: 1 }] },
    { id: 2, operationDate: new Date("2025-09-05"), operationValue: 120, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 60, quantity: 1 }] },
    
    // Septiembre 2025 - Semana 2 (8-14)
    { id: 3, operationDate: new Date("2025-09-10"), operationValue: 250, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 125, quantity: 1 }] },
    { id: 4, operationDate: new Date("2025-09-12"), operationValue: -75, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 50, quantity: 1 }] },
    
    // Septiembre 2025 - Semana 3 (15-21)
    { id: 5, operationDate: new Date("2025-09-16"), operationValue: 320, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 160, quantity: 1 }] },
    { id: 6, operationDate: new Date("2025-09-19"), operationValue: 95, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 70, quantity: 1 }] },
    
    // Septiembre 2025 - Semana 4 (22-28)
    { id: 7, operationDate: new Date("2025-09-24"), operationValue: 210, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 105, quantity: 1 }] },
    { id: 8, operationDate: new Date("2025-09-27"), operationValue: 140, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 80, quantity: 1 }] },

    // Octubre 2025 - Datos de ejemplo
    { id: 9, operationDate: new Date("2025-10-03"), operationValue: 290, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 145, quantity: 1 }] },
    { id: 10, operationDate: new Date("2025-10-10"), operationValue: -80, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 60, quantity: 1 }] },
    { id: 11, operationDate: new Date("2025-10-17"), operationValue: 380, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 190, quantity: 1 }] },
    { id: 12, operationDate: new Date("2025-10-24"), operationValue: 155, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 85, quantity: 1 }] },

    // Noviembre 2025 - Datos de ejemplo
    { id: 13, operationDate: new Date("2025-11-05"), operationValue: 270, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 135, quantity: 1 }] },
    { id: 14, operationDate: new Date("2025-11-12"), operationValue: 190, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 95, quantity: 1 }] },
    { id: 15, operationDate: new Date("2025-11-19"), operationValue: -45, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 30, quantity: 1 }] },
    { id: 16, operationDate: new Date("2025-11-26"), operationValue: 225, isCapital: false, isWithdrawl: false, operationActions: [{ benefit: 115, quantity: 1 }] },
  ];

  const TRIMESTRES = [
    { key: "1", label: "1° Trimestre" },
    { key: "2", label: "2° Trimestre" },
    { key: "3", label: "3° Trimestre" },
    { key: "4", label: "4° Trimestre" },
  ];

  const SEMESTRES = [
    { key: "1", label: "1° Semestre" },
    { key: "2", label: "2° Semestre" },
  ];

  const PERIOD_OPTIONS = [
    { key: "M", label: "Mes" },
    { key: "T", label: "Trimestre" },
    { key: "S", label: "Semestre" },
  ];

  // Estados principales
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedPeriod, setSelectedPeriod] = useState("M");
  const [selectedMonth, setSelectedMonth] = useState(9); // Septiembre por defecto
  const [selectedTrimestre, setSelectedTrimestre] = useState("1");
  const [selectedSemestre, setSelectedSemestre] = useState("1");

  // Estados para datos calculados
  const [accountData, setAccountData] = useState({
    id: "10343",
    balance: 1001,
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [roiData, setRoiData] = useState({
    roi: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    winningDays: 0,
    losingDays: 0,
    totalDays: 0,
  });

  // Función para obtener datos por semana cuando es vista mensual
  const getWeeklyDataForMonth = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weeklyData = [];
    
    // Función helper para obtener el lunes de la semana
    const getMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    // Empezar desde el primer lunes del mes (o antes si es necesario)
    let currentWeekStart = getMonday(firstDay);
    let weekNumber = 1;

    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekData = {
        weekStart: new Date(currentWeekStart),
        weekEnd: new Date(weekEnd),
        weekNumber: weekNumber,
        total: 0,
        operations: []
      };

      // Buscar operaciones para esta semana
      const operationsForWeek = mockOrdersData.filter(order => {
        const orderDate = new Date(order.operationDate);
        return orderDate >= currentWeekStart && 
               orderDate <= weekEnd &&
               orderDate.getFullYear() === year && 
               orderDate.getMonth() === month - 1;
      });

      // Calcular total para esta semana
      operationsForWeek.forEach(op => {
        weekData.total += op.operationValue;
        weekData.operations.push(op);
      });

      // Solo agregar semanas que tocan el mes actual
      if (weekEnd >= firstDay) {
        weeklyData.push(weekData);
      }

      // Avanzar a la siguiente semana
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }

    return weeklyData;
  };

  // Función para calcular datos por mes
  const calculateMonthlyData = useMemo(() => {
    const monthlyData = {
      ene: { winnings: 0, losses: 0, inversion: 0 },
      feb: { winnings: 0, losses: 0, inversion: 0 },
      mar: { winnings: 0, losses: 0, inversion: 0 },
      abr: { winnings: 0, losses: 0, inversion: 0 },
      may: { winnings: 0, losses: 0, inversion: 0 },
      jun: { winnings: 0, losses: 0, inversion: 0 },
      jul: { winnings: 0, losses: 0, inversion: 0 },
      ago: { winnings: 0, losses: 0, inversion: 0 },
      sep: { winnings: 0, losses: 0, inversion: 0 },
      oct: { winnings: 0, losses: 0, inversion: 0 },
      nov: { winnings: 0, losses: 0, inversion: 0 },
      dic: { winnings: 0, losses: 0, inversion: 0 },
    };

    mockOrdersData.forEach((order) => {
      const orderDate = new Date(order.operationDate);
      if (orderDate.getFullYear() === selectedYear) {
        const month = orderDate.getMonth();
        const monthKeys = [
          "ene", "feb", "mar", "abr", "may", "jun",
          "jul", "ago", "sep", "oct", "nov", "dic",
        ];
        const monthKey = monthKeys[month];

        if (order.operationValue > 0) {
          monthlyData[monthKey].winnings += order.operationValue;
        } else {
          monthlyData[monthKey].losses += Math.abs(order.operationValue);
        }

        if (order.isCapital) {
          order.operationActions.forEach((action) => {
            monthlyData[monthKey].inversion += action.benefit * action.quantity;
          });
        }
      }
    });

    return monthlyData;
  }, [selectedYear]);

  // Actualizar datos del gráfico según el período seleccionado
  useEffect(() => {
    const monthlyData = calculateMonthlyData;
    let labels = [];
    let totalValues = [];

    if (selectedPeriod === "M") {
      // Para vista mensual, mostrar datos por semana
      const weeklyData = getWeeklyDataForMonth(selectedYear, selectedMonth);
      
      // Crear labels para las semanas
      labels = weeklyData.map((week, index) => {
        const weekStart = week.weekStart.getDate();
        const weekEnd = week.weekEnd.getDate();
        return `Sem ${index + 1} (${weekStart}-${weekEnd})`;
      });
      
      totalValues = weeklyData.map(week => week.total);
      
      // Si no hay datos reales, crear datos simulados para mejor visualización
      if (totalValues.filter(val => val !== 0).length === 0) {
        const monthNames = ["ene", "feb", "mar", "abr", "may", "jun",
                           "jul", "ago", "sep", "oct", "nov", "dic"];
        const monthKey = monthNames[selectedMonth - 1];
        const monthTotal = monthlyData[monthKey].winnings - monthlyData[monthKey].losses + monthlyData[monthKey].inversion;
        
        // Distribuir el total del mes entre las semanas
        labels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
        totalValues = [
          monthTotal * 0.2,
          monthTotal * 0.35,
          monthTotal * 0.25,
          monthTotal * 0.2
        ];
      }
    } else if (selectedPeriod === "T") {
      const trimestreMap = {
        1: {
          labels: ["Enero", "Febrero", "Marzo"],
          keys: ["ene", "feb", "mar"],
        },
        2: {
          labels: ["Abril", "Mayo", "Junio"],
          keys: ["abr", "may", "jun"],
        },
        3: {
          labels: ["Julio", "Agosto", "Septiembre"],
          keys: ["jul", "ago", "sep"],
        },
        4: {
          labels: ["Octubre", "Noviembre", "Diciembre"],
          keys: ["oct", "nov", "dic"],
        },
      };

      const trimestre = trimestreMap[selectedTrimestre];
      labels = trimestre.labels;
      totalValues = trimestre.keys.map((key) => 
        monthlyData[key].winnings - monthlyData[key].losses + monthlyData[key].inversion
      );
    } else if (selectedPeriod === "S") {
      if (selectedSemestre === "1") {
        labels = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"];
        const keys = ["ene", "feb", "mar", "abr", "may", "jun"];
        totalValues = keys.map((key) => 
          monthlyData[key].winnings - monthlyData[key].losses + monthlyData[key].inversion
        );
      } else {
        labels = ["Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const keys = ["jul", "ago", "sep", "oct", "nov", "dic"];
        totalValues = keys.map((key) => 
          monthlyData[key].winnings - monthlyData[key].losses + monthlyData[key].inversion
        );
      }
    }

    setChartData({
      labels,
      totalValues,
    });
  }, [
    selectedPeriod,
    selectedMonth,
    selectedTrimestre,
    selectedSemestre,
    selectedYear,
    calculateMonthlyData,
  ]);

  // Paleta de colores basada en #00689b
  const primaryColor = "#00689b";
  const colorPalette = {
    primary: "#00689b",
    light: "#4a9ece",
    lighter: "#7bb3d9",
    lightest: "#b3d4ea"
  };

  // Opciones del gráfico - Area Chart optimizado para vista semanal
  const chartOptions = {
    chart: {
      type: "area",
      height: 400,
      toolbar: { show: false },
      background: "transparent",
      zoom: { enabled: false },
    },
    dataLabels: { 
      enabled: selectedPeriod === "M",
      style: {
        fontSize: "11px",
        colors: [primaryColor],
        fontWeight: 300,
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        borderRadius: 2,
        padding: 4,
        opacity: 0.9,
        borderWidth: 1,
        borderColor: primaryColor,
      }
    },
    stroke: {
      curve: "smooth",
      width: selectedPeriod === "M" ? 3 : 2,
      colors: [primaryColor],
    },
    markers: {
      size: selectedPeriod === "M" ? 6 : 4,
      colors: [primaryColor],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 8,
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
        colorStops: [
          {
            offset: 0,
            color: primaryColor,
            opacity: 0.4
          },
          {
            offset: 100,
            color: primaryColor,
            opacity: 0.1
          }
        ]
      },
    },
    xaxis: {
      categories: chartData.labels,
      labels: {
        style: {
          colors: "var(--nextui-colors-default-500)",
          fontSize: "11px",
          fontFamily: "Inter, sans-serif",
        },
        rotate: selectedPeriod === "M" ? -45 : 0,
        maxHeight: selectedPeriod === "M" ? 60 : 40,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: {
        show: false,
      },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          colors: "var(--nextui-colors-default-500)",
          fontSize: "11px",
          fontFamily: "Inter, sans-serif",
        },
        formatter: function (val) {
          return "$" + val.toFixed(0);
        },
      },
    },
    grid: {
      show: true,
      borderColor: "var(--nextui-colors-default-200)",
      strokeDashArray: 0,
      position: "back",
      xaxis: {
        lines: { show: false },
      },
      yaxis: {
        lines: { show: true },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
      },
      y: {
        formatter: function (val) {
          return "$" + val.toFixed(2) + " USD";
        },
      },
      x: {
        formatter: function (val) {
          return selectedPeriod === "M" ? `Semana ${val}` : val;
        },
      },
    },
    legend: {
      show: false,
    },
    colors: [primaryColor],
  };

  // Opciones del gráfico ROI
  const roiChartOptions = {
    chart: {
      type: "area",
      height: 250,
      toolbar: { show: false },
      background: "transparent",
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 1,
      colors: [colorPalette.light],
    },
    fill: {
      type: "solid",
      colors: [colorPalette.lightest],
      opacity: 0.3,
    },
    xaxis: {
      categories: ["Dic 2024", "Feb 2025", "Mar 2025", "Abr 2025", "May 2025", "Jun 2025", "Jul 2025", "Sep 2025"],
      labels: {
        style: {
          colors: "var(--nextui-colors-default-500)",
          fontSize: "11px",
          fontFamily: "Inter, sans-serif",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          colors: "var(--nextui-colors-default-500)",
          fontSize: "11px",
          fontFamily: "Inter, sans-serif",
        },
        formatter: function (val) {
          return val + "%";
        },
      },
      min: -192,
      max: 192,
      tickAmount: 6,
    },
    grid: {
      show: true,
      borderColor: "var(--nextui-colors-default-200)",
      strokeDashArray: 0,
      xaxis: {
        lines: { show: false },
      },
      yaxis: {
        lines: { show: true },
      },
    },
    tooltip: {
      enabled: true,
      theme: "light",
      y: {
        formatter: function (val) {
          return val + "%";
        },
      },
    },
    legend: { show: false },
  };

  const roiChartSeries = [
    {
      name: "ROI",
      data: [0, 0, 0, 0, 0, 0, 0, 0],
    },
  ];

  const chartSeries = [
    {
      name: "Total",
      data: chartData.totalValues || [],
    },
  ];

  return (
    <div className="text-foreground bg-background h-[100vh]">
      <div className="flex flex-col gap-4 p-5">
        <Nav />
        <div className="pt-5 flex flex-row gap-4 h-[800px]">
          {/* Columna izquierda (estática) */}
          <div className="flex flex-col flex-[1] gap-4">
            <MarketList onSelect={(symbol) => setSelectedSymbol(symbol)} />

            <Card className="flex-1 min-h-[350px] border border-solid border-[#00689b9e]">
              <CardBody>
                <MarketWidget selectedSymbol={selectedSymbol} />
              </CardBody>
            </Card>
          </div>

          {/* Columna derecha - Dashboard principal en Card */}
          <Card className="flex-[3] border border-solid border-[#00689b9e]">
            <CardBody className="p-6">
              <div className="h-full overflow-y-auto">
                <div className="space-y-6">
                  {/* Controles de Período */}
                  <div className="flex flex-wrap gap-3 items-center p-4 bg-default-50 dark:bg-default-100 rounded-lg">
                    <div className="text-sm font-medium text-default-700">Año</div>
                    <Input
                      size="sm"
                      type="number"
                      value={selectedYear.toString()}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                      className="w-20"
                    />

                    <RadioGroup
                      value={selectedPeriod}
                      onValueChange={setSelectedPeriod}
                      orientation="horizontal"
                      size="sm"
                    >
                      {PERIOD_OPTIONS.map((option) => (
                        <Radio key={option.key} value={option.key}>
                          {option.label}
                        </Radio>
                      ))}
                    </RadioGroup>

                    {selectedPeriod === "M" && (
                      <Select
                        size="sm"
                        selectedKeys={[selectedMonth.toString()]}
                        onSelectionChange={(keys) =>
                          setSelectedMonth(parseInt(Array.from(keys)[0]))
                        }
                        className="w-32"
                        placeholder="Mes"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem
                            key={(i + 1).toString()}
                            value={(i + 1).toString()}
                          >
                            {new Date(2025, i, 1).toLocaleDateString("es-ES", {
                              month: "short",
                            })}
                          </SelectItem>
                        ))}
                      </Select>
                    )}

                    {selectedPeriod === "T" && (
                      <Select
                        size="sm"
                        selectedKeys={[selectedTrimestre]}
                        onSelectionChange={(keys) =>
                          setSelectedTrimestre(Array.from(keys)[0])
                        }
                        className="w-32"
                        placeholder="Trimestre"
                      >
                        {TRIMESTRES.map((trimestre) => (
                          <SelectItem key={trimestre.key} value={trimestre.key}>
                            {trimestre.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}

                    {selectedPeriod === "S" && (
                      <RadioGroup
                        value={selectedSemestre}
                        onValueChange={setSelectedSemestre}
                        orientation="horizontal"
                        size="sm"
                      >
                        {SEMESTRES.map((semestre) => (
                          <Radio key={semestre.key} value={semestre.key}>
                            {semestre.label}
                          </Radio>
                        ))}
                      </RadioGroup>
                    )}
                  </div>

                  {/* Gráfico Principal con métricas al lado */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <h3 className="text-lg font-medium text-default-700">Movimientos</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <div className="flex gap-6">
                        {/* Gráfico - Lado izquierdo */}
                        <div className="flex-1">
                          {chartData.labels && chartData.labels.length > 0 ? (
                            <Chart
                              options={chartOptions}
                              series={chartSeries}
                              type="area"
                              height={400}
                            />
                          ) : (
                            <div className="h-96 flex items-center justify-center text-default-400 text-sm">
                              Selecciona un período para ver los datos
                            </div>
                          )}
                        </div>

                        {/* Métricas - Lado derecho */}
                        <div className="w-72 space-y-4">
                          <h4 className="text-base font-medium text-default-700 mb-4">
                            Rendimiento de trades
                          </h4>
                          
                          {/* Card 1: Ganancia promedio */}
                          <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                            <CardBody className="py-4 px-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Icon icon="mdi:trending-up" className="text-emerald-600 w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-default-600 mb-1">Ganancia promedio</p>
                                  <p className="text-lg font-semibold text-default-900 mb-1">
                                    {roiData.avgWin.toFixed(2)} USD
                                  </p>
                                  <p className="text-xs text-default-400">
                                    {roiData.avgWin.toFixed(2)} PUNTOS
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          {/* Card 2: Pérdida promedio */}
                          <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                            <CardBody className="py-4 px-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Icon icon="mdi:trending-down" className="text-red-600 w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-default-600 mb-1">Pérdida promedio</p>
                                  <p className="text-lg font-semibold text-default-900 mb-1">
                                    {roiData.avgLoss.toFixed(2)} USD
                                  </p>
                                  <p className="text-xs text-default-400">
                                    {roiData.avgLoss.toFixed(2)} PUNTOS
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          {/* Card 3: Profit Factor */}
                          <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                            <CardBody className="py-4 px-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Icon icon="mdi:chart-line" className="text-blue-600 w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <p className="text-sm text-default-600">Profit Factor</p>
                                    <Icon icon="mdi:information-outline" className="text-default-400 w-3 h-3" />
                                  </div>
                                  <p className="text-lg font-semibold text-default-900">
                                    {roiData.profitFactor.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* ROI Chart */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <h3 className="text-base font-medium flex items-center gap-2 text-default-700">
                            ROI: {roiData.roi}%
                            <Icon icon="mdi:information-outline" className="text-default-400 w-4 h-4" />
                          </h3>
                          <p className="text-sm text-default-500">
                            {roiData.roi.toFixed(2)} USD
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="flat"
                            className="text-xs px-2 py-1 h-6"
                          >
                            3M
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            className="text-xs px-2 py-1 h-6"
                          >
                            1Y
                          </Button>
                          <Button
                            size="sm"
                            variant="solid"
                            color="default"
                            className="text-xs px-2 py-1 h-6"
                          >
                            TODO
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <Chart
                        options={roiChartOptions}
                        series={roiChartSeries}
                        type="area"
                        height={250}
                      />
                    </CardBody>
                  </Card>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}