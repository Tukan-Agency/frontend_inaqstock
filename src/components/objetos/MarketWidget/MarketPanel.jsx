import React, { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function MarketPanel({ symbol }) {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=MF98h8vorj239xqQzHGEgjZ4JefrmFOj`
        );

        if (response.data && response.data.results) {
          const marketInfo = response.data.results[0];
          setMarketData({
            sentiment: {
              positive: Math.random() * 100, // Simulando datos de sentimiento
              negative: Math.random() * 100,
            },
            change: {
              daily: ((marketInfo.c - marketInfo.o) / marketInfo.o) * 100,
              weekly: Math.random() * 5, // Simulando datos semanales
              monthly: Math.random() * 10, // Simulando datos mensuales
            },
            range: {
              daily: { low: marketInfo.l, high: marketInfo.h },
              weekly: { low: marketInfo.l - 5, high: marketInfo.h + 5 }, // Simulado
              monthly: { low: marketInfo.l - 10, high: marketInfo.h + 10 }, // Simulado
            },
          });
        }
      } catch (error) {
        console.error("Error fetching market data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Spinner color="primary" size="lg" />
        <p className="mt-4 text-gray-500">Cargando datos del mercado...</p>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Icon icon="carbon:no-content" width={40} className="text-gray-400" />
        <p className="mt-4 text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Sentimiento del mercado */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Sentimiento del mercado</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-red-500">{marketData.sentiment.negative.toFixed(0)}%</span>
          <div className="flex-grow h-2 bg-gray-300 rounded">
            <div
              className="h-2 bg-green-500 rounded"
              style={{ width: `${marketData.sentiment.positive}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-green-500">{marketData.sentiment.positive.toFixed(0)}%</span>
        </div>
      </div>

      {/* Cambio */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Cambio</h3>
        <div className="grid grid-cols-3 gap-4">
          {["daily", "weekly", "monthly"].map((period, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center border rounded-lg p-2 bg-gray-50"
            >
              <span className="text-xs text-gray-500">
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </span>
              <span className="text-sm font-medium">
                {marketData.change[period].toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rango */}
      <div>
        <h3 className="text-sm font-medium mb-2">Rango</h3>
        {["daily", "weekly", "monthly"].map((period, idx) => (
          <div key={idx} className="flex flex-col mb-4">
            <span className="text-xs text-gray-500 mb-1">
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                L: {marketData.range[period].low.toFixed(2)}
              </span>
              <div className="flex-grow h-2 bg-gray-300 rounded relative">
                <div
                  className="absolute top-0 h-2 bg-blue-500 rounded"
                  style={{
                    left: `${((marketData.range[period].low - marketData.range[period].low) /
                      (marketData.range[period].high - marketData.range[period].low)) *
                      100}%`,
                    width: `${((marketData.range[period].high - marketData.range[period].low) /
                      marketData.range[period].high) *
                      100}%`,
                  }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">
                Alto: {marketData.range[period].high.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}