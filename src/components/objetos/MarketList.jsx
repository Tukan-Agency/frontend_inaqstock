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
import { getMarketOverview, searchCatalog } from "../services/marketCatalog";
import { useLivePrice } from "../../hooks/useLivePrice.js";
import { useMultiLivePrices } from "../../hooks/useMultiLivePrices.js";
import { formatMarketPrice } from "../../utils/marketPrice.js";

export default function MarketList({ onSelect, onInitialLoad }) {
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
  const {
    symbol: selectedPriceSymbol,
    price: selectedPrice,
    status: selectedPriceStatus,
  } = useLivePrice(expandedMarket);
  const cryptoSymbols = useMemo(
    () => markets.filter((market) => market.symbol.startsWith("X:")).map((market) => market.symbol),
    [markets]
  );
  const { prices: cryptoPrices } = useMultiLivePrices(cryptoSymbols);

  const formatInstrument = (instrument) => ({
    symbol: instrument.symbol,
    name: instrument.name,
    type: instrument.market,
    market: instrument.market,
    exchange: instrument.exchange || "",
    price: null,
    open: null,
    change: null,
    volume: 0,
  });

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

 
  // Cargar los mercados populares desde el catálogo o la caché.
  useEffect(() => {
    const loadPopularMarkets = async () => {
      try {
        setLoading(true);
        const todayKey = getTodayKey();
        const cacheData = localStorage.getItem("catalog-popular-v5");
        const cacheDate = localStorage.getItem("catalog-popular-date-v5");

        if (cacheData && cacheDate === todayKey) {
          const cachedMarkets = JSON.parse(cacheData);
          if (Array.isArray(cachedMarkets) && cachedMarkets.length > 0) {
            setMarkets(cachedMarkets);
            setLoading(false);
            return;
          }
        }

        const instruments = await searchCatalog();
        if (!instruments.length) throw new Error("El catálogo no devolvió mercados populares");

        const overview = await getMarketOverview(instruments.map((instrument) => instrument.symbol));
        const prices = new Map(overview.map((item) => [item.symbol, item]));
        const formattedMarkets = instruments.map((instrument) => ({
          ...formatInstrument(instrument),
          ...prices.get(instrument.symbol),
        }));
        setMarkets(formattedMarkets);
        localStorage.setItem("catalog-popular-v5", JSON.stringify(formattedMarkets));
        localStorage.setItem("catalog-popular-date-v5", todayKey);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Error cargando mercados populares.");
      } finally {
        setLoading(false);
        onInitialLoad?.();
      }
    };

    loadPopularMarkets();
  }, []);

  useEffect(() => {
    if (selectedPriceSymbol !== expandedMarket || !Number.isFinite(selectedPrice)) return;
    setMarkets((current) => current.map((market) => {
      if (market.symbol !== expandedMarket) return market;
      const change = market.open > 0 ? ((selectedPrice - market.open) / market.open) * 100 : market.change;
      return { ...market, price: selectedPrice, change };
    }));
  }, [expandedMarket, selectedPrice, selectedPriceSymbol]);

  useEffect(() => {
    if (!Object.keys(cryptoPrices).length) return;
    setMarkets((current) => current.map((market) => {
      const price = cryptoPrices[market.symbol];
      if (!Number.isFinite(price)) return market;
      const change = market.open > 0 ? ((price - market.open) / market.open) * 100 : market.change;
      return { ...market, price, change };
    }));
  }, [cryptoPrices]);

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

  const handleSearch = async () => {
    if (!searchText.trim()) {
      // Si está vacío, restaurar el cache
      const cached = localStorage.getItem("catalog-popular-v5");
      if (cached) setMarkets(JSON.parse(cached));
      return;
    }

    try {
      setLoading(true);
      const instruments = await searchCatalog(searchText);
      if (!instruments.length) addToast({ title: "Sin resultados", description: "No encontramos instrumentos para esa búsqueda.", color: "default" });

      const overview = await getMarketOverview(instruments.map((instrument) => instrument.symbol));
      const prices = new Map(overview.map((item) => [item.symbol, item]));
      const newMarkets = instruments.map((instrument) => ({
        ...formatInstrument(instrument),
        ...prices.get(instrument.symbol),
      }));
      setMarkets(newMarkets);
    } catch (err) {
      console.error(err);
      addToast({
        title: "Error en búsqueda",
        description: "No se pudo consultar el catálogo de instrumentos.",
        color: "danger",
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
    <Card className="h-[400px] max-h-full min-h-0 overflow-hidden border border-solid border-[#11172766] dark:border-[#18A77766] md:h-full">
      <CardBody className="flex h-full flex-col p-0">
        <div className="border-b border-[#11172766] p-2 dark:border-[#18A77766]">
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pr-10"
            />
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="secondary"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg"
              onClick={handleSearch}
              aria-label="Buscar"
            >
              <Icon icon="mdi:magnify" width="20" height="20" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
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
                    className="flex cursor-pointer items-center justify-between border-b border-[#11172766] p-3 hover:bg-default-100 dark:border-[#18A77766]"
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
                          {market.price == null ? "--" : formatMarketPrice(market.price, market.symbol)}
                        </div>
                        {market.change != null ? <div
                          className={`text-xs ${
                            parseFloat(market.change) >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {parseFloat(market.change) >= 0 ? "+" : ""}
                          {Number(market.change).toFixed(2)}%
                        </div> : (
                          <div className="text-xs text-default-400">
                            {expandedMarket === market.symbol && selectedPriceStatus !== "live" ? "Consultando..." : "Selecciona para cotizar"}
                          </div>
                        )}
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
