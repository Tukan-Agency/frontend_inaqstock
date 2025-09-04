import { Tab, Tabs } from "@heroui/react";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import OpenPositionsTable from "./OpenPositionsTable";
import ClosedPositionsTable from "./ClosedPositionsTable";
import { TradingService } from "../../components/services/tradingService";

export default function TradingTabs() {
  const [selectedTab, setSelectedTab] = useState("open");
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  useEffect(() => {
    const handleTrade = async (event) => {
      try {
        const savedPosition = event.detail;
        setOpenPositions(prev => [...prev, savedPosition]);
        console.log('Nueva posición agregada a la tabla:', savedPosition);
      } catch (error) {
        console.error("Error al manejar el evento de trade:", error);
      }
    };

    window.addEventListener('trade-executed', handleTrade);
    return () => window.removeEventListener('trade-executed', handleTrade);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (openPositions.length > 0) {
        try {
          const updatedPositions = await Promise.all(
            openPositions.map(async (position) => {
              try {
                return await TradingService.updatePositionPrice(
                  position._id,
                  position.currentPrice
                );
              } catch (error) {
                console.error(`Error actualizando posición ${position._id}:`, error);
                return position;
              }
            })
          );
          setOpenPositions(updatedPositions);
        } catch (error) {
          console.error('Error actualizando precios:', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [openPositions]);

  const loadPositions = async () => {
    setIsLoading(true);
    try {
      const [open, closed] = await Promise.all([
        TradingService.getOpenPositions(),
        TradingService.getClosedPositions()
      ]);
      setOpenPositions(open);
      setClosedPositions(closed);
    } catch (error) {
      console.error("No se pudieron cargar las posiciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async (position) => {
    try {
      const closingData = {
        closePrice: position.currentPrice,
        closeTime: new Date().toISOString()
      };
      
      const closedPosition = await TradingService.closePosition(position._id, closingData);
      
      setOpenPositions(prev => prev.filter(p => p._id !== position._id));
      setClosedPositions(prev => [...prev, closedPosition]);
    } catch (error) {
      console.error("No se pudo cerrar la posición:", error);
    }
  };

  const tabs = [
    {
      id: "open",
      label: "Posiciones abiertas",
      icon: "famicons:book"
    },
    {
      id: "pending",
      label: "Órdenes pendientes",
      icon: "lets-icons:order-fill"
    },
    {
      id: "closed",
      label: "Posiciones cerradas",
      icon: "zondicons:close-solid"
    },
    {
      id: "finances",
      label: "Finanzas",
      icon: "majesticons:creditcard"
    }
  ];

  return (
    <div className="w-full">
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={setSelectedTab}
        aria-label="Trading Tabs"
        className="w-full"
        variant="bordered"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            title={
              <div className="flex items-center gap-2">
                <Icon icon={tab.icon} width={20} />
                <span>{tab.label}</span>
              </div>
            }
          >
            {tab.id === "open" && (
              <div className="py-4">
                <OpenPositionsTable 
                  positions={openPositions}
                  onClosePosition={handleClosePosition}
                  isLoading={isLoading}
                />
              </div>
            )}
            
            {tab.id === "closed" && (
              <div className="py-4">
                <ClosedPositionsTable 
                  positions={closedPositions}
                  isLoading={isLoading}
                />
              </div>
            )}

            {tab.id === "pending" && (
              <div className="py-4">
                <div className="flex items-center justify-center flex-col min-h-[200px] m-auto">
                  <div style={{
                    background: "#00689824",
                    padding: "26px",
                    borderRadius: "73px",
                    marginBottom: "13px",
                  }}>
                    <Icon color="#3285ab" icon={tab.icon} width={80} />
                  </div>
                  <h2>No tienes órdenes pendientes.</h2>
                  <p className="text-default-500">
                    Comienza a operar y aquí verás tus órdenes pendientes.
                  </p>
                </div>
              </div>
            )}

            {tab.id === "finances" && (
              <div className="py-4">
                <div className="flex items-center justify-center flex-col min-h-[200px] m-auto">
                  <div style={{
                    background: "#00689824",
                    padding: "26px",
                    borderRadius: "73px",
                    marginBottom: "13px",
                  }}>
                    <Icon color="#3285ab" icon={tab.icon} width={80} />
                  </div>
                  <h2>Información financiera no disponible.</h2>
                </div>
              </div>
            )}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}