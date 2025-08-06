import { useState, useEffect } from "react";
import { Card, CardBody, Input, Tabs, Tab, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import MarketTradePanel from "./MarketTradePanel";
import { polygonService } from "../services/polygonService";

export default function MarketList() {
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState("favorites");
  const [expandedMarket, setExpandedMarket] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMarketData, setSelectedMarketData] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Cargar lista de mercados
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        setLoading(true);
        const data = await polygonService.getAllMarkets((progress) => {
          setLoadingProgress({
            current: progress.currentCount,
            total: progress.totalSoFar
          });
        });
        
        const formattedMarkets = data.results.map(market => ({
          symbol: market.ticker,
          name: market.name,
          type: market.type,
          market: market.market,
          exchange: market.primary_exchange,
          isFavorite: favorites.includes(market.ticker)
        }));

        setMarkets(formattedMarkets);
        setError(null);
      } catch (err) {
        setError("Error loading markets");
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
            change: ((priceData.results[0].c - priceData.results[0].o) / priceData.results[0].o * 100).toFixed(2)
          });
        }
      } catch (err) {
        console.error(`Error loading price for ${expandedMarket}:`, err);
        setSelectedMarketData(null);
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
    setFavorites(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  const handleMarketClick = (symbol) => {
    setExpandedMarket(expandedMarket === symbol ? null : symbol);
  };

  const filteredMarkets = markets.filter(market => 
    market.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
    market.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const displayedMarkets = selectedTab === "favorites" 
    ? filteredMarkets.filter(m => m.isFavorite)
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
            <div className="flex flex-col items-center justify-center h-full">
              <span>Loading markets...</span>
              {loadingProgress.total > 0 && (
                <div className="mt-2 text-sm text-default-500">
                  Loaded {loadingProgress.current} markets so far...
                </div>
              )}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-danger">
              <span>{error}</span>
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
                      <div className="text-xs text-default-500">{market.name}</div>
                      <div className="text-xs text-default-400">
                        {market.market} • {market.exchange}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
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
                        icon={market.isFavorite ? "material-symbols:star" : "material-symbols:star-outline"} 
                        width="20"
                        height="20"
                      />
                    </Button>
                  </div>
                </div>

                {expandedMarket === market.symbol && (
                  <div className="p-4 bg-default-50">
                    {loadingPrice ? (
                      <div className="text-center py-2">
                        Loading market data...
                      </div>
                    ) : selectedMarketData ? (
                      <MarketTradePanel 
                        market={{
                          ...market,
                          ...selectedMarketData
                        }} 
                      />
                    ) : (
                      <div className="text-center py-2 text-danger">
                        Error loading market data
                      </div>
                    )}
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