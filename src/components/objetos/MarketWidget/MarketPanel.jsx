import React, { useState, useEffect } from "react";
import { Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function MarketPanel({ symbol }) {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      setError(null);

      // Calcular dinámicamente el rango de fechas
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const formattedToday = today.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      const formattedSevenDaysAgo = sevenDaysAgo.toISOString().split("T")[0]; // Formato YYYY-MM-DD

      try {
        // Usar el endpoint 'range' con fechas dinámicas
        const response = await axios.get(
          `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${formattedSevenDaysAgo}/${formattedToday}?adjusted=true&sort=asc&apiKey=${import.meta.env.VITE_POLYGON_API_KEY}`
        );

        if (response.data && response.data.results.length > 0) {
          const results = response.data.results;

          // Procesar los datos para calcular rangos y cambios
          const processedData = {
            range: {
              daily: {
                low: results[results.length - 1].l,
                high: results[results.length - 1].h,
              },
            },
            change: {
              daily: ((results[results.length - 1].c - results[results.length - 1].o) / results[results.length - 1].o) * 100,
            },
            sentiment: {
              positive: Math.random() * 100, // Simulando datos de sentimiento
              negative: Math.random() * 100,
            },
          };

          setMarketData(processedData);
        } else {
          setMarketData(null);
          setError("No hay datos disponibles para el símbolo seleccionado.");
        }
      } catch (apiError) {
        console.error("Error fetching market data:", apiError);
        setError("Error al cargar los datos del mercado.");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Icon icon="carbon:no-content" width={40} className="text-gray-400" />
        <p className="mt-4 text-red-500">{error}</p>
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
    <div className="p-4   rounded-lg shadow">
      {/* Sentimiento del mercado */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Sentimiento del mercado</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-red-500">
            {marketData.sentiment.negative.toFixed(0)}%
          </span>
          <div className="flex-grow h-2   rounded">
            <div
              className="h-2 bg-green-500 rounded"
              style={{ width: `${marketData.sentiment.positive}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-green-500">
            {marketData.sentiment.positive.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Cambio */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Cambio diario</h3>
        <div className="flex items-center justify-center border rounded-lg p-2  ">
          <span className="text-sm font-medium">
            {marketData.change.daily.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Rango */}
      <div>
        <h3 className="text-sm font-medium mb-2">Rango diario</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            L: {marketData.range.daily.low.toFixed(2)}
          </span>
          <div className="flex-grow h-2 bg-gray-300 rounded"></div>
          <span className="text-xs text-gray-500">
            Alto: {marketData.range.daily.high.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}