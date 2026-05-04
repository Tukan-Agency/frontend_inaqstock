import { useEffect, useMemo, useState } from "react";
import { listUserOrders } from "../components/services/orders.service";
import { useAccountMode } from "../context/AccountModeContext";

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

  const sumActionsCapital = (ops = []) =>
    (ops || []).reduce((acc, a) => acc + Number(a?.benefit || 0) * Number(a?.quantity || 0), 0);

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
          if (d >= weekStart && d <= weekEnd && !o.isCapital && !o.isWithdrawl) {
            return acc + Number(o.operationValue || 0);
          }
          return acc;
        }, 0)
      );
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
          if (d.getFullYear() === selectedYear && d.getMonth() === m && !o.isCapital && !o.isWithdrawl) {
            return acc + Number(o.operationValue || 0);
          }
          return acc;
        }, 0)
      );
    } else if (selectedPeriod === "S") {
      const conf = selectedSemestre === "1"
        ? { labels: ["Enero","Febrero","Marzo","Abril","Mayo","Junio"], months: [0,1,2,3,4,5] }
        : { labels: ["Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"], months: [6,7,8,9,10,11] };
      labels = conf.labels;
      totalValues = conf.months.map((m) =>
        activeOrders.reduce((acc, o) => {
          const d = new Date(o.operationDate);
          if (d.getFullYear() === selectedYear && d.getMonth() === m && !o.isCapital && !o.isWithdrawl) {
            return acc + Number(o.operationValue || 0);
          }
          return acc;
        }, 0)
      );
    }

    return { labels, totalValues };
  }, [activeOrders, selectedYear, selectedMonth, selectedTrimestre, selectedSemestre, selectedPeriod]);

  const tableRows = useMemo(() => {
    return activeOrders
      .slice()
      .sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
      .map((o, idx) => {
        const actionsTotal = sumActionsCapital(o.operationActions);
        const hasActions = actionsTotal !== 0;
        let capital = 0, retiros = 0, ganancia = 0, perdida = 0;

        if (o.isCapital && !o.isWithdrawl) {
          capital = hasActions ? actionsTotal : Number(o.operationValue || 0);
        } else if (o.isWithdrawl && hasActions) {
          retiros = actionsTotal;
        } else {
          const val = Number(o.operationValue || 0);
          if (val >= 0) ganancia = val;
          else perdida = Math.abs(val);
        }

        return {
          id: o.id || idx,
          operacion: o.code || `#${idx + 1}`,
          fecha: new Date(o.operationDate).toLocaleDateString("es-EC"),
          estado: o.status || "Finalizado",
          capital, ganancia, perdida, retiros,
        };
      });
  }, [activeOrders]);

  const totals = useMemo(() => ({
    capital: tableRows.reduce((acc, r) => acc + Number(r.capital || 0), 0),
    ganancia: tableRows.reduce((acc, r) => acc + Number(r.ganancia || 0), 0),
    perdida: tableRows.reduce((acc, r) => acc + Number(r.perdida || 0), 0),
    retiros: tableRows.reduce((acc, r) => acc + Number(r.retiros || 0), 0),
  }), [tableRows]);

  const balanceCalculado = useMemo(() => {
    return totals.capital + totals.ganancia - totals.perdida - totals.retiros;
  }, [totals]);

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
      const actionsTotal = sumActionsCapital(o.operationActions);
      const hasActions = actionsTotal !== 0;
      
      if (o.isCapital && !o.isWithdrawl) {
        buckets[idx].contrib += hasActions ? actionsTotal : Number(o.operationValue || 0);
      } else if (o.isWithdrawl && hasActions) {
        buckets[idx].withdraw += actionsTotal;
      } else {
        buckets[idx].profit += Number(o.operationValue || 0);
      }
    });

    let equity = 0, netContrib = 0;
    const values = buckets.map((b) => {
      equity += b.contrib + b.profit - b.withdraw;
      netContrib += b.contrib - b.withdraw;
      const roi = netContrib > 0 ? (equity / netContrib - 1) * 100 : 0;
      return Number.isFinite(roi) ? roi : 0;
    });
    const last = values.length ? values[values.length - 1] : 0;
    return { labels, values, last };
  }, [activeOrders, selectedPeriod, selectedYear, selectedMonth, selectedTrimestre, selectedSemestre]);

  const roiData = useMemo(() => {
    const totalGanancia = tableRows.reduce((sum, r) => sum + Number(r.ganancia || 0), 0);
    const totalPerdida = tableRows.reduce((sum, r) => sum + Number(r.perdida || 0), 0);
    return { totalGanancia, totalPerdida, avgWin: totalGanancia, avgLoss: totalPerdida };
  }, [tableRows]);

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