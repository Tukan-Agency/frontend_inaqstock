import { useEffect, useMemo, useState } from "react";
import { listUserOrders } from "../components/services/orders.service";
import { useAccountMode } from "../context/AccountModeContext";
import {
  cumulative,
  getFinalizedOrderDelta,
  getOrderFinancials,
  summarizeFinalizedOrders,
} from "../utils/orderFinance.js";

export function useOrdersAggregates({
  clientId,
  selectedYear,
  selectedPeriod,
  selectedMonth,
  selectedTrimestre,
  selectedSemestre,
  selectedYearIndex = 1,
  baseDelayMs = 150,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const { mode } = useAccountMode();

  useEffect(() => {
    let cancelled = false;
    if (!clientId) {
      setIsLoading(false);
      setOrders([]);
      return;
    }
    setIsLoading(true);

    async function load() {
      try {
        const minDelay = new Promise((r) => setTimeout(r, baseDelayMs));
        const [ordenes] = await Promise.all([
          listUserOrders({ clientId, mode }),
          minDelay,
        ]);

        const normalized = (ordenes || []).map((o, idx) => {
          return {
            id: o._id || o.id || idx,
            code: `#${o.operationNumber ?? ""}`,
            operationNumber: o.operationNumber,
            operationDate: o.operationDate,
            operationValue: Number(o.operationValue || 0),
            status: o.operationStatus || o.status || "Finalizado",
            isCapital: Boolean(o.isCapital),
            isWithdrawl: Boolean(o.isWithdrawl || o.isWithdrawal),
            operationActions: Array.isArray(o.operationActions) ? o.operationActions : [],
            clientId: o.clientId,
          };
        });

        if (!cancelled) setOrders(normalized);
      } catch (e) {
        console.error("Error cargando órdenes:", e);
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId, mode, baseDelayMs]);

  const operationalYears = useMemo(() => {
    const dated = orders
      .filter((o) => o?.operationDate)
      .map((o) => new Date(o.operationDate))
      .sort((a, b) => a - b);

    if (!dated.length) return [];

    const first = new Date(dated[0]);
    const result = [];
    let yearStart = new Date(first);
    let index = 1;
    const last = new Date(dated[dated.length - 1]);

    while (yearStart <= last) {
      const yearEnd = new Date(yearStart);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);
      yearEnd.setDate(yearEnd.getDate() - 1);
      result.push({
        index,
        start: new Date(yearStart),
        end: new Date(yearEnd),
        label: `${index}º año (${yearStart.toLocaleDateString()} - ${yearEnd.toLocaleDateString()})`,
      });
      yearStart.setFullYear(yearStart.getFullYear() + 1);
      index++;
      if (index > 20) break;
    }
    return result;
  }, [orders]);

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
      weekly.push({ weekStart: new Date(currentWeekStart), weekEnd: new Date(weekEnd), weekNumber });
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }
    return weekly;
  };

  const filteredOrdersByYear = useMemo(() => {
    return orders.filter((order) => {
      const d = new Date(order.operationDate);
      return d.getFullYear() === selectedYear;
    });
  }, [orders, selectedYear]);

  const activeOrders = useMemo(() => {
    return filteredOrdersByYear;
  }, [filteredOrdersByYear]);

  const chartData = useMemo(() => {
    let labels = [];
    let totalValues = [];

    if (selectedPeriod === "M") {
      const weeks = getWeeklyDataForMonth(selectedYear, selectedMonth);
      labels = weeks.map((_, i) => `Semana ${i + 1}`);
      totalValues = weeks.map(({ weekStart, weekEnd }) =>
        activeOrders.reduce((acc, o) => {
          const d = new Date(o.operationDate);
          if (d >= weekStart && d <= weekEnd) {
            return acc + getFinalizedOrderDelta(o);
          }
          return acc;
        }, 0)
      );
      totalValues = cumulative(totalValues);
    } else if (selectedPeriod === "T") {
      const map = {
        "1": { labels: ["Enero","Febrero","Marzo"], months: [0,1,2] },
        "2": { labels: ["Abril","Mayo","Junio"], months: [3,4,5] },
        "3": { labels: ["Julio","Agosto","Septiembre"], months: [6,7,8] },
        "4": { labels: ["Octubre","Noviembre","Diciembre"], months: [9,10,11] },
      };
      const conf = map[selectedTrimestre];
      labels = conf.labels;
      totalValues = conf.months.map((m) =>
        activeOrders.reduce((acc, o) => {
          const d = new Date(o.operationDate);
          if (d.getFullYear() === selectedYear && d.getMonth() === m) {
            return acc + getFinalizedOrderDelta(o);
          }
          return acc;
        }, 0)
      );
      totalValues = cumulative(totalValues);
    } else if (selectedPeriod === "S") {
      const conf = selectedSemestre === "1"
        ? { labels: ["Enero","Febrero","Marzo","Abril","Mayo","Junio"], months: [0,1,2,3,4,5] }
        : { labels: ["Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"], months: [6,7,8,9,10,11] };
      labels = conf.labels;
      totalValues = conf.months.map((m) =>
        activeOrders.reduce((acc, o) => {
          const d = new Date(o.operationDate);
          if (d.getFullYear() === selectedYear && d.getMonth() === m) {
            return acc + getFinalizedOrderDelta(o);
          }
          return acc;
        }, 0)
      );
      totalValues = cumulative(totalValues);
    }

    return { labels, totalValues };
  }, [activeOrders, selectedYear, selectedMonth, selectedTrimestre, selectedSemestre, selectedPeriod]);

  const summary = useMemo(() => summarizeFinalizedOrders(activeOrders), [activeOrders]);

  const totals = useMemo(() => ({
    capital: summary.capital,
    ganancia: summary.ganancia,
    perdida: summary.perdida,
    retiros: summary.retiros,
  }), [summary]);

  const balanceCalculado = useMemo(() => {
    return summary.balance;
  }, [summary]);

  const currentBalance = useMemo(() => balanceCalculado, [balanceCalculado]);

  const roiTime = useMemo(() => {
    if (activeOrders.length === 0) return { labels: [], values: [], last: 0 };

    let labels = [];
    let buckets = [];

    if (selectedPeriod === "M") {
      const weeks = getWeeklyDataForMonth(selectedYear, selectedMonth);
      labels = weeks.map((_, i) => `Semana ${i + 1}`);
      buckets = weeks.map((w) => ({
        contrib: 0, withdraw: 0, profit: 0,
        match: (d) => d >= w.weekStart && d <= w.weekEnd,
      }));
    } else if (selectedPeriod === "T") {
      const map = {
        "1": { labels: ["Enero","Febrero","Marzo"], months: [0,1,2] },
        "2": { labels: ["Abril","Mayo","Junio"], months: [3,4,5] },
        "3": { labels: ["Julio","Agosto","Septiembre"], months: [6,7,8] },
        "4": { labels: ["Octubre","Noviembre","Diciembre"], months: [9,10,11] },
      };
      const conf = map[selectedTrimestre];
      labels = conf.labels;
      buckets = conf.months.map((m) => ({
        contrib: 0, withdraw: 0, profit: 0,
        match: (d) => d.getFullYear() === selectedYear && d.getMonth() === m,
      }));
    } else if (selectedPeriod === "S") {
      const conf = selectedSemestre === "1"
        ? { labels: ["Enero","Febrero","Marzo","Abril","Mayo","Junio"], months: [0,1,2,3,4,5] }
        : { labels: ["Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"], months: [6,7,8,9,10,11] };
      labels = conf.labels;
      buckets = conf.months.map((m) => ({
        contrib: 0, withdraw: 0, profit: 0,
        match: (d) => d.getFullYear() === selectedYear && d.getMonth() === m,
      }));
    }

    activeOrders.forEach((o) => {
      const d = new Date(o.operationDate);
      const idx = buckets.findIndex((b) => b.match(d));
      if (idx === -1) return;
      if (getFinalizedOrderDelta(o) === 0) return;
      const values = getOrderFinancials(o);
      if (o.isCapital && !o.isWithdrawl) buckets[idx].contrib += values.delta;
      else if (values.retiros !== 0) buckets[idx].withdraw += values.delta;
      else buckets[idx].profit += values.delta;
    });

    let equity = 0, netContrib = 0;
    const values = buckets.map((b) => {
      equity += b.contrib + b.profit + b.withdraw;
      netContrib += b.contrib + b.withdraw;
      const roi = netContrib > 0 ? (equity / netContrib - 1) * 100 : 0;
      return Number.isFinite(roi) ? roi : 0;
    });
    const last = values.length ? values[values.length - 1] : 0;
    return { labels, values, last };
  }, [activeOrders, selectedPeriod, selectedYear, selectedMonth, selectedTrimestre, selectedSemestre]);

  const roiData = useMemo(() => {
    const totalGanancia = summary.ganancia;
    const totalPerdida = summary.perdida;
    return { totalGanancia, totalPerdida, avgWin: totalGanancia, avgLoss: totalPerdida };
  }, [summary]);

  return {
    isLoading,
    orders: activeOrders,
    operationalYears,
    chartData,
    roiTime,
    totals,
    currentBalance,
    balanceCalculado,
    roiData,
  };
}
