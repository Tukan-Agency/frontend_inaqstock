import React, { useState, useEffect } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function SymbolInfoPanel({ symbol }) {
  const [symbolData, setSymbolData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSymbolData = async () => {
      if (!symbol) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=MF98h8vorj239xqQzHGEgjZ4JefrmFOj`
        );
        setSymbolData(response.data.results);
      } catch (err) {
        console.error("Error fetching symbol data:", err);
        setError("No se pudo cargar la información del símbolo.");
      } finally {
        setLoading(false);
      }
    };

    fetchSymbolData();
  }, [symbol]);

 

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center">
        <Icon icon="eos-icons:loading" width={30} className="mr-2" />
        <span>Cargando información del símbolo...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center text-red-500">
        <Icon icon="carbon:warning-alt" width={30} className="mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (!symbolData) {
    return (
      <div className="p-4 bg-white rounded-lg shadow flex items-center justify-center text-gray-500">
        <Icon icon="carbon:no-content" width={30} className="mr-2" />
        <span>No hay datos disponibles para el símbolo seleccionado.</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Nombre y descripción */}
      <div className="mb-4">
        <h3 className="text-sm font-bold">{symbolData.name}</h3>
        <p className="text-xs text-gray-500">{symbolData.description}</p>
      </div>

      {/* Detalles principales */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Clase de símbolo</h3>
          <p className="text-sm font-medium">{symbolData.type}</p>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Mercado</h3>
          <p className="text-sm font-medium">{symbolData.market}</p>
        </div>
      </div>

      {/* Información financiera */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Capitalización de mercado</h3>
          <p className="text-sm font-medium">
            {symbolData.market_cap
              ? `$${symbolData.market_cap.toLocaleString()}`
              : "N/A"}
          </p>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Acciones en circulación</h3>
          <p className="text-sm font-medium">
            {symbolData.weighted_shares_outstanding
              ? symbolData.weighted_shares_outstanding.toLocaleString()
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Teléfono</h3>
          <p className="text-sm font-medium">{symbolData.phone_number || "N/A"}</p>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Página web</h3>
          <a
            href={symbolData.homepage_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500"
          >
            {symbolData.homepage_url || "N/A"}
          </a>
        </div>
      </div>

      {/* Branding */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          {symbolData.branding?.logo_url && (
            <img
              src={symbolData.branding.logo_url}
              alt={`${symbolData.name} Logo`}
              className="w-16 h-16 object-contain"
            />
          )}
        </div>
        <div>
          {symbolData.branding?.icon_url && (
            <img
              src={symbolData.branding.icon_url}
              alt={`${symbolData.name} Icon`}
              className="w-8 h-8 object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}