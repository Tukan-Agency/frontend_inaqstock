import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  RadioGroup,
  Radio,
  Select,
  SelectItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Chart from "react-apexcharts";
import { listUserOrders } from "../../../services/orders.service";
import { useSession } from "../../../../hooks/use-session";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { s } from "framer-motion/client";
import { useAccountMode } from "../../../../context/AccountModeContext"; // ✅ IMPORTAR CONTEXTO

export default function ListaOrdenes() {
  const { session } = useSession();
  const { mode } = useAccountMode(); // ✅ OBTENER MODO (real/demo)

  // Id del cliente desde la sesión
  const clientId = useMemo(
    () =>
      session?.user?.clientId ||
      session?.user?.id ||
      session?.user?._id ||
      session?.user?.uid ||
      null,
    [session]
  );
  console.log("usuario: ", session.user);

  // SequenceId (para nombre de archivo PDF, etc.)
  const clientIdQuery = useMemo(() => {
    return session?.user?.sequenceId ?? session?.user?.user?.sequenceId ?? "";
  }, [session]);

  const BASE_DELAY_MS = 150;
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLike, setOrdersLike] = useState([]);

  // Modal Detalles
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };
  const closeDetails = () => setIsDetailsOpen(false);

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

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState("M");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedTrimestre, setSelectedTrimestre] = useState("1");
  const [selectedSemestre, setSelectedSemestre] = useState("1");

  const formatCurrency = (n) =>
    Number(n || 0)?.toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const sumActionsCapital = (ops = []) =>
    (ops || []).reduce(
      (acc, a) => acc + Number(a?.benefit || 0) * Number(a?.quantity || 0),
      0
    );

  // Cargar órdenes desde backend
  useEffect(() => {
    let cancelled = false;

    if (!clientId) {
      setIsLoading(false);
      setOrdersLike([]);
      return;
    }

    setIsLoading(true);

    async function load() {
      try {
        const minDelay = new Promise((r) => setTimeout(r, BASE_DELAY_MS));
        const [ordenes] = await Promise.all([
          listUserOrders({ clientId, mode }), // ✅ PASAR MODO AL SERVICIO
          minDelay,
        ]);

        const normalized = (ordenes || []).map((o, idx) => ({
          id: o._id || o.id || idx,
          code: `#${o.operationNumber ?? ""}`,
          operationNumber: o.operationNumber,
          operationDate: o.operationDate,
          operationValue: Number(o.operationValue || 0),
          status: o.operationStatus || o.status || "Finalizado",
          isCapital: Boolean(o.isCapital),
          isWithdrawl: Boolean(o.isWithdrawl),
          operationActions: Array.isArray(o.operationActions)
            ? o.operationActions
            : [],
          clientId: o.clientId,
          _raw: o,
        }));

        if (!cancelled) setOrdersLike(normalized);
      } catch (e) {
        console.error("Error cargando órdenes:", e);
        if (!cancelled) setOrdersLike([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [clientId, mode]); // ✅ AGREGAR mode A DEPENDENCIAS

  // Semanas del mes (para gráfico)
  const getWeeklyDataForMonth = (year, month) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weekly = [];

    const getMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    let currentWeekStart = getMonday(firstDay);
    let weekNumber = 1;

    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const total = ordersLike.reduce((acc, order) => {
        const d = new Date(order.operationDate);
        if (
          d >= currentWeekStart &&
          d <= weekEnd &&
          d.getFullYear() === year &&
          d.getMonth() === month - 1
        ) {
          return acc + Number(order.operationValue || 0);
        }
        return acc;
      }, 0);

      weekly.push({
        weekStart: new Date(currentWeekStart),
        weekEnd: new Date(weekEnd),
        weekNumber,
        total,
      });
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }
    return weekly;
  };

  // Totales por mes (para gráfico)
  const calculateMonthlyTotals = () => {
    const monthly = {
      ene: { total: 0 },
      feb: { total: 0 },
      mar: { total: 0 },
      abr: { total: 0 },
      may: { total: 0 },
      jun: { total: 0 },
      jul: { total: 0 },
      ago: { total: 0 },
      sep: { total: 0 },
      oct: { total: 0 },
      nov: { total: 0 },
      dic: { total: 0 },
    };

    ordersLike.forEach((order) => {
      const d = new Date(order.operationDate);
      if (d.getFullYear() === selectedYear) {
        const key = [
          "ene",
          "feb",
          "mar",
          "abr",
          "may",
          "jun",
          "jul",
          "ago",
          "sep",
          "oct",
          "nov",
          "dic",
        ][d.getMonth()];
        monthly[key].total += Number(order.operationValue || 0);
      }
    });

    return monthly;
  };

  // Datos del gráfico
  const [chartData, setChartData] = useState({ labels: [], totalValues: [] });
  useEffect(() => {
    const monthly = calculateMonthlyTotals();
    let labels = [];
    let totalValues = [];

    if (selectedPeriod === "M") {
      const weekly = getWeeklyDataForMonth(selectedYear, selectedMonth);
      labels = weekly.map((_, i) => `Semana ${i + 1}`);
      totalValues = weekly.map((w) => w.total);

      if (!totalValues.some((v) => v !== 0)) {
        const key = [
          "ene",
          "feb",
          "mar",
          "abr",
          "may",
          "jun",
          "jul",
          "ago",
          "sep",
          "oct",
          "nov",
          "dic",
        ][selectedMonth - 1];
        const monthTotal = monthly[key].total;
        labels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
        totalValues = [0.2, 0.35, 0.25, 0.2].map((p) => monthTotal * p);
      }
    } else if (selectedPeriod === "T") {
      const map = {
        1: {
          labels: ["Enero", "Febrero", "Marzo"],
          keys: ["ene", "feb", "mar"],
        },
        2: { labels: ["Abril", "Mayo", "Junio"], keys: ["abr", "may", "jun"] },
        3: {
          labels: ["Julio", "Agosto", "Septiembre"],
          keys: ["jul", "ago", "sep"],
        },
        4: {
          labels: ["Octubre", "Noviembre", "Diciembre"],
          keys: ["oct", "nov", "dic"],
        },
      };
      const t = map[selectedTrimestre];
      labels = t.labels;
      totalValues = t.keys.map((k) => monthly[k].total);
    } else {
      if (selectedSemestre === "1") {
        labels = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"];
        const keys = ["ene", "feb", "mar", "abr", "may", "jun"];
        totalValues = keys.map((k) => monthly[k].total);
      } else {
        labels = [
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ];
        const keys = ["jul", "ago", "sep", "oct", "nov", "dic"];
        totalValues = keys.map((k) => monthly[k].total);
      }
    }

    setChartData({ labels, totalValues });
  }, [
    selectedPeriod,
    selectedMonth,
    selectedTrimestre,
    selectedSemestre,
    selectedYear,
    ordersLike,
  ]);

  // Filas tabla
  const columns = [
    { key: "operacion", label: "OPERACION" },
    { key: "fecha", label: "FECHA" },
    { key: "estado", label: "ESTADO" },
    { key: "capital", label: "CAPITAL" },
    { key: "ganancia", label: "GANANCIA" },
    { key: "perdida", label: "PERDIDA" },
    { key: "retiros", label: "RETIROS" },
    { key: "vermas", label: "VER MÁS" },
  ];

  const tableRows = useMemo(() => {
    return ordersLike
      .slice()
      .sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
      .map((o, idx) => {
        const actionsTotal = sumActionsCapital(o.operationActions);
        const capital = o.isCapital && !o.isWithdrawl ? actionsTotal : 0;
        const retiros = o.isWithdrawl ? actionsTotal : 0;
        const ganancia =
          !o.isWithdrawl && o.operationValue > 0 ? o.operationValue : 0;
        const perdida =
          !o.isWithdrawl && o.operationValue < 0
            ? Math.abs(o.operationValue)
            : 0;

        return {
          id: o.id || idx,
          operacion: o.code || `#${idx + 1}`,
          fecha: new Date(o.operationDate).toLocaleDateString("es-EC"),
          estado: o.status || "Finalizado",
          capital,
          ganancia,
          perdida,
          retiros,
          original: o,
        };
      });
  }, [ordersLike]);

  // Totales
  const totals = useMemo(() => {
    return {
      capital: tableRows.reduce((acc, r) => acc + Number(r.capital || 0), 0),
      ganancia: tableRows.reduce((acc, r) => acc + Number(r.ganancia || 0), 0),
      perdida: tableRows.reduce((acc, r) => acc + Number(r.perdida || 0), 0),
      retiros: tableRows.reduce((acc, r) => acc + Number(r.retiros || 0), 0),
    };
  }, [tableRows]);

  // Balance actual (según tu fórmula getCurrentBalance)
  const currentBalance = useMemo(() => {
    let balance = 0;
    ordersLike.forEach((order) => {
      if (order.isCapital) {
        balance += sumActionsCapital(order.operationActions);
      }
      balance += Number(order.operationValue || 0);
    });
    return balance;
  }, [ordersLike]);

  // Métricas (para los cuadritos): promedio de ganancia y de pérdida
  const roiData = useMemo(() => {
    const wins = tableRows.filter((r) => Number(r.ganancia) > 0);
    const losses = tableRows.filter((r) => Number(r.perdida) > 0);

    const sumWins = wins.reduce((a, r) => a + Number(r.ganancia), 0);
    const sumLosses = losses.reduce((a, r) => a + Number(r.perdida), 0);

    const avgWin = wins.length ? sumWins / wins.length : 0;
    const avgLoss = losses.length ? sumLosses / losses.length : 0;

    return { avgWin, avgLoss };
  }, [tableRows]);

  // PDF
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const pdfContentRef = useRef(null);

  const generateAuthCode = (length = 30) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const exportPDF = async () => {
    setAuthCode(generateAuthCode(25));
    setIsPdfRendering(true);

    await new Promise((r) => requestAnimationFrame(() => r()));
    await new Promise((r) => setTimeout(r, 120));

    const content = pdfContentRef.current;
    if (!content) {
      setIsPdfRendering(false);
      return;
    }

    try {
      const canvas = await html2canvas(content, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      let heightLeft = pdfHeight;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);

      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`reporte-movimientos-${clientIdQuery || ""}.pdf`);
    } finally {
      setIsPdfRendering(false);
    }
  };

  // Paleta de colores
  const primaryColor = "#00689b";

  // Opciones de la gráfica
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
      style: { fontSize: "11px", colors: [primaryColor], fontWeight: 300 },
      background: {
        enabled: true,
        foreColor: "#fff",
        borderRadius: 2,
        padding: 4,
        opacity: 0.9,
        borderWidth: 1,
        borderColor: primaryColor,
      },
    },
    stroke: {
      curve: "smooth",
      width: selectedPeriod === "M" ? 3 : 2,
      colors: [primaryColor],
    },
    markers: {
      size: selectedPeriod === "M" ? 6 : 4,
      colors: [primaryColor],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 8 },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: primaryColor, opacity: 0.4 },
          { offset: 100, color: primaryColor, opacity: 0.1 },
        ],
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
      crosshairs: { show: false },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          colors: "var(--nextui-colors-default-500)",
          fontSize: "11px",
          fontFamily: "Inter, sans-serif",
        },
        formatter: (val) => "$" + val.toFixed(0),
      },
    },
    grid: {
      show: true,
      borderColor: "var(--nextui-colors-default-200)",
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      style: { fontSize: "12px", fontFamily: "Inter, sans-serif" },
      y: { formatter: (val) => "$" + val.toFixed(2) + " USD" },
      x: {
        formatter: (val) => (selectedPeriod === "M" ? `Semana ${val}` : val),
      },
    },
    legend: { show: false },
    colors: [primaryColor],
  };
  const chartSeries = [{ name: "Total", data: chartData.totalValues || [] }];

  if (isLoading || !clientId) {
    return (
      <div className="p-6">
        <Card className="shadow-none rounded-3xl">
          <CardBody className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap bg-default-50 dark:bg-default-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Skeleton className="h-7 w-32 rounded-lg" />
                <Skeleton className="h-7 w-32 rounded-lg" />
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-7 w-28 rounded-lg" />
                <Skeleton className="h-7 w-28 rounded-lg" />
              </div>
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Card className="mt-2 border-0 shadow-md rounded-2xl">
              <CardBody className="p-4 space-y-4">
                <div className="grid grid-cols-8 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full rounded-md" />
                  ))}
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, row) => (
                    <div key={row} className="grid grid-cols-8 gap-4">
                      <Skeleton className="h-5 w-full rounded-md" />
                      <Skeleton className="h-5 w-full rounded-md" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-5 w-full rounded-md" />
                      <Skeleton className="h-5 w-full rounded-md" />
                      <Skeleton className="h-5 w-full rounded-md" />
                      <Skeleton className="h-5 w-full rounded-md" />
                      <Skeleton className="h-7 w-7 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Datos para el modal
  const modalOrder = selectedOrder;
  const modalActions = modalOrder?.operationActions || [];
  const modalItemsTotal = sumActionsCapital(modalActions);
  const modalFinalTotal = modalOrder?.isCapital
    ? modalItemsTotal
    : Number(modalOrder?.operationValue || 0);

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-default-50 dark:bg-default-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Chip variant="flat" color="default" className="text-sm">
                Mi cuenta <span className="mx-1">|</span> ID: {clientIdQuery}
              </Chip>

              <div className="flex items-center gap-2">
                <span className="text-sm text-default-700">Año</span>
                <Input
                  size="sm"
                  type="number"
                  value={String(selectedYear)}
                  onChange={(e) =>
                    setSelectedYear(parseInt(e.target.value || "0", 10))
                  }
                  min="2020"
                  max="2035"
                  className="w-24"
                />
              </div>

              {/* 🔄 Tabs en lugar de RadioGroup */}
              <Tabs
                selectedKey={selectedPeriod}
                onSelectionChange={(key) => setSelectedPeriod(key)}
                variant="underlined"
                size="sm"
                aria-label="Periodo de análisis"
                color="primary"
                className="h-10"
              >
                <Tab key="M" title="Mes" />
                <Tab key="T" title="Trimestre" />
                <Tab key="S" title="Semestre" />
              </Tabs>

              {/* Select dinámico según periodo */}
              {selectedPeriod === "M" && (
                <Select
                  size="sm"
                  selectedKeys={[String(selectedMonth)]}
                  onSelectionChange={(keys) =>
                    setSelectedMonth(parseInt(Array.from(keys)[0], 10))
                  }
                  className="w-32"
                  placeholder="Mes"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={String(i + 1)} value={String(i + 1)}>
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
                  className="w-36"
                  placeholder="Trimestre"
                >
                  {TRIMESTRES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {selectedPeriod === "S" && (
                <Select
                  size="sm"
                  selectedKeys={[selectedSemestre]}
                  onSelectionChange={(keys) =>
                    setSelectedSemestre(Array.from(keys)[0])
                  }
                  className="w-36"
                  placeholder="Semestre"
                >
                  {SEMESTRES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <Button
              variant="bordered"
              color="danger"
              startContent={<Icon icon="mdi:file-pdf-box" width={18} />}
              className="rounded-lg"
              onClick={exportPDF}
            >
              Descargar pdf
            </Button>
          </div>

          {/* Gráfico + métricas (3 cuadritos) */}
          <div className="mt-6">
            <h3 className="text-base font-medium text-default-700 mb-3">
              Movimientos
            </h3>

            <div className="flex gap-6">
              {/* Gráfico - izquierda */}
              <div className="flex-1">
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="area"
                  height={400}
                />
              </div>

              {/* Métricas - derecha (Balance primero) */}
              <div className="w-72 space-y-4">
                <h4 className="text-base font-medium text-default-700 mb-4">
                  Rendimiento de trades
                </h4>

                {/* Card 1: Balance */}
                <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                  <CardBody className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon
                          icon="mdi:wallet"
                          className="text-blue-600 w-4 h-4"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-default-600 mb-1">Balance</p>
                        <p className="text-lg font-semibold text-default-900">
                          {formatCurrency(currentBalance)} USD
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Card 2: Ganancia promedio */}
                <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                  <CardBody className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon
                          icon="mdi:trending-up"
                          className="text-emerald-600 w-4 h-4"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-default-600 mb-1">
                          Ganancia promedio
                        </p>
                        <p className="text-lg font-semibold text-default-900 mb-1">
                          {formatCurrency(roiData.avgWin)} USD
                        </p>
                        <p className="text-xs text-default-400">
                          {roiData.avgWin.toFixed(2)} PUNTOS
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Card 3: Pérdida promedio */}
                <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                  <CardBody className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon
                          icon="mdi:trending-down"
                          className="text-red-600 w-4 h-4"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-default-600 mb-1">
                          Pérdida promedio
                        </p>
                        <p className="text-lg font-semibold text-default-900 mb-1">
                          {formatCurrency(roiData.avgLoss)} USD
                        </p>
                        <p className="text-xs text-default-400">
                          {roiData.avgLoss.toFixed(2)} PUNTOS
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>

          {/* Contenido PDF: se monta solo durante exportación */}
          {isPdfRendering && (
            <div
              ref={pdfContentRef}
              id="pdf-content"
              style={{
                position: "fixed",
                left: "-10000px",
                top: 0,
                background: "#fff",
                padding: 24,
                width: 600,
                zIndex: -1,
                color: "#111",
                fontFamily:
                  "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
              }}
            >
              {/* Header resumen */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 22 }}>Mi Cuenta</div>
                <div>ID: {clientIdQuery}</div>
                <div style={{ fontSize: 20, fontWeight: 500 }}>
                  Balance: {formatCurrency(currentBalance)}
                </div>
              </div>

              <h2 style={{ textAlign: "center", marginBottom: 18 }}>
                REPORTE DE ÓRDENES
              </h2>
              <div
                style={{
                  background: "#f8f8f8",
                  borderRadius: 8,
                  padding: "18px 12px",
                  marginBottom: 20,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                <div style={{ marginBottom: 8 }}>Resumen de Totales</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "right", padding: 6 }}>
                        Capital
                      </th>
                      <th style={{ textAlign: "right", padding: 6 }}>
                        Ganancia
                      </th>
                      <th style={{ textAlign: "right", padding: 6 }}>
                        Pérdida
                      </th>
                      <th style={{ textAlign: "right", padding: 6 }}>
                        Retiros
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "right", padding: 6 }}>
                        {formatCurrency(totals.capital)}
                      </td>
                      <td style={{ textAlign: "right", padding: 6 }}>
                        {formatCurrency(totals.ganancia)}
                      </td>
                      <td style={{ textAlign: "right", padding: 6 }}>
                        {formatCurrency(totals.perdida)}
                      </td>
                      <td style={{ textAlign: "right", padding: 6 }}>
                        {formatCurrency(totals.retiros)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tabla principal (misma data que la UI) */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: 18,
                  fontSize: 15,
                }}
              >
                <thead>
                  <tr style={{ background: "#e8e8e8" }}>
                    <th style={{ padding: 6, textAlign: "left" }}>Operación</th>
                    <th style={{ padding: 6, textAlign: "left" }}>Fecha</th>
                    <th style={{ padding: 6, textAlign: "left" }}>Estado</th>
                    <th style={{ padding: 6, textAlign: "right" }}>
                      $ Capital
                    </th>
                    <th style={{ padding: 6, textAlign: "right" }}>
                      $ Ganancia
                    </th>
                    <th style={{ padding: 6, textAlign: "right" }}>
                      $ Pérdida
                    </th>
                    <th style={{ padding: 6, textAlign: "right" }}>
                      $ Retiros
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: 6 }}>{row.operacion}</td>
                      <td style={{ padding: 6 }}>{row.fecha}</td>
                      <td style={{ padding: 6 }}>
                        <span
                          style={{
                            background:
                              row.estado === "Finalizado"
                                ? "#4caf5045"
                                : "#086721",
                            color:
                              row.estado === "Finalizado"
                                ? "#086721"
                                : "#086721",
                            borderRadius: 4,
                            padding: "0px 4px 14px 4px",
                            fontSize: 12,
                            margin: "auto",
                          }}
                        >
                          {row.estado}
                        </span>
                      </td>
                      <td style={{ padding: 6, textAlign: "right" }}>
                        {formatCurrency(row.capital)}
                      </td>
                      <td style={{ padding: 6, textAlign: "right" }}>
                        {formatCurrency(row.ganancia)}
                      </td>
                      <td style={{ padding: 6, textAlign: "right" }}>
                        {formatCurrency(row.perdida)}
                      </td>
                      <td style={{ padding: 6, textAlign: "right" }}>
                        {formatCurrency(row.retiros)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div style={{ fontSize: 12, color: "#666", marginTop: 18 }}>
                Informe generado el {new Date().toLocaleDateString("es-EC")} por
                solicitud del usuario.
                <br />
                Autenticación: <b>{authCode}</b>
              </div>
            </div>
          )}

          {/* Tabla visible en la UI */}
          <Card className="mt-6 border-0 shadow-md rounded-2xl">
            <CardBody className="p-0">
              <Table
                aria-label="Tabla de órdenes"
                removeWrapper
                classNames={{
                  table: "rounded-2xl",
                  th: "text-[11px] font-semibold text-default-500 uppercase tracking-wide bg-transparent",
                  tr: "hover:bg-default-50/60",
                  td: "text-sm",
                }}
              >
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                  )}
                </TableHeader>
                <TableBody emptyContent="No hay órdenes para mostrar">
                  {tableRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.operacion}</TableCell>
                      <TableCell>{row.fecha}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            row.estado === "Finalizado" ? "success" : "default"
                          }
                          className="font-medium"
                          startContent={
                            <Icon icon="mdi:check-circle" width={16} />
                          }
                        >
                          {row.estado}
                        </Chip>
                      </TableCell>
                      <TableCell>{formatCurrency(row.capital)}</TableCell>
                      <TableCell>{formatCurrency(row.ganancia)}</TableCell>
                      <TableCell>{formatCurrency(row.perdida)}</TableCell>
                      <TableCell>{formatCurrency(row.retiros)}</TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onPress={() => openDetails(row.original)}
                          aria-label="Ver detalles"
                        >
                          <Icon
                            icon="mdi:eye-outline"
                            width={20}
                            className="text-default-500"
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </CardBody>
      </Card>

      {/* Modal de Detalles de la orden */}
      <Modal
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Detalles de la orden
              </ModalHeader>
              <ModalBody>
                {modalOrder ? (
                  <div className="space-y-4">
                    <p className="text-sm text-default-700">
                      El movimiento{" "}
                      <strong> #{modalOrder.operationNumber ?? ""}</strong> se
                      realizó el{" "}
                      <Chip
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="mx-1"
                      >
                        {formatDate(modalOrder.operationDate)}
                      </Chip>
                      y está actualmente{" "}
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          modalOrder.status === "Finalizado"
                            ? "success"
                            : "default"
                        }
                        className="mx-1"
                      >
                        {String(modalOrder.status).toUpperCase()}
                      </Chip>
                      .
                    </p>

                    <Table
                      aria-label="Detalle de conceptos"
                      removeWrapper
                      classNames={{
                        table: "rounded-xl",
                        th: "text-[11px] font-semibold text-default-500 uppercase tracking-wide bg-transparent",
                        td: "text-sm",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>CUENTA</TableColumn>
                        <TableColumn className="text-right">TOTAL</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {modalActions.map((a, i) => {
                          const itemTotal =
                            Number(a.benefit || 0) * Number(a.quantity || 0);
                          return (
                            <TableRow key={`${a._id || i}`}>
                              <TableCell>
                                <div className="flex items-center gap-2 text-default-600">
                                  <Icon
                                    icon="mdi:card-account-details-outline"
                                    width={18}
                                  />
                                  <span>
                                    {a.name} x{a.quantity}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(itemTotal)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-2 text-default-800 font-medium">
                              <Icon icon="mdi:currency-usd" width={18} />
                              <span>Total</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(modalFinalTotal)} USD
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-sm text-default-500">
                    Sin datos de la orden.
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose || closeDetails}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}