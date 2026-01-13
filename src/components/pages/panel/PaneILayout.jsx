import { Outlet } from "react-router-dom";
import { useSession } from "../../../hooks/use-session.jsx";
import { useNavigate } from "react-router-dom";
import Nav from "../../navbar.jsx";
import PanelSidebar from "./PanelSidebar.jsx";
 

export default function PanelLayout() {
  const { session } = useSession();
 
  const navigate = useNavigate();

  // Guard básico (mismo estilo que Explorar)
  if (session?.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  // Si quieres forzar solo admin, descomenta:
   const role = session?.user?.role || session?.user?.user?.role;
  if (role !== 1) {
    navigate("/explorar");
    return null;
  }

  return (
    <div className="text-foreground bg-background min-h-screen">
      <div className="flex flex-col gap-4 p-5">
        <Nav />

        <div className="flex flex-row gap-6 pt-5 min-h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <PanelSidebar />
          </div>

          {/* Contenido principal */}
          <div className="flex-1 bg-content1 rounded-lg border border-divider">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}