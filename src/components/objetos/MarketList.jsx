import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Input,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  addToast,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import MarketTradePanel from "./MarketTradePanel";
import { polygonService } from "../services/polygonService";

export default function MarketList({ onSelect }) {
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState("favorites");
  const [expandedMarket, setExpandedMarket] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [topMovers, setTopMovers] = useState([]); // Nueva state para top movers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMarketData, setSelectedMarketData] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Toast para errores generales (lista de mercados)
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

  // Toast para errores del precio
  useEffect(() => {
    if (priceError) {
      addToast({
        title: "Error de mercado",
        description: priceError,
        color: "Danger",
        duration: 3500,
      });
      setPriceError(null);
    }
  }, [priceError]);

  // Cargar lista de mercados y top movers
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setLoading(true);
        
        // Cargar mercados regulares (para favorites)
        const data = await polygonService.getMarketsList();
        const formattedMarkets = (data.tickers || []).map((t) => ({
          symbol: t.ticker,
          name: t.ticker.replace(/^X:/, ""),
          type: "crypto",
          market: "crypto",
          exchange: "CRYPTO",
          isFavorite: favorites.includes(t.ticker),
        }));
        setMarkets(formattedMarkets);

        // Cargar top movers usando la nueva función
        const popularCrypto = await polygonService.getPopularCrypto();
        const formattedTopMovers = (popularCrypto || []).map((t) => ({
          symbol: t.ticker,
          name: t.ticker.replace(/^X:/, ""),
          type: "crypto",
          market: "crypto",
          exchange: "CRYPTO",
          isFavorite: favorites.includes(t.ticker),
          // Datos adicionales para mostrar en top movers
          price: t.day?.c?.toFixed(2) || "N/A",
          change: t.day?.c && t.day?.o ? 
            (((t.day.c - t.day.o) / t.day.o) * 100).toFixed(2) : "0.00",
          volume: t.day?.v || 0,
        }));
        setTopMovers(formattedTopMovers);

        setError(null);
      } catch (err) {
        setError("Error cargando mercados");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMarkets();
  }, [favorites]);

  // Cargar precio cuando se expande un mercado
  useEffect(() => {
    const loadMarketPrice = async () => {
      if (!expandedMarket) {
        setSelectedMarketData(null);
        setPriceError(null);
        return;
      }

      try {
        setLoadingPrice(true);
        const priceData = await polygonService.getMarketPrice(expandedMarket);
        if (priceData.results?.[0]) {
          setSelectedMarketData({
            price: priceData.results[0].c.toFixed(2),
            openPrice: priceData.results[0].o,
            highPrice: priceData.results[0].h,
            lowPrice: priceData.results[0].l,
            volume: priceData.results[0].v,
            change: (
              ((priceData.results[0].c - priceData.results[0].o) /
                priceData.results[0].o) *
              100
            ).toFixed(2),
          });
          setPriceError(null);
        } else {
          setSelectedMarketData(null);
          setPriceError("No se encontraron datos del mercado.");
        }
      } catch (err) {
        console.error(`Error loading price for ${expandedMarket}:`, err);
        setSelectedMarketData(null);
        setPriceError("Error cargando datos de mercado.");
      } finally {
        setLoadingPrice(false);
      }
    };

    loadMarketPrice();
  }, [expandedMarket]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (symbol) => {
    setFavorites((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  const handleMarketClick = (symbol) => {
    setExpandedMarket(expandedMarket === symbol ? null : symbol);
    if (onSelect) onSelect(symbol);
  };

  // Usar diferentes fuentes según la pestaña seleccionada
  const sourceMarkets = selectedTab === "topmovers" ? topMovers : markets;
  
  const filteredMarkets = sourceMarkets.filter(
    (market) =>
      market.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
      market.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const displayedMarkets =
    selectedTab === "favorites"
      ? filteredMarkets.filter((m) => m.isFavorite)
      : filteredMarkets;

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

          <Input
            placeholder="Search symbols..."
            size="sm"
            startContent={<Icon icon="material-symbols:search" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full"
          />
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
          ) : displayedMarkets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-default-500">
              <span>
                {selectedTab === "favorites"
                  ? "No favorite markets yet"
                  : "No markets found"}
              </span>
            </div>
          ) : (
            displayedMarkets.map((market) => (
              <div key={market.symbol}>
                <div
                  className="flex items-center justify-between p-3 hover:bg-default-100 cursor-pointer border-b border-[#00689b9e]"
                  onClick={() => handleMarketClick(market.symbol)}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">{market.symbol}</div>
                      <div className="text-xs text-default-500">
                        {market.name}
                      </div>
                      <div className="text-xs text-default-400">
                        {market.market} • {market.exchange}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Mostrar precio y cambio en Top Movers */}
                    {selectedTab === "topmovers" && market.price && (
                      <div className="text-right text-sm">
                        <div className="font-medium">${market.price}</div>
                        <div className={`text-xs ${
                          parseFloat(market.change) >= 0 
                            ? "text-green-500" 
                            : "text-red-500"
                        }`}>
                          {parseFloat(market.change) >= 0 ? "+" : ""}{market.change}%
                        </div>
                      </div>
                    )}
                    
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
                          market.isFavorite
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
                    {loadingPrice ? (
                      <div className="flex items-center justify-center py-2">
                        <Card
                          className="w-full space-y-5 shadow-none"
                          radius="lg"
                        >
                          <Skeleton className="rounded-lg">
                            <div className="h-44 rounded-lg bg-default-300" />
                          </Skeleton>
                        </Card>
                      </div>
                    ) : selectedMarketData ? (
                      <>
                        <div className="flex items-center justify-center py-2"></div>
                        <MarketTradePanel
                          market={{
                            ...market,
                            ...selectedMarketData,
                          }}
                        />
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}