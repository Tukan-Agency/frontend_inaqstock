import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { CircularProgress } from "@heroui/progress";
import { addToast } from "@heroui/react";

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
  // Opciones nuevas para rendimiento + animación
  enableBrush = true,         // muestra mini-gráfico inferior para recortar ventana
  maxPoints = 600,            // limita puntos renderizados (mejor perf con animación)
  initialRange = 200,         // cantidad de velas visibles al inicio
}) {
  // Recorta el dataset para no renderizar miles de puntos
  const sliced = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.length > maxPoints ? data.slice(-maxPoints) : data;
  }, [data, maxPoints]);

  // Serie principal
  const series = useMemo(() => {
    if (chartType === "candlestick") {
      return [
        {
          data: sliced.map((d) => ({ x: d.t, y: [d.o, d.h, d.l, d.c] })),
        },
      ];
    }
    // línea/área: usar cierre
    return [
      {
        data: sliced.map((d) => ({ x: d.t, y: d.c })),
      },
    ];
  }, [sliced, chartType]);

  // Rango inicial de la ventana visible (para el brush/selection)
  const { initMin, initMax } = useMemo(() => {
    if (!sliced.length) return { initMin: 0, initMax: 0 };
    const last = sliced.length;
    const minIndex = Math.max(0, last - initialRange);
    return { initMin: sliced[minIndex].t, initMax: sliced[last - 1].t };
  }, [sliced, initialRange]);

  // Animaciones "ligeras" para conservar transiciones sin penalizar tanto
  const animations = useMemo(
    () => ({
      enabled: true,
      speed: 300,
      animateGradually: { enabled: false },
      dynamicAnimation: { enabled: true, speed: 250 },
    }),
    []
  );

  // Opciones del gráfico principal
  const options = useMemo(
    () => ({
      chart: {
        id: "candles",
        type: chartType,
        height,
        toolbar: { show: showToolbar },
        animations,
        zoom: { enabled: chartType === "candlestick", type: "x" },
        redrawOnParentResize: false,
        redrawOnWindowResize: false,
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
        tooltip: { enabled: true },
        labels: {
          style: { colors: "#3386ac" },
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
      },
      dataLabels: { enabled: false },
      grid: { strokeDashArray: 3 },
      stroke:
        chartType === "candlestick"
          ? { width: 1 }
          : { width: 1, curve: "straight" },
      markers:
        chartType === "candlestick"
          ? { size: 0 }
          : { size: 0 }, // sin marcadores para mejor perf
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
    }),
    [chartType, height, showToolbar, animations, title, theme, colors]
  );

  // Opciones del gráfico "brush" (mini-rango inferior)
  const brushSeries = useMemo(
    () => [
      {
        data:
          chartType === "candlestick"
            ? sliced.map((d) => ({ x: d.t, y: d.c })) // usa close para algo liviano
            : sliced.map((d) => ({ x: d.t, y: d.c })),
      },
    ],
    [sliced, chartType]
  );

  const brushOptions = useMemo(
    () => ({
      chart: {
        id: "candles-range",
        type: "bar",
        animations,
        brush: { enabled: true, target: "candles" },
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

  // Loading
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <CircularProgress strokeWidth={4} aria-label="Cargando gráfico..." />
      </div>
    );
  }

  // No data
  if (!sliced || sliced.length === 0) {
    addToast?.({
      title: "Sin datos",
      description:
        "No hay datos disponibles para este mercado en el rango seleccionado.",
      color: "Warning",
      duration: 3500,
    });
    return (
      <div className="w-full h-full flex items-center justify-center text-foreground/60">
        <p>No hay datos disponibles para este mercado en el rango seleccionado.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div style={{ height }}>
        <Chart
          options={options}
          series={series}
          type={chartType}
          height="100%"
          width="100%"
        />
      </div>

      {chartType === "candlestick" && enableBrush && (
        <div style={{ marginTop: 8, height: 130 }}>
          <Chart
            options={brushOptions}
            series={brushSeries}
            type="bar"
            height="100%"
            width="100%"
          />
        </div>
      )}
    </div>
  );
}
