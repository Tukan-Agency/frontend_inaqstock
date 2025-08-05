import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { CircularProgress } from "@heroui/progress";

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
  theme = "dark"
}) {
  // Memoizamos la serie para evitar re-renderizados innecesarios
  const series = useMemo(() => [
    {
      data: data.map((d) => ({
        x: d.t,
        y: [d.o, d.h, d.l, d.c],
      })),
    },
  ], [data]);

  // Memoizamos las opciones del gráfico
  const options = useMemo(() => ({
    chart: {
      type: "candlestick",
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
    plotOptions: {
      candlestick: {
        colors: {
          upward: colors.upward,
          downward: colors.downward,
        },
      },
    },
  }), [title, height, showToolbar, colors, theme]);

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
    return (
      <div className="w-full h-full flex items-center justify-center text-foreground/60">
        <p>No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <Chart
      options={options}
      series={series}
      type="candlestick"
      height="100%"
      width="100%"
    />
  );
}