import React, { useState } from "react";
import { Skeleton } from "@heroui/react";
import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
} from "@heroui/react";
import MarketList from "../objetos/MarketList.jsx";
import MarketWidget from "../objetos/MarketWidget/MarketWidget.jsx";
import useCachedData from "../../hooks/useCachedData.js";

export default function GraficaStock() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState("X:BTCUSD");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const url = `https://api.polygon.io/v2/aggs/ticker/${selectedSymbol}/range/1/day/2025-01-01/2025-12-31?apiKey=${
    import.meta.env.VITE_POLYGON_API_KEY
  }`;
  const { data, loading, error } = useCachedData(url, async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al cargar los datos.");
    return await response.json();
  });

  if (session.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  const iframeSrc = `https://tvc-invdn-com.investing.com/web/1.12.34/index59-prod.html?carrier=e47b9c69be124c78caafd327fce2b275&time=1660760768&domain_ID=4&lang_ID=4&timezone_ID=58&version=1.12.34&locale=es&timezone=Europe%2FMadrid&pair_ID=1&interval=15&session=24x7&prefix=es&user=guest&family_prefix=tvc6&init_page=live-charts&sock_srv=https%3A%2F%2Fstreaming.forexpros.com%3A443&watchlist=1%2C2%2C3%2C9%2C5%2C7%2C6%2C945629%2C8827%2C10%2C8%2C15%2C52%2C16%2C39%2C2103%2C2110%2C2186&geoc=MX&site=https%3A%2F%2Fes.investing.com`;

  return (
    <div className="text-foreground bg-background h-[100vh]">
      <div className="flex flex-col gap-4 p-5">
        <Nav />
        <div className="pt-5 flex flex-row gap-4 h-[800px]">
          {/* Columna izquierda */}
          <div className="flex flex-col flex-[1] gap-4">
            <MarketList onSelect={(symbol) => {
              setIframeLoaded(false);
              setSelectedSymbol(symbol);
            }} />

            <Card className="flex-1 min-h-[350px] border border-solid border-[#00689b9e]">
              <CardBody>
                <MarketWidget selectedSymbol={selectedSymbol} />
              </CardBody>
            </Card>
          </div>

          {/* Columna derecha */}
          <Card className="flex-[3] border border-solid border-[#00689b9e]">
            <CardBody className="p-6">
              {/* Skeleton mostrado mientras el iframe no ha cargado */}
              <Skeleton
                isLoaded={iframeLoaded}
                classNames={{
                  base: "w-full h-[600px] rounded-xl bg-default-50",
                  content: "w-full h-[600px]",
                }}
              >
                {/* Este contenido se mostrará cuando `isLoaded = true` */}
                <iframe
                  id="advanced_iframe"
                  name="advanced_iframe"
                  src={iframeSrc}
                  width="100%"
                  height="600"
                  frameBorder="0"
                  allowTransparency={true}
                  loading="lazy"
                  style={{ width: "100%", height: "700px", border: "none" }}
                  title="TradingView Widget"
                  onLoad={() => {
                    setIframeLoaded(true);
                  }}
                ></iframe>
              </Skeleton>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
