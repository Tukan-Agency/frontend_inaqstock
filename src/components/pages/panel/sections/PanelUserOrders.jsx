import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  addToast,
  Tabs,
  Tab,
  Select,
  SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Chart from "react-apexcharts";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  listUserOrders,
  createOrder,
  updateOrderActions,
  updateOrderStatus,
  updateOrderStatusEnd, // <- finalizar con valores
  deleteOrderById,
} from "../../../services/orders.service.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Subcomponentes
import OrdersTable from "./panelusersordessrc/OrdersTable.jsx";
import DetailsModal from "./panelusersordessrc/modals/DetailsModal.jsx";
import EditModal from "./panelusersordessrc/modals/EditModal.jsx";
import FinishModal from "./panelusersordessrc/modals/FinishModal.jsx";
import NewOrderModal from "./panelusersordessrc/modals/NewOrderModal.jsx";

const KIND = {
  MOVEMENT: "movement",
  CAPITAL: "capital",
  CAPITAL_WITHDRAWL: "capitalWithdrawl",
  PROFIT_WITHDRAWL: "profitWithdrawl",
};

// Mapea estados DB <-> UI
const mapDbToUiStatus = (s) => (s === "Pendiente" ? "En progreso" : s || "En progreso");

export default function PanelUserOrders() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const userFromState = location.state?.user || null;

  const [ordersLike, setOrdersLike] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);

  // Selección
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Nueva orden
  const [accionistaName, setAccionistaName] = useState("");
  const [accionistaQty, setAccionistaQty] = useState("");
  const [accionistaBenefit, setAccionistaBenefit] = useState("");
  const [newActions, setNewActions] = useState([]);
  const [firstKind, setFirstKind] = useState(null);

  // Edit
  const [editActions, setEditActions] = useState([]);
  const [editDate, setEditDate] = useState("");

  // Finalizar (ganancia/pérdida)
  const [finishGain, setFinishGain] = useState("");
  const [finishLoss, setFinishLoss] = useState("");

  // Filtros gráfica
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
  const [selectedPeriod, setSelectedPeriod] = useState("M"); // M, T, S, Y
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedTrimestre, setSelectedTrimestre] = useState("1");
  const [selectedSemestre, setSelectedSemestre] = useState("1");

  // PDF
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const pdfContentRef = useRef(null);
  const clientIdQuery = useMemo(() => userFromState?.sequenceId || userId || "", [userFromState, userId]);

  // Cargar órdenes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const ordenes = await listUserOrders({ clientId: String(userId) });
        const normalized = (ordenes || []).map((o, idx) => {
          const dbStatus = o.operationStatus || o.status;
          return {
            id: o._id || o.id || idx,
            code: `#${o.operationNumber ?? ""}`,
            operationNumber: o.operationNumber ?? idx + 1001,
            operationDate: o.operationDate || new Date().toISOString(),
            operationValue: Number(o.operationValue || 0),
            status: mapDbToUiStatus(dbStatus),
            isCapital: Boolean(o.isCapital),
            isWithdrawl: Boolean(o.isWithdrawl),
            operationActions: Array.isArray(o.operationActions) ? o.operationActions : [],
            clientId: o.clientId || userId,
            _raw: o,
          };
        });
        if (!cancelled) setOrdersLike(normalized);
      } catch (e) {
        addToast({ title: "Error", description: String(e?.message || e), color: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (userId) load();
    return () => { cancelled = true; };
  }, [userId]);

  const userFullName = useMemo(() => {
    if (!userFromState) return `Usuario ${userId}`;
    const n = [userFromState.name, userFromState.surname].filter(Boolean).join(" ");
    return n || `Usuario ${userId}`;
  }, [userFromState, userId]);

  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });

  const sumActionsCapital = (ops = []) =>
    (ops || []).reduce((acc, a) => acc + Number(a?.benefit || 0) * Number(a?.quantity || 0), 0);

  const columns = [
    { key: "operacion", label: "Operación" },
    { key: "fecha", label: "Fecha" },
    { key: "estado", label: "Estado" },
    { key: "capital", label: "$ Capital" },
    { key: "ganancia", label: "$ Ganancia" },
    { key: "perdida", label: "$ Pérdida" },
    { key: "retiros", label: "$ Retiros" },
    { key: "more", label: "Ver Más" },
    { key: "edit", label: "Editar" },
    { key: "delete", label: "Eliminar" },
    { key: "update", label: "Actualizar estado" },
  ];

  // IMPORTANTE: si es MOVIMIENTO “En progreso”, su total aparece temporalmente en Capital.
  const tableRows = useMemo(() => {
    return ordersLike
      .slice()
      .sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
      .map((o, idx) => {
        const actionsTotal = sumActionsCapital(o.operationActions);
        const statusLc = String(o.status || "").toLowerCase();
        const isPendingMovement =
          !o.isCapital && !o.isWithdrawl && statusLc === "en progreso";

        const capital =
          (o.isCapital && !o.isWithdrawl) || isPendingMovement ? actionsTotal : 0;

        const retiros = o.isWithdrawl ? actionsTotal : 0;
        const ganancia = !o.isWithdrawl && o.operationValue > 0 ? o.operationValue : 0;
        const perdida = !o.isWithdrawl && o.operationValue < 0 ? Math.abs(o.operationValue) : 0;

        return {
          id: o.id || idx,
          operacion: o.code || `#${idx + 1}`,
          fecha: new Date(o.operationDate).toLocaleDateString("es-EC"),
          estado: o.status || "En progreso",
          capital,
          ganancia,
          perdida,
          retiros,
          original: o,
        };
      });
  }, [ordersLike]);

  const totals = useMemo(() => {
    return {
      capital: tableRows.reduce((acc, r) => acc + Number(r.capital || 0), 0),
      ganancia: tableRows.reduce((acc, r) => acc + Number(r.ganancia || 0), 0),
      perdida: tableRows.reduce((acc, r) => acc + Number(r.perdida || 0), 0),
      retiros: tableRows.reduce((acc, r) => acc + Number(r.retiros || 0), 0),
    };
  }, [tableRows]);

  // Balance: como tu Angular, solo capital “real” + valores de operación
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

  const roiData = useMemo(() => {
    const wins = tableRows.filter((r) => Number(r.ganancia) > 0);
    const losses = tableRows.filter((r) => Number(r.perdida) > 0);
    const sumWins = wins.reduce((a, r) => a + Number(r.ganancia), 0);
    const sumLosses = losses.reduce((a, r) => a + Number(r.perdida), 0);
    const avgWin = wins.length ? sumWins / wins.length : 0;
    const avgLoss = losses.length ? sumLosses / losses.length : 0;
    return { avgWin, avgLoss };
  }, [tableRows]);

  // ====== Gráfica ======
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
        if (d >= currentWeekStart && d <= weekEnd && d.getFullYear() === year && d.getMonth() === month - 1) {
          return acc + Number(order.operationValue || 0);
        }
        return acc;
      }, 0);
      weekly.push({ weekStart: new Date(currentWeekStart), weekEnd: new Date(weekEnd), weekNumber, total });
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }
    return weekly;
  };

  const calculateMonthlyTotals = () => {
    const monthly = {
      ene: { total: 0 }, feb: { total: 0 }, mar: { total: 0 }, abr: { total: 0 },
      may: { total: 0 }, jun: { total: 0 }, jul: { total: 0 }, ago: { total: 0 },
      sep: { total: 0 }, oct: { total: 0 }, nov: { total: 0 }, dic: { total: 0 },
    };
    ordersLike.forEach((order) => {
      const d = new Date(order.operationDate);
      if (d.getFullYear() === selectedYear) {
        const key = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()];
        monthly[key].total += Number(order.operationValue || 0);
      }
    });
    return monthly;
  };

  const [chartData, setChartData] = useState({ labels: [], totalValues: [] });
  useEffect(() => {
    // Totales por mes (del año seleccionado)
    const monthly = calculateMonthlyTotals();
    let labels = [];
    let totalValues = [];

    if (selectedPeriod === "M") {
      const weekly = getWeeklyDataForMonth(selectedYear, selectedMonth);
      labels = weekly.map((_, i) => `Semana ${i + 1}`);
      totalValues = weekly.map((w) => w.total);

      // Si todo es cero, distribuir por semana para no dejar plano
      if (!totalValues.some((v) => v !== 0)) {
        const key = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][selectedMonth - 1];
        const monthTotal = monthly[key].total;
        labels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
        totalValues = [0.2, 0.35, 0.25, 0.2].map((p) => monthTotal * p);
      }
    } else if (selectedPeriod === "T") {
      const map = {
        1: { labels: ["Enero","Febrero","Marzo"], keys: ["ene","feb","mar"] },
        2: { labels: ["Abril","Mayo","Junio"], keys: ["abr","may","jun"] },
        3: { labels: ["Julio","Agosto","Septiembre"], keys: ["jul","ago","sep"] },
        4: { labels: ["Octubre","Noviembre","Diciembre"], keys: ["oct","nov","dic"] },
      };
      const t = map[selectedTrimestre];
      labels = t.labels;
      totalValues = t.keys.map((k) => monthly[k].total);
    } else if (selectedPeriod === "S") {
      if (selectedSemestre === "1") {
        labels = ["Enero","Febrero","Marzo","Abril","Mayo","Junio"];
        const keys = ["ene","feb","mar","abr","may","jun"];
        totalValues = keys.map((k) => monthly[k].total);
      } else {
        labels = ["Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const keys = ["jul","ago","sep","oct","nov","dic"];
        totalValues = keys.map((k) => monthly[k].total);
      }
    } else if (selectedPeriod === "Y") {
      // NUEVO: vista por Año (suma de operationValue por año)
      const byYear = new Map();
      ordersLike.forEach((o) => {
        const y = new Date(o.operationDate).getFullYear();
        byYear.set(y, (byYear.get(y) || 0) + Number(o.operationValue || 0));
      });
      const years = Array.from(byYear.keys()).sort((a, b) => a - b);
      labels = years.map(String);
      totalValues = years.map((y) => byYear.get(y) || 0);
    }

    setChartData({ labels, totalValues });
  }, [selectedPeriod, selectedMonth, selectedTrimestre, selectedSemestre, selectedYear, ordersLike]);

  const primaryColor = "#00689b";
  const chartOptions = {
    chart: { type: "area", height: 400, toolbar: { show: false }, background: "transparent", zoom: { enabled: false } },
    dataLabels: {
      enabled: selectedPeriod === "M",
      style: { fontSize: "11px", colors: [primaryColor], fontWeight: 300 },
      background: { enabled: true, foreColor: "#fff", borderRadius: 2, padding: 4, opacity: 0.9, borderWidth: 1, borderColor: primaryColor },
    },
    stroke: { curve: "smooth", width: selectedPeriod === "M" ? 3 : 2, colors: [primaryColor] },
    markers: { size: selectedPeriod === "M" ? 6 : 4, colors: [primaryColor], strokeColors: "#fff", strokeWidth: 2, hover: { size: 8 } },
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
        style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px", fontFamily: "Inter, sans-serif" },
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
        style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px", fontFamily: "Inter, sans-serif" },
        formatter: (val) => "$" + (Number(val) || 0).toFixed(0),
      },
    },
    grid: { show: true, borderColor: "var(--nextui-colors-default-200)" },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      style: { fontSize: "12px", fontFamily: "Inter, sans-serif" },
      y: { formatter: (val) => "$" + (Number(val) || 0).toFixed(2) + " USD" },
      x: { formatter: (val) => (selectedPeriod === "M" ? `Semana ${val}` : val) },
    },
    legend: { show: false },
    colors: [primaryColor],
  };
  const chartSeries = [{ name: "Total", data: chartData.totalValues || [] }];

  // Acciones de fila (callbacks para subcomponentes)
  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const openEdit = (order) => {
    const st = String(order?.status || "").toLowerCase();
    if (st === "finalizado" || st === "cancelado") return;
    setSelectedOrder(order);
    setEditActions(
      order.operationActions?.map((a) => ({
        name: a.name,
        quantity: Number(a.quantity || 0),
        benefit: Number(a.benefit || 0),
      })) || []
    );
    setEditDate(toISO(order.operationDate));
    setIsEditOpen(true);
  };

  const deleteOrder = async (order) => {
    if (!window.confirm(`¿Eliminar la orden #${order.operationNumber}?`)) return;
    try {
      await deleteOrderById(order.id);
      setOrdersLike((prev) => prev.filter((o) => o.id !== order.id));
      addToast({ title: "Orden eliminada", color: "secundary", duration: 1600 });
    } catch (e) {
      addToast({ title: "Error", description: String(e?.message || e), color: "danger" });
    }
  };

  const handleCancel = async (order) => {
    try {
      await updateOrderStatus({ _id: order.id, status: "Cancelado" });
      setOrdersLike((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "Cancelado" } : o)));
      addToast({ title: "Orden cancelada", color: "danger", duration: 1600 });
    } catch (e) {
      addToast({ title: "Error", description: String(e?.message || e), color: "danger" });
    }
  };

  // Finalizar: capital/retiro directo, movimiento con modal
  const handleFinalize = (order) => {
    if (order.isCapital || order.isWithdrawl) {
      return finalizeCapitalOrWithdraw(order);
    }
    setSelectedOrder(order);
    setFinishGain("");
    setFinishLoss("");
    setIsFinishOpen(true);
  };

  const finalizeCapitalOrWithdraw = async (order) => {
    try {
      let opActions = order.operationActions ? [...order.operationActions] : [];
      let operationValue = 0;

      if (order.isWithdrawl && order.isCapital) {
        // Retiro de capital
        opActions = opActions.map((a) => ({ ...a, benefit: Number(a.benefit || 0) * -1 }));
      } else if (order.isWithdrawl && !order.isCapital) {
        // Retiro de ganancia
        const total = sumActionsCapital(opActions);
        operationValue = -Math.abs(total);
        opActions = opActions.map((a) => ({ ...a, benefit: Number(a.benefit || 0) * -1 }));
      } else if (order.isCapital && !order.isWithdrawl) {
        // Depósito de capital
        operationValue = 0;
      }

      await updateOrderStatusEnd({
        _id: order.id,
        status: "Finalizado",
        operationValue,
        operationActions: opActions,
        isWithdrawl: order.isWithdrawl,
        isCapital: order.isCapital,
      });

      setOrdersLike((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: "Finalizado", operationValue, operationActions: opActions } : o
        )
      );
      addToast({ title: "Orden finalizada", color: "success", duration: 1600 });
    } catch (e) {
      addToast({ title: "Error", description: String(e?.message || e), color: "danger" });
    }
  };

  const saveFinishFromModal = async () => {
    if (!selectedOrder) return;
    const win = Number(finishGain || 0);
    const loss = Number(finishLoss || 0);

    if (win > 0 && loss > 0) {
      addToast({
        title: "Campos inválidos",
        description: "Sólo se puede llenar uno de los 2 campos (Ganancia o Pérdida).",
        color: "warning",
        duration: 2200,
      });
      return;
    }
    if (loss > currentBalance) {
      addToast({
        title: "Valor inválido",
        description: "La pérdida no puede superar el valor invertido (balance actual).",
        color: "warning",
        duration: 2200,
      });
      return;
    }

    // Al finalizar, el capital “reservado” del movimiento ya no se muestra en Capital
    // porque cambia el estado a Finalizado; la tabla ya lo contempla.
    const operationValue = win > 0 ? win : loss > 0 ? -1 * loss : 0;

    try {
      await updateOrderStatusEnd({
        _id: selectedOrder.id,
        status: "Finalizado",
        operationValue,
        isWithdrawl: false,
        isCapital: false,
      });

      setOrdersLike((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: "Finalizado", operationValue } : o))
      );
      setIsFinishOpen(false);
      addToast({ title: "Orden finalizada", color: "success", duration: 1600 });
    } catch (e) {
      addToast({ title: "Error", description: String(e?.message || e), color: "danger" });
    }
  };

  const saveEdit = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrderActions({ _id: selectedOrder.id, operationActions: editActions.slice(), operationDate: editDate });
      setOrdersLike((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, operationActions: editActions.slice(), operationDate: new Date(editDate).toISOString() } : o
        )
      );
      setIsEditOpen(false);
      addToast({ title: "Orden actualizada", color: "success", duration: 1600 });
    } catch (e) {
      addToast({ title: "Error", description: String(e?.message || e), color: "danger" });
    }
  };

  const toISO = (d) => {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "";
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // -------- Nueva orden --------
  const resetNewOrder = () => {
    setAccionistaName(""); setAccionistaQty(""); setAccionistaBenefit("");
    setNewActions([]); setFirstKind(null);
  };

  const validateInputs = () => {
    const q = Number(accionistaQty);
    const b = Number(accionistaBenefit);
    if (!accionistaName.trim() || q <= 0 || b <= 0) {
      addToast({ title: "Completa los campos", description: "Nombre, Cantidad y Precio son obligatorios", color: "warning", duration: 1800 });
      return false;
    }
    return true;
  };

  const addItemByKind = (kind) => {
    if (!validateInputs()) return;
    if (firstKind && firstKind !== kind) {
      addToast({ title: "Tipo no permitido", description: "Ya elegiste otro tipo para esta orden.", color: "danger", duration: 1800 });
      return;
    }
    const q = Number(accionistaQty);
    const b = Number(accionistaBenefit);
    setNewActions((prev) => [...prev, { name: accionistaName.trim(), quantity: q, benefit: b }]);
    if (!firstKind) setFirstKind(kind);
    setAccionistaName(""); setAccionistaQty(""); setAccionistaBenefit("");
    addToast({ title: "Movimiento agregado", color: "success", duration: 1200 });
  };

  const removeNewAction = (idx) => {
    setNewActions((arr) => {
      const next = arr.filter((_, i) => i !== idx);
      if (next.length === 0) setFirstKind(null);
      return next;
    });
  };

  const saveNewOrder = async () => {
    if (newActions.length === 0) {
      addToast({ title: "Agrega al menos un movimiento", color: "warning", duration: 1600 });
      return;
    }
    const isCapital = firstKind === KIND.CAPITAL || firstKind === KIND.CAPITAL_WITHDRAWL;
    const isWithdrawl = firstKind === KIND.CAPITAL_WITHDRAWL || firstKind === KIND.PROFIT_WITHDRAWL;

    const maxOp = ordersLike.reduce((m, o) => Math.max(m, Number(o.operationNumber || 0)), 1000);
    const newOrder = {
      clientId: String(userId),
      operationActions: newActions.slice(),
      operationStatus: "Pendiente",
      operationNumber: maxOp + 1,
      operationDate: new Date().toISOString(),
      operationValue: 0,
      isCapital,
      isWithdrawl,
    };

    try {
      const resp = await createOrder(newOrder);
      const id = resp?.uid || `tmp-${Date.now()}`;
      setOrdersLike((prev) => [
        { ...newOrder, id, code: `#${newOrder.operationNumber}`, status: "En progreso" },
        ...prev,
      ]);
      setIsNewOpen(false);
      resetNewOrder();
      addToast({ title: "Orden creada", color: "success", duration: 1600 });
    } catch (e) {
      addToast({ title: "Error", description: String(e?.message || e), color: "danger" });
    }
  };

  const nextOrderNumber =
    (ordersLike.reduce((m, o) => Math.max(m, Number(o.operationNumber || 0)), 1000) + 1) || 1001;

  const generateAuthCode = (length = 25) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
  };

  const exportPDF = async () => {
    setAuthCode(generateAuthCode(25));
    setIsPdfRendering(true);
    await new Promise((r) => requestAnimationFrame(() => r()));
    await new Promise((r) => setTimeout(r, 120));
    const content = pdfContentRef.current;
    if (!content) { setIsPdfRendering(false); return; }
    try {
      const canvas = await html2canvas(content, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" });
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
      pdf.save(`reporte-ordenes-${clientIdQuery || ""}.pdf`);
    } finally {
      setIsPdfRendering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="shadow-none rounded-3xl">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center justify-between bg-default-100 rounded-xl px-4 py-3">
              <div className="h-5 w-48 bg-default-200 rounded" />
              <div className="flex gap-2">
                <div className="h-9 w-32 bg-default-200 rounded" />
                <div className="h-9 w-24 bg-default-200 rounded" />
              </div>
            </div>
            <div className="h-[260px] w-full bg-default-100 rounded-2xl" />
            <div className="h-[300px] w-full bg-default-100 rounded-2xl" />
          </CardBody>
        </Card>
      </div>
    );
  }

  const modalOrder = selectedOrder;
  const modalActions = modalOrder?.operationActions || [];
  const modalItemsTotal = sumActionsCapital(modalActions);
  const modalFinalTotal = modalOrder?.isCapital ? modalItemsTotal : Number(modalOrder?.operationValue || 0);

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6 space-y-6">
          {/* Toolbar admin */}
          <div className="flex items-center justify-between gap-4 bg-[#0f2536] text-white rounded-xl px-4 py-3">
            <div className="text-sm">
              <span className="opacity-90">Cliente:</span>{" "}
              <span className="font-semibold">{userFullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-sky-600 text-white"
                startContent={<Icon icon="mdi:plus" width={18} />}
                onPress={() => {
                  resetNewOrder();
                  setIsNewOpen(true);
                }}
              >
                Nueva orden
              </Button>
              <Button size="sm" className="bg-rose-600 text-white" onPress={() => navigate("/panel/usuarios")}>
                Volver
              </Button>
            </div>
          </div>

          {/* Barra de filtros y PDF */}
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
                  onChange={(e) => setSelectedYear(parseInt(e.target.value || "0", 10))}
                  min="2020"
                  max="2035"
                  className="w-24"
                />
              </div>

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
                <Tab key="Y" title="Año" /> {/* NUEVO */}
              </Tabs>

              {selectedPeriod === "M" && (
                <Select
                  size="sm"
                  selectedKeys={[String(selectedMonth)]}
                  onSelectionChange={(keys) => setSelectedMonth(parseInt(Array.from(keys)[0], 10))}
                  className="w-32"
                  placeholder="Mes"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={String(i + 1)} value={String(i + 1)}>
                      {new Date(2025, i, 1).toLocaleDateString("es-ES", { month: "short" })}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {selectedPeriod === "T" && (
                <Select
                  size="sm"
                  selectedKeys={[selectedTrimestre]}
                  onSelectionChange={(keys) => setSelectedTrimestre(Array.from(keys)[0])}
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
                  onSelectionChange={(keys) => setSelectedSemestre(Array.from(keys)[0])}
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

          {/* Gráfico + métricas */}
          <div>
            <h3 className="text-base font-medium text-default-700 mb-3">Movimientos</h3>

            <div className="flex gap-6">
              <div className="flex-1">
                <Chart options={chartOptions} series={chartSeries} type="area" height={400} />
              </div>

              <div className="w-72 space-y-4">
                <h4 className="text-base font-medium text-default-700 mb-4">Rendimiento de trades</h4>

                <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100">
                  <CardBody className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon icon="mdi:wallet" className="text-blue-600 w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-default-600 mb-1">Balance</p>
                        <p className="text-lg font-semibold text-default-900">{formatCurrency(currentBalance)} USD</p>
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
                        <p className="text-lg font-semibold text-default-900 mb-1">{formatCurrency(roiData.avgWin)} USD</p>
                        <p className="text-xs text-default-400">{roiData.avgWin.toFixed(2)} PUNTOS</p>
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
                        <p className="text-lg font-semibold text-default-900 mb-1">{formatCurrency(roiData.avgLoss)} USD</p>
                        <p className="text-xs text-default-400">{roiData.avgLoss.toFixed(2)} PUNTOS</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>

          {/* Contenido PDF oculto (idéntico al de siempre) */}
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
                fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 22 }}>{userFullName}</div>
                <div>ID: {clientIdQuery}</div>
                <div style={{ fontSize: 20, fontWeight: 500 }}>Balance: {formatCurrency(currentBalance)}</div>
              </div>

              <h2 style={{ textAlign: "center", marginBottom: 18 }}>REPORTE DE ÓRDENES</h2>
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
                      <th style={{ textAlign: "right", padding: 6 }}>Capital</th>
                      <th style={{ textAlign: "right", padding: 6 }}>Ganancia</th>
                      <th style={{ textAlign: "right", padding: 6 }}>Pérdida</th>
                      <th style={{ textAlign: "right", padding: 6 }}>Retiros</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "right", padding: 6 }}>{formatCurrency(totals.capital)}</td>
                      <td style={{ textAlign: "right", padding: 6 }}>{formatCurrency(totals.ganancia)}</td>
                      <td style={{ textAlign: "right", padding: 6 }}>{formatCurrency(totals.perdida)}</td>
                      <td style={{ textAlign: "right", padding: 6 }}>{formatCurrency(totals.retiros)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

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
                    <th style={{ padding: 6, textAlign: "right" }}>$ Capital</th>
                    <th style={{ padding: 6, textAlign: "right" }}>$ Ganancia</th>
                    <th style={{ padding: 6, textAlign: "right" }}>$ Pérdida</th>
                    <th style={{ padding: 6, textAlign: "right" }}>$ Retiros</th>
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
                            background: row.estado === "Finalizado" ? "#4caf5045" : "#9abaff82",
                            color: row.estado === "Finalizado" ? "#086721" : "#002645",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 12,
                          }}
                        >
                          {row.estado.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 6, textAlign: "right" }}>{formatCurrency(row.capital)}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{formatCurrency(row.ganancia)}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{formatCurrency(row.perdida)}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{formatCurrency(row.retiros)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: 12, color: "#666", marginTop: 18 }}>
                Informe generado el {new Date().toLocaleDateString("es-EC")} por solicitud del administrador.
                <br />
                Autenticación: <b>{authCode}</b>
              </div>
            </div>
          )}

          {/* Tabla */}
          <OrdersTable
            columns={columns}
            rows={tableRows}
            formatCurrency={formatCurrency}
            onOpenDetails={(o) => openDetails(o)}
            onOpenEdit={(o) => openEdit(o)}
            onDelete={(o) => deleteOrder(o)}
            onFinalize={(o) => handleFinalize(o)}
            onCancel={(o) => handleCancel(o)}
          />
        </CardBody>
      </Card>

      {/* Modales */}
      <DetailsModal
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        order={selectedOrder}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        sumActionsCapital={sumActionsCapital}
      />

      <EditModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        order={selectedOrder}
        actions={editActions}
        setActions={setEditActions}
        editDate={editDate}
        setEditDate={setEditDate}
        onSave={saveEdit}
      />

      <FinishModal
        isOpen={isFinishOpen}
        onOpenChange={setIsFinishOpen}
        order={selectedOrder}
        gain={finishGain}
        loss={finishLoss}
        setGain={setFinishGain}
        setLoss={setFinishLoss}
        onSave={saveFinishFromModal}
        maxLoss={currentBalance}
      />

      <NewOrderModal
        isOpen={isNewOpen}
        onOpenChange={(open) => { setIsNewOpen(open); if (!open) resetNewOrder(); }}
        nextOrderNumber={nextOrderNumber}
        actions={newActions}
        setName={setAccionistaName}
        setQty={setAccionistaQty}
        setBenefit={setAccionistaBenefit}
        name={accionistaName}
        qty={accionistaQty}
        benefit={accionistaBenefit}
        addItemByKind={addItemByKind}
        removeAction={removeNewAction}
        firstKind={firstKind}
        KIND={KIND}
        formatCurrency={formatCurrency}
        onSave={saveNewOrder}
      />
    </div>
  );
}