import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "react-apexcharts";
import { CircularProgress } from "@heroui/progress";
import { addToast } from "@heroui/react";

/**
 * Gráfico OHLC con “brush” y línea de precio en tiempo real.
 *
 * Props:
 * - data: Array<{ t, o, h, l, c, v? }>
 * - loading: boolean
 * - title: string
 * - height: number
 * - showToolbar: boolean
 * - colors: { upward, downward }
 * - theme: "dark" | "light"
 * - chartType: "candlestick" | "line"
 * - enableBrush: boolean
 * - maxPoints: number
 * - initialRange: number
 * - showBrushOnlyOnMobile: boolean
 * - livePrice: number | null
 * - livePriceSymbol: string
 */
export default function CandlestickChart({
  data = [],
  loading = false,
  title = "Gráfico OHLC",
  height = 350,
  showToolbar = false,
  colors = {
    upward: "#0b827b",
    downward: "#e74c3c",
  },
  theme = "dark",
  chartType = "candlestick",
  enableBrush = true,
  maxPoints = 600,
  initialRange = 200,
  showBrushOnlyOnMobile = true,
  livePrice = null,
  livePriceSymbol = "",
}) {
  const chartId = "candles";
  const chartRef = useRef(null);

  // Detectar móvil (<= 768px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  // Controlar si se muestra el brush realmente
  const brushEnabledFinal =
    chartType === "candlestick" &&
    enableBrush &&
    (!showBrushOnlyOnMobile || isMobile);

  // Recortar dataset si excede maxPoints
  const sliced = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.length > maxPoints ? data.slice(-maxPoints) : data;
  }, [data, maxPoints]);

  const numberFmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  // Serie principal
  const series = useMemo(() => {
    if (chartType === "candlestick") {
      return [
        {
          name: "OHLC",
          data: sliced.map((d) => ({
            x: d.t, // timestamp (ms) o Date
            y: [d.o, d.h, d.l, d.c],
          })),
        },
      ];
    }
    return [
      {
        name: "Close",
        data: sliced.map((d) => ({
          x: d.t,
          y: d.c,
        })),
      },
    ];
  }, [sliced, chartType]);

  // Extremos base del eje Y a partir de los datos visibles
  const { baseMin, baseMax } = useMemo(() => {
    if (!sliced.length) return { baseMin: 0, baseMax: 1 };
    if (chartType === "candlestick") {
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (const d of sliced) {
        if (typeof d.l === "number" && d.l < min) min = d.l;
        if (typeof d.h === "number" && d.h > max) max = d.h;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) return { baseMin: 0, baseMax: 1 };
      if (min === max) max = min + 1; // evitar rango cero
      return { baseMin: min, baseMax: max };
    } else {
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (const d of sliced) {
        const y = Number(d.c);
        if (Number.isFinite(y)) {
          if (y < min) min = y;
          if (y > max) max = y;
        }
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) return { baseMin: 0, baseMax: 1 };
      if (min === max) max = min + 1;
      return { baseMin: min, baseMax: max };
    }
  }, [sliced, chartType]);

  // Calcular dominio del eje Y incluyendo siempre livePrice con padding
  const { yMin, yMax } = useMemo(() => {
    let min = baseMin;
    let max = baseMax;
    if (typeof livePrice === "number" && Number.isFinite(livePrice)) {
      if (livePrice < min) min = livePrice;
      if (livePrice > max) max = livePrice;
    }
    // padding del 3% del rango (o pequeño mínimo)
    let span = max - min;
    if (!Number.isFinite(span) || span <= 0) span = Math.max(1, max * 0.01);
    const pad = Math.max(span * 0.03, Math.max(0.5, max * 0.001));
    return { yMin: min - pad, yMax: max + pad };
  }, [baseMin, baseMax, livePrice]);

  // Rango inicial para el brush
  const { initMin, initMax } = useMemo(() => {
    if (!sliced.length) return { initMin: 0, initMax: 0 };
    const last = sliced.length;
    const minIndex = Math.max(0, last - initialRange);
    return { initMin: sliced[minIndex].t, initMax: sliced[last - 1].t };
  }, [sliced, initialRange]);

  // Animaciones mínimas (evitar lag en velas)
  const animations = useMemo(
    () => ({
      enabled: chartType !== "candlestick",
      speed: 300,
      animateGradually: { enabled: false },
      dynamicAnimation: { enabled: chartType !== "candlestick", speed: 250 },
    }),
    [chartType]
  );

  // Evitar spam de toast “sin datos”
  const toastShownRef = useRef(false);

  // Anotación de precio en vivo
  const liveAnnotations = useMemo(() => {
    if (livePrice == null) return { yaxis: [] };
    return {
      yaxis: [
        {
          y: livePrice,
          borderColor: "#1E90FF",
          strokeDashArray: 0,
          label: {
            show: true,
            text: `${livePriceSymbol || "Live"} ${numberFmt.format(livePrice)}`,
            style: {
              background: "#1E90FF",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 600,
            },
          },
        },
      ],
    };
  }, [livePrice, livePriceSymbol, numberFmt]);

  // Opciones del gráfico principal
  const options = useMemo(
    () => ({
      chart: {
        id: chartId,
        type: chartType,
        height,
        toolbar: { show: showToolbar },
        animations,
        zoom: { enabled: chartType === "candlestick", type: "x" },
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
      },
      title: {
        text: title,
        align: "left",
        style: {
          color: "#3386ac",
          fontSize: "16px",
          fontWeight: "bold",
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          style: { colors: "#3386ac" },
          format: "dd MMM",
          datetimeUTC: false,
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: yMin,
        max: yMax,
        tickAmount: 6,
        forceNiceScale: true,
        decimalsInFloat: 2,
        tooltip: { enabled: true },
        labels: {
          style: { colors: "#3386ac" },
          formatter: (val) => numberFmt.format(val),
        },
      },
      tooltip: {
        theme: theme,
        style: {
          fontSize: "12px",
          fontFamily: "inherit",
        },
        onDatasetHover: { highlightDataSeries: false },
        shared: false,
        intersect: true,
        custom:
          chartType === "candlestick"
            ? ({ seriesIndex, dataPointIndex, w }) => {
                try {
                  const open = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
                  const high = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
                  const low = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
                  const close = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
                  return `<div style="padding:6px;font-size:12px">
                    <div><b>Open:</b> ${numberFmt.format(open)}</div>
                    <div><b>High:</b> ${numberFmt.format(high)}</div>
                    <div><b>Low:</b> ${numberFmt.format(low)}</div>
                    <div><b>Close:</b> ${numberFmt.format(close)}</div>
                  </div>`;
                } catch {
                  return "";
                }
              }
            : undefined,
      },
      dataLabels: { enabled: false },
      grid: { strokeDashArray: 3 },
      stroke:
        chartType === "candlestick"
          ? { width: 1 }
          : { width: 1, curve: "straight" },
      markers: { size: 0 },
      plotOptions:
        chartType === "candlestick"
          ? {
              candlestick: {
                colors: {
                  upward: colors.upward,
                  downward: colors.downward,
                },
                wick: { useFillColor: true },
              },
            }
          : {},
      annotations: liveAnnotations,
    }),
    [
      chartType,
      height,
      showToolbar,
      animations,
      title,
      theme,
      colors,
      liveAnnotations,
      numberFmt,
      yMin,
      yMax,
    ]
  );

  // Serie y opciones del brush
  const brushSeries = useMemo(
    () => [
      {
        name: "Range",
        data: sliced.map((d) => ({ x: d.t, y: d.c })), // cierre para optimizar
      },
    ],
    [sliced]
  );

  const brushOptions = useMemo(
    () => ({
      chart: {
        id: "candles-range",
        type: "bar",
        animations,
        brush: { enabled: true, target: chartId },
        selection: {
          enabled: true,
          xaxis: { min: initMin, max: initMax },
          fill: { color: "#90CAF9", opacity: 0.3 },
          stroke: { color: "#0D47A1" },
        },
        toolbar: { show: false },
        zoom: { enabled: false },
        sparkline: { enabled: true },
      },
      dataLabels: { enabled: false },
      tooltip: { enabled: false },
      xaxis: { type: "datetime" },
      yaxis: { labels: { show: false } },
      grid: { strokeDashArray: 2 },
    }),
    [animations, initMin, initMax]
  );

  // Mantener y-axis y anotación sincronizados sin re-render completo
  useEffect(() => {
    try {
      window.ApexCharts?.exec(chartId, "updateOptions", {
        yaxis: { min: yMin, max: yMax },
        annotations: liveAnnotations,
      }, false, true);
    } catch {}
  }, [yMin, yMax, liveAnnotations]);

  // Loading
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <CircularProgress strokeWidth={4} aria-label="Cargando gráfico..." />
      </div>
    );
  }

  // Sin datos
  if (!sliced || sliced.length === 0) {
    if (!toastShownRef.current) {
      addToast?.({
        title: "Sin datos",
        description: "No hay datos disponibles para este mercado en el rango seleccionado.",
        color: "Warning",
        duration: 3000,
      });
      toastShownRef.current = true;
    }
    return (
      <div className="w-full h-full flex items-center justify-center text-foreground/60">
        <p>No hay datos disponibles para este mercado en el rango seleccionado.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* Gráfico principal */}
      <div style={{ height }}>
        <Chart
          ref={chartRef}
          options={options}
          series={series}
          type={chartType}
          height="100%"
          width="100%"
        />
      </div>

      {/* Brush SOLO si está habilitado y (móvil || desactivado el modo “solo móvil”) */}
      {brushEnabledFinal && (
        <div style={{ marginTop: 8, height: 130 }}>
          <Chart options={brushOptions} series={brushSeries} type="bar" height="100%" width="100%" />
        </div>
      )}
    </div>
  );
}