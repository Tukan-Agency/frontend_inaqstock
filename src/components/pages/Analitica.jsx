import React, { useState } from "react";
import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/react";
import MarketList from "../../components/objetos/MarketList.jsx";
import MarketWidget from "../objetos/MarketWidget/MarketWidget.jsx";
import TradingTabs from "../objetos/TradingTabs.jsx";
import useCachedData from "../../hooks/useCachedData.js";

export default function Analitica() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState("X:BTCUSD");

  const url = `https://api.polygon.io/v2/aggs/ticker/${selectedSymbol}/range/1/day/2025-01-01/2025-12-31?apiKey=MF98h8vorj239xqQzHGEgjZ4JefrmFOj`;

  const { data, loading, error } = useCachedData(url, async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al cargar los datos.");
    return await response.json();
  });

  if (session.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  return (
    <div className="text-foreground bg-background h-[100vh]">
      <div className="flex flex-col gap-4 p-5">
        <Nav />
        <div className="pt-5 flex flex-row gap-4 h-[700px]">
          {/* Columna izquierda (estática) */}
          <div className="flex flex-col flex-[1] gap-4">
            <MarketList onSelect={(symbol) => setSelectedSymbol(symbol)} />

            <Card className="flex-1 min-h-[350px] border border-solid border-[#00689b9e]">
              <CardBody>
                <MarketWidget selectedSymbol={selectedSymbol} />
              </CardBody>
            </Card>
          </div>

          {/* Columna derecha (scrolleable) */}
          <div className="flex-[3] overflow-y-auto">
            <Card className="min-h-[840px] border border-solid border-[#00689b9e]">
              <CardBody>
                {loading ? (
                  <p>Cargando...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  <TradingTabs openPositions={[]} />
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
