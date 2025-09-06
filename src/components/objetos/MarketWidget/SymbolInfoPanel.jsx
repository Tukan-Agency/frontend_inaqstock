import React, { useState, useEffect } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function SymbolInfoPanel({ symbol }) {
  const [symbolData, setSymbolData] = useState({
    name: "CFD basado en onzas troy de plata",
    type: "CFD",
    minPosition: 0.01,
    pointSize: 0.001,
    spread: { bid: -5.497, ask: 3.601 },
    nominalValue: "204 835,00 USD",
    pointValue: "5,00 USD",
    leverage: "1: 100 (1,00%)",
    marketHours: {
      monday: [
        { open: "00:00", close: "21:00" },
        { open: "22:01", close: "23:59" },
      ],
      tuesday: [
        { open: "00:00", close: "21:00" },
        { open: "22:01", close: "23:59" },
      ],
      wednesday: [
        { open: "00:00", close: "21:00" },
        { open: "22:01", close: "23:59" },
      ],
      thursday: [
        { open: "00:00", close: "21:00" },
        { open: "22:01", close: "23:59" },
      ],
      friday: [{ open: "00:00", close: "20:55" }],
      saturday: [],
      sunday: [{ open: "22:01", close: "23:59" }],
    },
    sessionClosed: true,
  });

  useEffect(() => {
    const fetchSymbolData = async () => {
      if (!symbol) return;

      try {
        // Aquí iría la llamada a la API real si estuviera disponible
        // const response = await axios.get(`https://api.example.com/symbol/${symbol}`);
        // setSymbolData(response.data);
      } catch (error) {
        console.error("Error fetching symbol data:", error);
      }
    };

    fetchSymbolData();
  }, [symbol]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Detalles y Clase de símbolo */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Detalles</h3>
          <p className="text-sm font-medium">{symbolData.name}</p>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Clase de símbolo</h3>
          <p className="text-sm font-medium">{symbolData.type}</p>
        </div>
      </div>

      {/* Tamaños de posición */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Tamaño mínimo de posición</h3>
          <p className="text-sm font-medium">{symbolData.minPosition}</p>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Tamaño de punto</h3>
          <p className="text-sm font-medium">{symbolData.pointSize}</p>
        </div>
      </div>

      {/* Intercambio y valor nominal */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Intercambio (puntos)</h3>
          <p className="text-sm">
            <span className="text-red-600">L: {symbolData.spread.bid}</span>
            <span className="mx-1">|</span>
            <span className="text-green-600">S: {symbolData.spread.ask}</span>
          </p>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Valor nominal de 1 lote</h3>
          <p className="text-sm font-medium">{symbolData.nominalValue}</p>
        </div>
      </div>

      {/* Valor de punto y apalancamiento */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Valor de punto por 1 lote</h3>
          <p className="text-sm font-medium">{symbolData.pointValue}</p>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-1">Apalancamiento</h3>
          <p className="text-sm font-medium">{symbolData.leverage}</p>
        </div>
      </div>

      {/* Horario del mercado */}
      <Accordion>
        <AccordionItem
          key="horario"
          aria-label="Horario del mercado"
          title={
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Horario del mercado</span>
              {symbolData.sessionClosed && (
                <span className="text-xs text-amber-600 flex items-center">
                  <Icon icon="ph:moon-stars" className="mr-1" />
                  La sesión está cerrada
                </span>
              )}
            </div>
          }
          classNames={{
            title: "text-sm py-2",
            content: "text-sm",
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
              <div key={day}>
                <p className="text-sm text-gray-600 mb-1">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </p>
                {symbolData.marketHours[day].length ? (
                  symbolData.marketHours[day].map((hours, idx) => (
                    <p key={idx} className="text-xs">
                      {hours.open} - {hours.close}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">Cerrado</p>
                )}
              </div>
            ))}
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}