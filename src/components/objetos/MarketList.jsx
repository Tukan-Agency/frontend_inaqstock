import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  Input,
  Tabs,
  Tab,
  Button,
  addToast,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import MarketTradePanel from "./MarketTradePanel";
import { polygonService } from "../services/polygonService";
import { searchService } from "../services/searchService";

export default function MarketList({ onSelect }) {
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState("topmovers");
  const [expandedMarket, setExpandedMarket] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

 
  // Cargar los 20 mercados desde la IA o cache
  useEffect(() => {
    const loadPopularMarkets = async () => {
      try {
        setLoading(true);
        const todayKey = getTodayKey();
        const cacheData = localStorage.getItem("ai-topmovers");
        const cacheDate = localStorage.getItem("ai-topmovers-date");

        if (cacheData && cacheDate === todayKey) {
          setMarkets(JSON.parse(cacheData));
          setLoading(false);
          return;
        }

        const aiResponse = await searchService.searchSymbol(
          "dame los 20 mercados y monedas más populares y recomendables hasta el día de hoy"
        );

        let aiSymbols = [];
        try {
          aiSymbols = Array.isArray(aiResponse)
            ? aiResponse
            : JSON.parse(aiResponse);
        } catch {
          aiSymbols = [];
        }

        const marketPromises = aiSymbols.map(async (symbol) => {
          try {
            const data = await polygonService.getMarketPrice(symbol);
            const prev = data.results?.[0];
            return {
              symbol,
              name: symbol.replace(/^X:/, ""),
              type: "crypto",
              market: "global",
              exchange: "Polygon.io",
              price: prev?.c?.toFixed(2) || "N/A",
              change:
                prev?.o && prev?.c
                  ? (((prev.c - prev.o) / prev.o) * 100).toFixed(2)
                  : "0.00",
              volume: prev?.v || 0,
            };
          } catch {
            return {
              symbol,
              name: symbol.replace(/^X:/, ""),
              type: "crypto",
              market: "global",
              exchange: "Polygon.io",
              price: "N/A",
              change: "0.00",
              volume: 0,
            };
          }
        });

        const formattedMarkets = await Promise.all(marketPromises);
        setMarkets(formattedMarkets);
        localStorage.setItem("ai-topmovers", JSON.stringify(formattedMarkets));
        localStorage.setItem("ai-topmovers-date", todayKey);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Error cargando mercados populares.");
      } finally {
        setLoading(false);
      }
    };

    loadPopularMarkets();
  }, []);

  // Guardar favoritos
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Mostrar error
  useEffect(() => {
    if (error) {
      addToast({
        title: "Error cargando mercados",
        description: error,
        color: "Danger",
        duration: 3500,
      });
    }
  }, [error]);

  // --- BUSCAR CON IA ---
  const handleSearchWithAI = async () => {
    if (!searchText.trim()) {
      // Si está vacío, restaurar el cache
      const cached = localStorage.getItem("ai-topmovers");
      if (cached) setMarkets(JSON.parse(cached));
      return;
    }

    try {
      setLoading(true);
      const aiResponse = await searchService.searchSymbol(searchText);
      let aiSymbols = [];

      try {
        aiSymbols = Array.isArray(aiResponse)
          ? aiResponse
          : JSON.parse(aiResponse);
      } catch {
        aiSymbols = [aiResponse];
      }

      const marketPromises = aiSymbols.map(async (symbol) => {
        try {
          const data = await polygonService.getMarketPrice(symbol);
          const prev = data.results?.[0];
          return {
            symbol,
            name: symbol.replace(/^X:/, ""),
            type: "crypto",
            market: "global",
            exchange: "Polygon.io",
            price: prev?.c?.toFixed(2) || "N/A",
            change:
              prev?.o && prev?.c
                ? (((prev.c - prev.o) / prev.o) * 100).toFixed(2)
                : "0.00",
            volume: prev?.v || 0,
          };
        } catch {
          return {
            symbol,
            name: symbol.replace(/^X:/, ""),
            type: "crypto",
            market: "global",
            exchange: "Polygon.io",
            price: "N/A",
            change: "0.00",
            volume: 0,
          };
        }
      });

      const newMarkets = await Promise.all(marketPromises);
      setMarkets(newMarkets);
    } catch (err) {
      console.error(err);
      addToast({
        title: "Error en búsqueda",
        description: "No se pudo realizar la búsqueda con IA.",
        color: "Danger",
        duration: 3500,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- FAVORITOS ---
  const toggleFavorite = (symbol) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleMarketClick = (symbol) => {
    setExpandedMarket(expandedMarket === symbol ? null : symbol);
    if (onSelect) onSelect(symbol);
  };

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Si el tab activo es "favorites", filtrar solo esos
  const displayedMarkets =
    selectedTab === "favorites"
      ? markets.filter((m) => favoritesSet.has(m.symbol))
      : markets;

  const enriched = useMemo(
    () =>
      displayedMarkets.map((m) => ({
        ...m,
        isFavorite: favoritesSet.has(m.symbol),
      })),
    [displayedMarkets, favoritesSet]
  );

  // --- Render ---
  return (
    <Card className="min-h-[470px] border border-solid border-[#00689b9e]">
      <CardBody className="p-0">
        <div className="p-2 border-b border-[#00689b9e]">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
            size="sm"
            variant="light"
            className="mb-2"
          >
            <Tab
              key="favorites"
              title={
                <div className="flex items-center gap-1">
                  <Icon icon="material-symbols:star" />
                  <span>Favorites</span>
                </div>
              }
            />
            <Tab
              key="topmovers"
              title={
                <div className="flex items-center gap-1">
                  <Icon icon="material-symbols:trending-up" />
                  <span>Top Movers</span>
                </div>
              }
            />
          </Tabs>

          <div className="relative flex items-center">
            <Input
              placeholder="Buscar mercados o recomendaciones..."
              size="sm"
              startContent={<Icon icon="material-symbols:search" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchWithAI()}
              className="w-full pr-10"
            />
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="secondary"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg"
              onClick={handleSearchWithAI}
              aria-label="Buscar"
            >
              <Icon icon="mdi:magnify" width="20" height="20" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(470px-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Card className="w-full space-y-5 shadow-none" radius="lg">
                <Skeleton className="rounded-lg">
                  <div className="h-96 rounded-lg bg-default-300" />
                </Skeleton>
              </Card>
            </div>
          ) : enriched.length === 0 ? (
            <div className="flex items-center justify-center h-full text-default-500">
              <span>No markets found</span>
            </div>
          ) : (
            enriched.map((market) => {
              const isFav = market.isFavorite;
              return (
                <div key={market.symbol}>
                  <div
                    className="flex items-center justify-between p-3 hover:bg-default-100 cursor-pointer border-b border-[#00689b9e]"
                    onClick={() => handleMarketClick(market.symbol)}
                  >
                    <div>
                      <div className="font-medium">{market.name} </div>
                      <div className="text-xs text-default-500">
                        {market.symbol}
                      </div>
                      <div className="text-xs text-default-400">
                        {market.market}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {market.price === "N/A" ? "-" : `$${market.price}`}
                        </div>
                        <div
                          className={`text-xs ${
                            parseFloat(market.change) >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {parseFloat(market.change) >= 0 ? "+" : ""}
                          {market.change}%
                        </div>
                      </div>

                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-default-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(market.symbol);
                        }}
                      >
                        <Icon
                          icon={
                            isFav
                              ? "material-symbols:star"
                              : "material-symbols:star-outline"
                          }
                          width="20"
                          height="20"
                        />
                      </Button>
                    </div>
                  </div>

                  {expandedMarket === market.symbol && (
                    <div className="p-4 bg-default-50">
                      <MarketTradePanel market={market} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardBody>
    </Card>
  );
}
