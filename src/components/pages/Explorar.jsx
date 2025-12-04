import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";
import { useEffect } from "react";

export default function Explorar() {
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.status === "unauthenticated") navigate("/", { replace: true });
  }, [session.status, navigate]);
  if (session.status === "unauthenticated") return null;

  return (
    <div className="text-foreground bg-background min-h-screen">
      <div className="flex flex-col gap-4 p-5">
        <Nav />

        {/* Layout responsive: 1col en móvil, 2col en desktop */}
        <div className="pt-5 grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4">
          {/* Columna izquierda con dos tarjetas apiladas */}
          <div className="flex flex-col gap-4">
            <Card className="border border-solid border-[#00689b9e]">
              <CardBody>
                <p></p>
              </CardBody>
            </Card>
            <Card className="border border-solid border-[#00689b9e]">
              <CardBody>
                <p></p>
              </CardBody>
            </Card>
          </div>

          {/* Columna derecha */}
          <div>
            <Card className="border border-solid border-[#00689b9e]">
              <CardBody>
                <p></p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}