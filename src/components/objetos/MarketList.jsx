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

export default function MarketList({ onSelect }) {
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState("favorites");
  const [expandedMarket, setExpandedMarket] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [topMovers, setTopMovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMarketData, setSelectedMarketData] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Cargar lista de mercados y top movers (una sola vez)
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setLoading(true);

        const data = await polygonService.getMarketsList();
        const formattedMarkets = (data.tickers || []).map((t) => ({
          symbol: t.ticker, // ej: "X:BTCUSD"
          name: t.ticker.replace(/^X:/, ""),
          type: "crypto",
          market: "crypto",
          exchange: "CRYPTO",
        }));

        const popularCrypto = await polygonService.getPopularCrypto();
        const formattedTopMovers = (popularCrypto || []).map((t) => ({
          symbol: t.ticker,
          name: t.ticker.replace(/^X:/, ""),
          type: "crypto",
          market: "crypto",
          exchange: "CRYPTO",
          price: t.day?.c?.toFixed(2) || "N/A",
          change:
            t.day?.c && t.day?.o
              ? (((t.day.c - t.day.o) / t.day.o) * 100).toFixed(2)
              : "0.00",
          volume: t.day?.v || 0,
        }));

        setMarkets(formattedMarkets);
        setTopMovers(formattedTopMovers);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Error cargando mercados");
      } finally {
        setLoading(false);
      }
    };

    loadMarkets();
  }, []);

  // Persistir favoritos
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Toasts de error
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

  // Merge único por símbolo para que la pestaña Favorites considere tanto markets como topMovers
  const allMarkets = useMemo(() => {
    const map = new Map();
    for (const m of markets) map.set(m.symbol, m);
    for (const m of topMovers) {
      if (!map.has(m.symbol)) map.set(m.symbol, m);
      else map.set(m.symbol, { ...map.get(m.symbol), ...m }); // combinar info (por si topMovers trae price)
    }
    return Array.from(map.values());
  }, [markets, topMovers]);

  // Cargar precio al expandir
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

  const toggleFavorite = (symbol) => {
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const handleMarketClick = (symbol) => {
    setExpandedMarket(expandedMarket === symbol ? null : symbol);
    if (onSelect) onSelect(symbol);
  };

  // Conjunto para cálculo inmediato de favoritos (sin depender de isFavorite en los objetos)
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Fuente base según pestaña (Favorites usa el merge allMarkets)
  const baseList =
    selectedTab === "topmovers" ? topMovers : selectedTab === "favorites" ? allMarkets : markets;

  // Enriquecer con flag de favorito para UI
  const enriched = useMemo(
    () => baseList.map((m) => ({ ...m, isFavorite: favoritesSet.has(m.symbol) })),
    [baseList, favoritesSet]
  );

  // Filtros
  const filtered = enriched.filter(
    (m) =>
      m.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
      (m.name || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const displayedMarkets =
    selectedTab === "favorites" ? filtered.filter((m) => m.isFavorite) : filtered;

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
            displayedMarkets.map((market) => {
              const isFav = market.isFavorite;
              const showPrice = selectedTab === "topmovers" && market.price;

              return (
                <div key={market.symbol}>
                  <div
                    className="flex items-center justify-between p-3 hover:bg-default-100 cursor-pointer border-b border-[#00689b9e]"
                    onClick={() => handleMarketClick(market.symbol)}
                  >
                    <div>
                      <div className="font-medium">{market.symbol}</div>
                      <div className="text-xs text-default-500">
                        {market.name}
                      </div>
                      <div className="text-xs text-default-400">
                        {market.market} • {market.exchange}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {showPrice && (
                        <div className="text-right text-sm">
                          <div className="font-medium">${market.price}</div>
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
                        <MarketTradePanel
                          market={{
                            ...market,
                            ...selectedMarketData,
                          }}
                        />
                      ) : null}
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
