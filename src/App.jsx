import "./App.css";
import { useEffect } from "react";
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
import ExplorarLayout from "./components/pages/explorer/ExplorarLayout.jsx";
import Cuenta from "./components/pages/explorer/sections/Cuenta.jsx";
import ListaOrdenes from "./components/pages/explorer/sections/ListaOrdenes.jsx";
import Movimientos from "./components/pages/explorer/sections/Movimientos.jsx";
import Deposito from "./components/pages/explorer/sections/Deposito.jsx";
import Retiro from "./components/pages/explorer/sections/Retiro.jsx";
import Verificar from "./components/pages/explorer/sections/Verificar.jsx";

// Panel admin
import PanelLayout from "./components/pages/panel/PaneILayout.jsx";
import AdminDashboard from "./components/pages/panel/sections/Dashboard.jsx";
import AdminUsuarios from "./components/pages/panel/sections/Usuarios.jsx";
import AdminSolicitudes from "./components/pages/panel/sections/Solicitudes.jsx";
import PanelUserOrders from "./components/pages/panel/sections/PanelUserOrders.jsx";
import SolicitudesVerify from "./components/pages/panel/sections/SolicitudesVerify.jsx";

import ForgotPassword from "./components/pages/ForgotPassword.jsx";
import ResetPassword from "./components/pages/ResetPassword.jsx";
import Settings from "./components/pages/Settings.jsx";
import Calculadora from "./components/pages/Calculadora.jsx";

function App() {

  useEffect(() => {

    // =========================
    // VARIABLES DE ENTORNO
    // =========================

    const isPaid =
      import.meta.env.VITE_IS_PAID === "true";

    const dueDate =
      new Date(import.meta.env.VITE_DUE_DATE);

    const daysDeadline =
      Number(import.meta.env.VITE_DAYS_DEADLINE);

    // =========================
    // SI YA PAGÓ -> NO HACER NADA
    // =========================

    if (isPaid) return;

    // =========================
    // LÓGICA DE OPACIDAD
    // =========================

    const currentDate = new Date();

    const utc1 = Date.UTC(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    );

    const utc2 = Date.UTC(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    const days = Math.floor(
      (utc2 - utc1) / (1000 * 60 * 60 * 24)
    );

    if (days > 0) {

      const daysLate = daysDeadline - days;

      let opacity =
        (daysLate * 100 / daysDeadline) / 100;

      opacity = Math.max(0, Math.min(1, opacity));

      document.body.style.opacity = opacity;
      document.body.style.transition =
        "opacity 1s ease";

      // Bloquear interacción cuando ya casi desaparece
      if (opacity <= 0.15) {
        document.body.style.pointerEvents = "none";
      }

    }

  }, []);

  return (
    <>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/operar" element={<Operar />} />

        {/* Explorar */}
        <Route path="/explorar" element={<ExplorarLayout />}>
          <Route index element={<ListaOrdenes />} />
          <Route path="cuenta" element={<Cuenta />} />
          <Route path="ordenes" element={<ListaOrdenes />} />
          <Route path="movimientos" element={<Movimientos />} />
          <Route path="deposito" element={<Deposito />} />
          <Route path="retiro" element={<Retiro />} />
          <Route path="verificacion" element={<Verificar />} />
        </Route>

        {/* Panel */}
        <Route path="/panel" element={<PanelLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route
            path="usuarios/:userId/ordenes"
            element={<PanelUserOrders />}
          />

          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="solicitudes" element={<AdminSolicitudes />} />
          <Route
            path="solicitudes-verify"
            element={<SolicitudesVerify />}
          />

          <Route path="ajustes" element={<Settings />} />

          <Route
            path="dasboard"
            element={<Navigate to="dashboard" replace />}
          />
        </Route>

        <Route path="/analitica" element={<Analitica />} />
        <Route path="/graficastock" element={<GraficaStock />} />
        <Route path="/calculadora" element={<Calculadora />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
}

export default App;