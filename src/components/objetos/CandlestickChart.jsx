/* eslint-disable react/prop-types */
import { CircularProgress } from "@heroui/progress";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatMarketPrice } from "../../utils/marketPrice.js";

export default function CandlestickChart({
  data = [],
  loading = false,
  title = "Gráfico OHLC",
  height = 350,
  colors = { upward: "#0b827b", downward: "#e74c3c" },
  chartType = "candlestick",
  maxPoints = 260,
  livePrice = null,
  livePriceSymbol = "",
  liveMode = null,
}) {
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(1000);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const width = chartWidth;
  const margin = { top: title ? 36 : 20, right: 30, bottom: 36, left: 82 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const candles = useMemo(() => data
    .filter((item) => [item.t, item.o, item.h, item.l, item.c].every((value) => Number.isFinite(Number(value))))
    .slice(-maxPoints)
    .map((item) => ({
      t: Number(item.t),
      o: Number(item.o),
      h: Number(item.h),
      l: Number(item.l),
      c: Number(item.c),
    })), [data, maxPoints]);

  const domain = useMemo(() => {
    if (!candles.length) return { min: 0, max: 1 };
    let min = Math.min(...candles.map((item) => item.l));
    let max = Math.max(...candles.map((item) => item.h));
    if (Number.isFinite(livePrice)) {
      min = Math.min(min, Number(livePrice));
      max = Math.max(max, Number(livePrice));
    }
    const range = Math.max(max - min, Math.abs(max) * 0.01, 1);
    return { min: min - range * 0.06, max: max + range * 0.06 };
  }, [candles, livePrice]);

  const xAt = (index) => margin.left + (index + 0.5) * (plotWidth / candles.length);
  const yAt = (value) => margin.top + ((domain.max - value) / (domain.max - domain.min)) * plotHeight;
  const candleWidth = Math.max(1.5, Math.min(12, (plotWidth / Math.max(candles.length, 1)) * 0.68));
  const yTicks = Array.from({ length: 6 }, (_, index) => domain.max - ((domain.max - domain.min) * index) / 5);
  const xTickIndexes = [...new Set(Array.from({ length: Math.min(7, candles.length) }, (_, index) =>
    Math.round((index * (candles.length - 1)) / Math.max(1, Math.min(6, candles.length - 1))))
  )];
  const hovered = hoveredIndex == null ? null : candles[hoveredIndex];

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setChartWidth(Math.max(320, Math.round(entry.contentRect.width)));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><CircularProgress aria-label="Cargando gráfico" /></div>;
  }

  if (!candles.length) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center text-foreground/60">
        No hay cotizaciones disponibles para este periodo.
      </div>
    );
  }

  const linePoints = candles.map((item, index) => `${xAt(index)},${yAt(item.c)}`).join(" ");
  const liveY = Number.isFinite(livePrice) ? yAt(Number(livePrice)) : null;
  const liveColor = liveMode === "provider-ws" ? "#2563eb" : "#f59e0b";

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg
        className="block h-full w-full select-none"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title || livePriceSymbol}, gráfico de ${chartType === "candlestick" ? "velas" : "línea"}`}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="market-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1686b0" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1686b0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {title && <text x={margin.left} y="21" fill="#18A777" fontSize="14" fontWeight="700">{title}</text>}
        {yTicks.map((tick) => {
          const y = yAt(tick);
          return (
            <g key={tick}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#94a3b8" strokeOpacity="0.28" strokeDasharray="4 4" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#18A777" fontSize="11">
                {formatMarketPrice(tick, livePriceSymbol, true)}
              </text>
            </g>
          );
        })}

        {chartType === "candlestick" ? candles.map((item, index) => {
          const x = xAt(index);
          const rising = item.c >= item.o;
          const color = rising ? colors.upward : colors.downward;
          const bodyTop = yAt(Math.max(item.o, item.c));
          const bodyBottom = yAt(Math.min(item.o, item.c));
          return (
            <g key={`${item.t}-${index}`} onMouseEnter={() => setHoveredIndex(index)}>
              <line x1={x} x2={x} y1={yAt(item.h)} y2={yAt(item.l)} stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(1.5, bodyBottom - bodyTop)} fill={color} />
              <rect x={x - Math.max(candleWidth, 8) / 2} y={margin.top} width={Math.max(candleWidth, 8)} height={plotHeight} fill="transparent" />
            </g>
          );
        }) : (
          <>
            <polygon
              points={`${linePoints} ${xAt(candles.length - 1)},${margin.top + plotHeight} ${xAt(0)},${margin.top + plotHeight}`}
              fill="url(#market-line-fill)"
            />
            <polyline points={linePoints} fill="none" stroke="#1686b0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            {candles.map((item, index) => (
              <rect
                key={`${item.t}-${index}`}
                x={xAt(index) - Math.max(candleWidth, 8) / 2}
                y={margin.top}
                width={Math.max(candleWidth, 8)}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
              />
            ))}
          </>
        )}

        {liveY != null && (
          <g>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={liveY}
              y2={liveY}
              stroke={liveColor}
              strokeWidth="1.5"
              strokeDasharray={liveMode === "provider-ws" ? undefined : "6 4"}
              vectorEffect="non-scaling-stroke"
            />
            <rect x={width - margin.right - 106} y={liveY - 11} width="106" height="22" rx="4" fill={liveColor} />
            <text x={width - margin.right - 6} y={liveY + 4} textAnchor="end" fill="white" fontSize="11" fontWeight="700">
              {formatMarketPrice(livePrice, livePriceSymbol)}
            </text>
          </g>
        )}

        {xTickIndexes.map((index) => (
          <text key={candles[index].t} x={xAt(index)} y={height - 10} textAnchor="middle" fill="#18A777" fontSize="11">
            {new Date(candles[index].t).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
          </text>
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-default-200 bg-content1/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
          style={{ left: `${Math.min(78, Math.max(10, (xAt(hoveredIndex) / width) * 100))}%`, top: 42 }}
        >
          <div className="mb-1 font-semibold">{new Date(hovered.t).toLocaleString()}</div>
          <div>Apertura: {formatMarketPrice(hovered.o, livePriceSymbol)}</div>
          <div>Máximo: {formatMarketPrice(hovered.h, livePriceSymbol)}</div>
          <div>Mínimo: {formatMarketPrice(hovered.l, livePriceSymbol)}</div>
          <div>Cierre: {formatMarketPrice(hovered.c, livePriceSymbol)}</div>
        </div>
      )}
    </div>
  );
}
