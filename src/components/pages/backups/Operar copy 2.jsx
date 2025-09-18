import { useSession } from "../../../hooks/use-session.jsx";
import Nav from "../../navbar.jsx";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";
import CandlestickChart from "../../objetos/CandlestickChart.jsx";
import { useApi } from "../../services/useApiData.js";
import MarketList from "../../objetos/MarketList.jsx";

export default function Operar() {
  const { session } = useSession();
  const navigate = useNavigate();

  const url =
    "https://api.polygon.io/v2/aggs/ticker/X:BTCUSD/range/1/day/2025-06-01/2025-06-30?apiKey=7ZDpKAA_vz3jIGp2T2POBDyYR_1RJ5xn";

  const { data, loading, error, refetch } = useApi(url);

  // Procesar datos de Polygon
  const ohlcData = data?.results
    ? [...data.results].sort((a, b) => a.t - b.t)
    : [];

  // 🔁 Redirige si no hay sesión activa
  if (session.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  return (
    <div className="text-foreground bg-background h-[100vh]">
      <div className="flex flex-col gap-4 p-5">
        <Nav />
        <div className="pt-5 flex flex-col gap-6">
          {/* Primera fila de tarjetas */}
          <div className="flex flex-row gap-4">
            <div className="flex-[1]">
              <div className="flex-[1]">
                <MarketList
                  onSelect={(symbol) => {
                    const newUrl = `https://api.polygon.io/v2/aggs/ticker/X:${symbol}/range/1/day/2025-06-01/2025-06-30?apiKey=...`;
                    refetch(newUrl);
                  }}
                />
              </div>
            </div>

            <div className="flex-[3]">
              <Card className="border border-solid border-[#00689b9e] h-[460px] p-3">
                <CardBody className="w-full h-full p-0 overflow-hidden">
                  {error ? (
                    <div className="w-full h-full flex items-center justify-center text-red-500">
                      <p>{error}</p>
                    </div>
                  ) : (
                    <CandlestickChart
                      data={ohlcData}
                      loading={loading}
                      title="Bitcoin/USD – Junio 2025"
                      height={460}
                      showToolbar={false}
                    />
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Segunda fila de tarjetas */}
          <div className="flex flex-row gap-4">
            <div className="flex-[1]">
              <Card className="min-h-[350px] border border-solid border-[#00689b9e]">
                <CardBody></CardBody>
              </Card>
            </div>

            <div className="flex-[3]">
              <Card className="min-h-[350px] border border-solid border-[#00689b9e]">
                <CardBody>
                  <p></p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
