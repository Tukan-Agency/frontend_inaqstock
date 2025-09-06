import { useState, useEffect } from "react";
import { Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import NewsPanel from "./NewsPanel";
import MarketPanel from "./MarketPanel";
import SymbolInfoPanel from "./SymbolInfoPanel";
import "./MarketWidget.css";

export default function MarketWidget({ selectedSymbol = "X:BTCUSD" }) {
  const [selected, setSelected] = useState("mercado");
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
        variant="light"
        size="sm"
        classNames={{
          base: "w-full",
          tabList: "bg-default-100 p-0.5 rounded-lg",
          tab: "data-[selected=true]:bg-primary data-[selected=true]:text-white rounded-md px-3",
          cursor: "bg-primary group-data-[selected=true]:shadow-none",
          panel: "pt-2"
        }}
      >
        <Tab
          key="mercado"
          title={
            <div className="flex items-center gap-2 py-1">
              <Icon icon="material-symbols:trending-up" />
              <span>Mercado</span>
            </div>
          }
        >
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
          <SymbolInfoPanel symbol={currentSymbol} />
        </Tab>
        <Tab
          key="noticias"
          title={
            <div className="flex items-center gap-2 py-1">
              <Icon icon="mdi:newspaper-variant-outline" />
              <span>Noticias</span>
            </div>
          }
        >
          <NewsPanel symbol={currentSymbol} />
        </Tab>
      </Tabs>
    </div>
  );
}