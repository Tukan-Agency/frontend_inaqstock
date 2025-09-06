import React, { useState, useEffect } from "react";
import { Spinner, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function NewsPanel({ symbol }) {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [expandedNews, setExpandedNews] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        // Llamada a la API de Polygon
        const response = await axios.get(
          `https://api.polygon.io/v2/reference/news?limit=10&order=desc&sort=published_utc&apiKey=MF98h8vorj239xqQzHGEgjZ4JefrmFOj`
        );

        if (response.data && response.data.results) {
          setNews(response.data.results);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setNews(mockNewsData); // Fallback a datos de ejemplo
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol]);

  const toggleNewsExpand = (id) => {
    setExpandedNews(expandedNews === id ? null : id);
  };

  const getTickerIcon = (tickers) => {
    if (!tickers || tickers.length === 0) return "cryptocurrency:generic";

    // Asignar iconos según el ticker
    const ticker = tickers[0];
    if (ticker.includes("BTC")) return "cryptocurrency:btc";
    if (ticker.includes("ETH")) return "cryptocurrency:eth";
    if (ticker.includes("UBS")) return "simple-icons:ubs";

    return "material-symbols:tag";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Spinner color="primary" size="lg" />
        <p className="mt-4 text-gray-500">Cargando noticias...</p>
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto">
      {news.length > 0 ? (
        news.map((item, index) => (
          <div
            key={item.id || index}
            className="border-b border-gray-200 last:border-none"
          >
            <div
              className={`px-4 py-3 cursor-pointer transition-colors ${
                expandedNews === (item.id || index)
                  ? "bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => toggleNewsExpand(item.id || index)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Icon
                    icon={getTickerIcon(item.tickers)}
                    className="text-[#00689b]"
                    width={20}
                    height={20}
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="text-sm font-medium line-clamp-2 text-gray-800">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(item.published_utc).toLocaleString("es-ES", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {item.publisher?.name || "News"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {expandedNews === (item.id || index) && (
              <div className="px-4 py-3 bg-gray-50">
                <p className="text-sm text-gray-700 mb-3">{item.description}</p>
                {item.keywords && item.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-3">
                  <a
                    href={item.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#00689b] hover:underline flex items-center gap-1"
                  >
                    Leer artículo completo
                    <Icon icon="material-symbols:open-in-new" width={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center p-8">
          <Icon icon="carbon:no-content" width={40} className="text-gray-400" />
          <p className="mt-4 text-gray-500">No hay noticias disponibles</p>
        </div>
      )}
    </div>
  );
}

// Datos de ejemplo en caso de que falle la API
const mockNewsData = [
  {
    id: "news-1",
    title: "El Bitcoin supera los $60,000 por primera vez en dos años",
    description:
      "La principal criptomoneda ha alcanzado un nuevo máximo desde noviembre de 2021, impulsada por la aprobación de los ETFs de Bitcoin y el interés institucional.",
    published_utc: new Date().toISOString(),
    publisher: { name: "Crypto News" },
    tickers: ["BTC"],
    keywords: ["Bitcoin", "ETF", "Institucional"],
  },
  {
    id: "news-2",
    title: "La Fed mantiene las tasas de interés pero señala posibles recortes",
    description:
      "La Reserva Federal de EE.UU. ha decidido mantener las tasas de interés sin cambios en su reunión de septiembre, pero ha señalado la posibilidad de recortes en los próximos meses.",
    published_utc: new Date(Date.now() - 3600000).toISOString(),
    publisher: { name: "Financial Times" },
    tickers: ["UBS"],
    keywords: ["Fed", "Tasas de interés", "Política monetaria"],
  },
  {
    id: "news-3",
    title: "Ethereum completa con éxito su actualización 'Dencun'",
    description:
      "La red Ethereum ha completado con éxito su última actualización importante, que promete reducir los costos de gas y mejorar la escalabilidad de la red.",
    published_utc: new Date(Date.now() - 7200000).toISOString(),
    publisher: { name: "Ethereum World" },
    tickers: ["ETH"],
    keywords: ["Ethereum", "Dencun", "Gas", "Escalabilidad"],
  },
];