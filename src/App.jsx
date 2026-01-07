import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./components/Home.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Operar from "./components/pages/Operar.jsx";
import Register from "./components/Register.jsx";
import Verify from "./components/verify.jsx";
import NotFound from "./components/not-found.jsx";
import Analitica from "./components/pages/Analitica.jsx";
import GraficaStock from "./components/pages/GraficaStock.jsx";
// Explorar
import ExplorarLayout from "../src/components/pages/explorer/ExplorarLayout.jsx";
import Cuenta from "../src/components/pages/explorer/sections/Cuenta.jsx";
import ListaOrdenes from "../src/components/pages/explorer/sections/ListaOrdenes.jsx";
import Movimientos from "../src/components/pages/explorer/sections/Movimientos.jsx";
import Deposito from "../src/components/pages/explorer/sections/Deposito.jsx";
import Retiro from "../src/components/pages/explorer/sections/Retiro.jsx";
import Verificar from "./components/pages/explorer/sections/Verificar.jsx";

// Panel admin
import PanelLayout from "../src/components/pages/panel/PaneILayout.jsx";
import AdminDashboard from "../src/components/pages/panel/sections/Dashboard.jsx";
import AdminUsuarios from "../src/components/pages/panel/sections/Usuarios.jsx";
import AdminSolicitudes from "../src/components/pages/panel/sections/Solicitudes.jsx";
import PanelUserOrders from "../src/components/pages/panel/sections/PanelUserOrders.jsx";
import SolicitudesVerify from "./components/pages/panel/sections/SolicitudesVerify.jsx";
import ForgotPassword from "./components/pages/ForgotPassword.jsx";
import ResetPassword from "./components/pages/ResetPassword.jsx";
import Settings from "./components/pages/Settings.jsx"; // ✅ Importación de Ajustes

function App() {
  return (
    <>
      <Routes>
        <Route path={"/"} element={<Home />} />
        <Route path={"/operar"} element={<Operar />} />

        {/* Rutas anidadas: Explorar */}
        <Route path={"/explorar"} element={<ExplorarLayout />}>
          <Route index element={<ListaOrdenes />} />
          <Route path="cuenta" element={<Cuenta />} />
          <Route path="ordenes" element={<ListaOrdenes />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="deposito" element={<Deposito />} />
          <Route path="retiro" element={<Retiro />} />
          <Route path="verificacion" element={<Verificar />} />
        </Route>

        {/* Rutas anidadas: Panel admin */}
        <Route path={"/panel"} element={<PanelLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route
            path="usuarios/:userId/ordenes"
            element={<PanelUserOrders />}
          />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="solicitudes" element={<AdminSolicitudes />} />
          <Route path="solicitudes-verify" element={<SolicitudesVerify />} />

          {/* ✅ Nueva Ruta Ajustes */}
          <Route path="ajustes" element={<Settings />} />

          <Route
            path="dasboard"
            element={<Navigate to="dashboard" replace />}
          />
        </Route>

        <Route path={"/analitica"} element={<Analitica />} />
        <Route path={"/graficastock"} element={<GraficaStock />} />
        <Route path={"/dashboard"} element={<Dashboard />} />
        <Route path={"/register"} element={<Register />} />
        <Route path={"/verify"} element={<Verify />} />
        <Route path={"*"} element={<NotFound />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
}

export default App;
