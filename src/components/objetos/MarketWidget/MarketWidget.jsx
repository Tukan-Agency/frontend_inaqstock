import { useState, useEffect } from "react";
import { Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import NewsPanel from "./NewsPanel";
import MarketPanel from "./MarketPanel";
import SymbolInfoPanel from "./SymbolInfoPanel";

export default function MarketWidget({ selectedSymbol = "X:BTCUSD" }) {
  const [selected, setSelected] = useState("noticias");
  const [currentSymbol, setCurrentSymbol] = useState(selectedSymbol);

  // Actualizar el símbolo si cambia desde las props
  useEffect(() => {
    setCurrentSymbol(selectedSymbol);
  }, [selectedSymbol]);

  return (
    <div className="market-widget">
      <Tabs
        aria-label="Market options"
        selectedKey={selected}
        onSelectionChange={setSelected}
        variant="bordered"
        size="sm"
        classNames={{
          base: "w-full",
          tabList: "bg-default-100 p-0.5 rounded-lg",
          cursor: "bg-primary group-data-[selected=true]:shadow-none",
          panel: "pt-2",
        }}
      >
        <Tab
          key="noticias"
          title={
            <div className="flex items-center gap-2 py-1">
              <Icon icon="mdi:newspaper-variant-outline" />
              <span>Noticias</span>
            </div>
          }
        >
          {/* Panel que carga las noticias según el símbolo */}
          <NewsPanel symbol={currentSymbol} />
        </Tab>
        <Tab
          key="mercado"
          title={
            <div className="flex items-center gap-2 py-1">
              <Icon icon="material-symbols:trending-up" />
              <span>Mercado</span>
            </div>
          }
        >
          {/* Panel que muestra datos del mercado según el símbolo */}
          <MarketPanel symbol={currentSymbol} />
        </Tab>
        <Tab
          key="informacion"
          title={
            <div className="flex items-center gap-2 py-1">
              <Icon icon="material-symbols:info-outline" />
              <span>Información del símbolo</span>
            </div>
          }
        >
          {/* Panel que muestra información detallada del símbolo */}
          <SymbolInfoPanel symbol={currentSymbol} />
        </Tab>
      </Tabs>
    </div>
  );
}