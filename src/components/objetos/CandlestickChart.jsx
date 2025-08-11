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
  enableBrush = true,         // mini-gráfico inferior para recortar ventana
  maxPoints = 600,            // puntos máximos a renderizar
  initialRange = 200,         // cantidad inicial de velas visibles
}) {
  // Recorta el dataset
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
    return [
      {
        data: sliced.map((d) => ({ x: d.t, y: d.c })),
      },
    ];
  }, [sliced, chartType]);

  // Rango inicial para el brush
  const { initMin, initMax } = useMemo(() => {
    if (!sliced.length) return { initMin: 0, initMax: 0 };
    const last = sliced.length;
    const minIndex = Math.max(0, last - initialRange);
    return { initMin: sliced[minIndex].t, initMax: sliced[last - 1].t };
  }, [sliced, initialRange]);

  // Animaciones: desactivar solo si es candlestick
  const animations = useMemo(
    () => ({
      enabled: chartType !== "candlestick", // sin animación para velas
      speed: 300,
      animateGradually: { enabled: false },
      dynamicAnimation: { enabled: chartType !== "candlestick", speed: 250 },
    }),
    [chartType]
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
    }),
    [chartType, height, showToolbar, animations, title, theme, colors]
  );

  // Opciones del brush
  const brushSeries = useMemo(
    () => [
      {
        data: sliced.map((d) => ({ x: d.t, y: d.c })), // solo cierre para optimizar
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

  // Sin datos
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
