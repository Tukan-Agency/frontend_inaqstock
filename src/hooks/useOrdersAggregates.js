import { useEffect, useMemo, useState } from "react";
import { listUserOrders } from "../components/services/orders.service.js";

export function useOrdersAggregates({
  clientId,
  selectedYear,
  selectedPeriod,     // "M" | "T" | "S" | "Y" (Año relativo)
  selectedMonth,      // 1..12 (para "M")
  selectedTrimestre,  // "1".."4" (para "T")
  selectedSemestre,   // "1" | "2" (para "S")
  selectedYearIndex = 1, // 1..N (para "Y")
  baseDelayMs = 150,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!clientId) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const minDelay = new Promise((r) => setTimeout(r, baseDelayMs));
        // Aunque pasemos year/month, tu endpoint /api/orders/client ignora query y usa x-clientId
        // Está bien: devolvemos todo y filtramos en cliente.
        const [res] = await Promise.all([
          listUserOrders({
            clientId,
            year: selectedYear,
            month: selectedPeriod === "M" ? selectedMonth : undefined,
          }),
          minDelay,
        ]);
        if (!cancelled) setOrders(res || []);
      } catch (e) {
        console.error("useOrdersAggregates: error cargando órdenes:", e);
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [clientId, selectedYear, selectedPeriod, selectedMonth, baseDelayMs]);

  const sumActionsCapital = (ops = []) =>
    (ops || []).reduce((acc, a) => acc + Number(a?.benefit || 0) * Number(a?.quantity || 0), 0);

  // Años operativos (1° año, 2° año, ...), contados desde la PRIMERA orden del usuario.
  const operationalYears = useMemo(() => {
    const dated = orders
      .filter((o) => o?.operationDate)
      .map((o) => new Date(o.operationDate))
      .sort((a, b) => a - b);

    if (!dated.length) return [];

    const first = new Date(dated[0]);
    // Normalizamos inicio al día exacto de la primera orden (no al 1° de enero)
    const result = [];
    let yearStart = new Date(first);
    let index = 1;

    // Crear años de 12 meses hasta cubrir la última orden
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
      // Siguiente año
      yearStart = new Date(yearStart);
      yearStart.setFullYear(yearStart.getFullYear() + 1);
      index++;
      // Protección por si el usuario tiene muchas órdenes o fechas raras
      if (index > 20) break;
    }
    return result;
  }, [orders]);

  // Helpers por período ya existentes
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

  // Totales por mes (para movimientos) a nivel año calendario
  const monthlyTotals = useMemo(() => {
    const init = {
      ene: { total: 0 }, feb: { total: 0 }, mar: { total: 0 },
      abr: { total: 0 }, may: { total: 0 }, jun: { total: 0 },
      jul: { total: 0 }, ago: { total: 0 }, sep: { total: 0 },
      oct: { total: 0 }, nov: { total: 0 }, dic: { total: 0 },
    };
    orders.forEach((order) => {
      const d = new Date(order.operationDate);
      if (d.getFullYear() === selectedYear) {
        const key = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()];
        init[key].total += Number(order.operationValue || 0);
      }
    });
    return init;
  }, [orders, selectedYear]);

  // Movimientos: P/L por bucket
  const chartData = useMemo(() => {
    let labels = [];
    let totalValues = [];

    if (selectedPeriod === "M") {
      const weeks = getWeeklyDataForMonth(selectedYear, selectedMonth);
      labels = weeks.map((_, i) => `Semana ${i + 1}`);
      totalValues = weeks.map(({ weekStart, weekEnd }) =>
        orders.reduce((acc, o) => {
          const d = new Date(o.operationDate);
          if (d >= weekStart && d <= weekEnd) return acc + Number(o.operationValue || 0);
          return acc;
        }, 0)
      );

      if (!totalValues.some((v) => v !== 0)) {
        const key = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][selectedMonth - 1];
        const monthTotal = monthlyTotals[key].total;
        labels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
        totalValues = [0.2, 0.35, 0.25, 0.2].map((p) => monthTotal * p);
      }
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
        orders.reduce((acc, o) => {
          const d = new Date(o.operationDate);
          if (d.getFullYear() === selectedYear && d.getMonth() === m) return acc + Number(o.operationValue || 0);
          return acc;
        }, 0)
      );
    } else if (selectedPeriod === "S") {
      const conf = selectedSemestre === "1"
        ? { labels: ["Enero","Febrero","Marzo","Abril","Mayo","Junio"], months: [0,1,2,3,4,5] }
        : { labels: ["Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"], months: [6,7,8,9,10,11] };
      labels = conf.labels;
      totalValues = conf.months.map((m) =>
        orders.reduce((acc, o) => {
          const d = new Date(o.operationDate);
          if (d.getFullYear() === selectedYear && d.getMonth() === m) return acc + Number(o.operationValue || 0);
          return acc;
        }, 0)
      );
    } else if (selectedPeriod === "Y") {
      // Año relativo: 12 meses desde el inicio del año operativo seleccionado
      const opYear = operationalYears.find((y) => y.index === Number(selectedYearIndex));
      if (!opYear) return { labels: [], totalValues: [] };

      // Construimos 12 meses desde opYear.start
      const months = Array.from({ length: 12 }, (_, i) => {
        const start = new Date(opYear.start);
        start.setMonth(start.getMonth() + i, 1);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1, 0); // fin del mes
        return { start, end, label: start.toLocaleDateString("es-ES", { month: "short", year: "numeric" }) };
      });

      labels = months.map((m) => m.label);
      totalValues = months.map(({ start, end }) =>
        orders.reduce((acc, o) => {
          const d = new Date(o.operationDate);
          if (d >= start && d <= end) return acc + Number(o.operationValue || 0);
          return acc;
        }, 0)
      );
    }

    return { labels, totalValues };
  }, [
    orders,
    selectedYear,
    selectedMonth,
    selectedTrimestre,
    selectedSemestre,
    selectedPeriod,
    monthlyTotals,
    operationalYears,
    selectedYearIndex,
  ]);

  const tableRows = useMemo(() => {
    return orders
      .slice()
      .sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
      .map((o, idx) => {
        const actionsTotal = sumActionsCapital(o.operationActions);
        const capital = o.isCapital && !o.isWithdrawl ? actionsTotal : 0;
        const retiros = o.isWithdrawl ? actionsTotal : 0;
        const ganancia = !o.isWithdrawl && o.operationValue > 0 ? o.operationValue : 0;
        const perdida = !o.isWithdrawl && o.operationValue < 0 ? Math.abs(o.operationValue) : 0;

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
  }, [orders]);

  const totals = useMemo(() => ({
    capital: tableRows.reduce((acc, r) => acc + Number(r.capital || 0), 0),
    ganancia: tableRows.reduce((acc, r) => acc + Number(r.ganancia || 0), 0),
    perdida: tableRows.reduce((acc, r) => acc + Number(r.perdida || 0), 0),
    retiros: tableRows.reduce((acc, r) => acc + Number(r.retiros || 0), 0),
  }), [tableRows]);

  const currentBalance = useMemo(() => {
    let balance = 0;
    orders.forEach((order) => {
      if (order.isCapital) balance += sumActionsCapital(order.operationActions);
      balance += Number(order.operationValue || 0);
    });
    return balance;
  }, [orders]);

  // ROI acumulado en el tiempo (por bucket del periodo)
  const roiTime = useMemo(() => {
    let labels = [];
    let buckets = []; // { contrib, withdraw, profit, match(date) }

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
    } else if (selectedPeriod === "Y") {
      const opYear = operationalYears.find((y) => y.index === Number(selectedYearIndex));
      if (!opYear) return { labels: [], values: [], last: 0 };
      // 12 meses desde opYear.start
      const months = Array.from({ length: 12 }, (_, i) => {
        const start = new Date(opYear.start);
        start.setMonth(start.getMonth() + i, 1);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1, 0);
        return { start, end, label: start.toLocaleDateString("es-ES", { month: "short", year: "numeric" }) };
      });
      labels = months.map((m) => m.label);
      buckets = months.map((m) => ({
        contrib: 0, withdraw: 0, profit: 0,
        match: (d) => d >= m.start && d <= m.end,
      }));
    }

    // Llenar buckets
    orders.forEach((o) => {
      const d = new Date(o.operationDate);
      const idx = buckets.findIndex((b) => b.match(d));
      if (idx === -1) return;
      const a = sumActionsCapital(o.operationActions);
      if (o.isCapital && !o.isWithdrawl) buckets[idx].contrib += a;
      if (o.isWithdrawl) buckets[idx].withdraw += a;
      buckets[idx].profit += Number(o.operationValue || 0);
    });

    // ROI acumulado
    let equity = 0;
    let netContrib = 0;
    const values = buckets.map((b) => {
      equity += b.contrib + b.profit - b.withdraw;
      netContrib += b.contrib - b.withdraw;
      const roi = netContrib > 0 ? (equity / netContrib - 1) * 100 : 0;
      return Number.isFinite(roi) ? roi : 0;
    });
    const last = values.length ? values[values.length - 1] : 0;
    return { labels, values, last };
  }, [
    orders,
    selectedPeriod,
    selectedMonth,
    selectedTrimestre,
    selectedSemestre,
    selectedYear,
    operationalYears,
    selectedYearIndex,
  ]);

  // ROI simple (promedios) para tarjetas
  const roiData = useMemo(() => {
    const wins = tableRows.filter((r) => Number(r.ganancia) > 0);
    const losses = tableRows.filter((r) => Number(r.perdida) > 0);
    const sumWins = wins.reduce((a, r) => a + Number(r.ganancia), 0);
    const sumLosses = losses.reduce((a, r) => a + Number(r.perdida), 0);
    const avgWin = wins.length ? sumWins / wins.length : 0;
    const avgLoss = losses.length ? sumLosses / losses.length : 0;
    return { avgWin, avgLoss };
  }, [tableRows]);

  return {
    isLoading,
    orders,
    operationalYears, // <- para poblar el Select “Año de operación”
    chartData,        // Movimientos (P/L)
    roiTime,          // ROI acumulado
    totals,
    currentBalance,
    roiData,
  };
}