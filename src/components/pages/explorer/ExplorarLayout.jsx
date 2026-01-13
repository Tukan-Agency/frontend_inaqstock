import { Outlet } from "react-router-dom";
import { useSession } from "../../../hooks/use-session.jsx";
import { useNavigate } from "react-router-dom";
import Nav from "../../navbar.jsx";
import ExplorarSidebar from "./ExplorarSidebar.jsx";
 

export default function ExplorarLayout() {
  const { session } = useSession();
 
  const navigate = useNavigate();

  if (session.status === "unauthenticated") {
    navigate("/");
    return null;
  }

  return (
    <div className="text-foreground bg-background min-h-screen">
      <div className="flex flex-col gap-4 p-5">
        <Nav />
        
        <div className="flex flex-row gap-6 pt-5 min-h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <ExplorarSidebar />
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