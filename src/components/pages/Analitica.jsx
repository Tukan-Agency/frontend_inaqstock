import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";

export default function Analitica() {
  const { session } = useSession();
  const navigate = useNavigate();

  if (session.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  return (
    <div className="text-foreground bg-background  h-[100vh]">
      <div className="flex flex-col gap-4 p-5">
        <Nav />
        <div className="pt-5 flex flex-row gap-4 h-[700px]">
          {/* Columna izquierda con dos tarjetas apiladas */}
          <div className="flex flex-col flex-[1] gap-4">
            <Card className="flex-1 min-h-[470px] border border-solid border-[#00689b9e]" >          
              <CardBody>
                <p></p>
              </CardBody>
            </Card>
            <Card className="flex-1 min-h-[350px] border border-solid border-[#00689b9e]">
              <CardBody>
                <p></p>
              </CardBody>
            </Card>
          </div>

          {/* Columna derecha con una tarjeta del mismo alto que ambas de la izquierda */}
          <div className="flex-[3]">
            <Card className="min-h-[840px] border border-solid border-[#00689b9e]">
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
