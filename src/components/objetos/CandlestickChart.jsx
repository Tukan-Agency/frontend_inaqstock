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
    downward: "#e74c3c"
  },
  theme = "dark",
  chartType = "candlestick", // <- nuevo prop
}) {
  // Memoizamos la serie para evitar re-renderizados innecesarios
  const series = useMemo(() => [
    chartType === "candlestick"
      ? { data: data.map((d) => ({ x: d.t, y: [d.o, d.h, d.l, d.c] })) }
      : { data: data.map((d) => ({ x: d.t, y: d.c })) },
  ], [data, chartType]);

  // Memoizamos las opciones del gráfico
  const options = useMemo(() => ({
    chart: {
      type: chartType,
      height: height,
      toolbar: { show: showToolbar },
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
        fontSize: '12px',
        fontFamily: 'inherit',
      },
      onDatasetHover: {
        highlightDataSeries: false,
      },
    },
    plotOptions: chartType === "candlestick"
      ? {
          candlestick: {
            colors: {
              upward: colors.upward,
              downward: colors.downward,
            },
          },
        }
      : {},
  }), [title, height, showToolbar, colors, theme, chartType]);

  // Mostrar loading
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <CircularProgress
          strokeWidth={4}
          aria-label="Cargando gráfico..."
        />
      </div>
    );
  }

  // No hay datos
  if (!data || data.length === 0) {
    addToast?.({
      title: "Sin datos",
      description: "No hay datos disponibles para este mercado en el rango seleccionado.",
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
    <Chart
      options={options}
      series={series}
      type={chartType}
      height="100%"
      width="100%"
    />
  );
}