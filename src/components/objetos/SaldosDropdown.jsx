import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Tooltip,
} from "@heroui/react";
import { Checkbox } from "@heroui/checkbox";
import { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import axios from "axios";

// ✅ RUTAS EXACTAS SOLICITADAS
import { useBalance } from "../../context/BalanceContext.jsx";
import { useAccountMode } from "../../context/AccountModeContext";
import DemoFundingModal from "../DemoFundingModal.jsx";

export default function SaldosDropdown() {
  const LOCAL_KEY = "saldosSeleccionados";
  // refresh sigue funcionando manualmente si se requiere, pero balances ahora llega por socket
  const { balances, loading, error, refresh } = useBalance();
  const { mode } = useAccountMode();

  const [selected, setSelected] = useState(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored
      ? JSON.parse(stored)
      : ["balance", "capital", "ganancias", "margen"];
  });

  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(selected));
  }, [selected]);

  const fmt = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "$0.00";
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const currentData =
    mode === "demo" ? balances?.demo || {} : balances?.real || {};

  const valores = {
    margen: fmt(currentData.margen),
    capital: fmt(currentData.capital),
    balance: fmt(currentData.balance),
    ganancias: fmt(currentData.ganancias),
    capitalLibre: fmt(currentData.capitalLibre),
  };

  const etiquetas = {
    margen: "Margen",
    capital: "Capital",
    balance: "Balance",
    ganancias: "Ganancias",
    capitalLibre: "Cap. Libre",
  };

  const toggleSeleccion = (valor) => {
    setSelected((prev) =>
      prev.includes(valor)
        ? prev.filter((item) => item !== valor)
        : [...prev, valor]
    );
  };

  // Lógica para borrar cuenta demo
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/demo/reset`, {
        withCredentials: true,
      });
      // El socket debería actualizar el saldo automáticamente, pero dejamos el refresh manual por seguridad
      await refresh(); 
      window.dispatchEvent(new Event("open-demo-funding"));
    } catch (e) {
      console.error("Error reseteando demo", e);
    } finally {
      setIsResetting(false);
    }
  };

  // Diseño estilo imagen: Título negrita arriba, valor gris abajo
  const mostrarValor = (clave) =>
    selected.includes(clave) && (
      <div className="flex flex-col items-start mr-8 last:mr-0" key={clave}>
        <span className="text-xs font-bold leading-tight">
          <h5>{etiquetas[clave]}</h5>
        </span>
        <span
          className={`text-xs font-normal text-slate-500 ${
            loading ? "opacity-50" : ""
          }`}
        >
          {loading ? "..." : valores[clave]}
        </span>
      </div>
    );

  if (error) {
    return (
      <div className="flex items-center gap-2 p-2 text-red-500 text-xs">
        Error cargando saldos
      </div>
    );
  }

  return (
    <>
      <DemoFundingModal />

      <div className="flex items-center justify-between w-full p-1">
        {/* Scroll horizontal limpio, sin bordes verticales entre items */}
        <div className="flex flex-row items-center overflow-x-auto scrollbar-hide py-1">
          {mostrarValor("margen")}
          {mostrarValor("capital")}
          {mostrarValor("balance")}
          {mostrarValor("ganancias")}
          {mostrarValor("capitalLibre")}
        </div>

        {/* Sección derecha: Botón Reset (solo demo) y Dropdown */}
        <div className="flex items-center gap-2 ml-4 border-l border-slate-200 pl-2">
          {mode === "demo" && (
            <Tooltip content="Reiniciar cuenta Demo">
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="light"
                onPress={handleResetDemo}
                isLoading={isResetting}
              >
                <Icon icon="material-symbols:restart-alt-rounded" width="22" />
              </Button>
            </Tooltip>
          )}

          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="light" isIconOnly disabled={loading}>
                <Icon
                  icon="mingcute:down-fill"
                  width="20"
                  className="text-slate-400"
                />
              </Button>
            </DropdownTrigger>

            <DropdownMenu closeOnSelect={false} aria-label="Saldos disponibles">
              {Object.keys(valores).map((key) => (
                <DropdownItem key={key} textValue={etiquetas[key]}>
                  <Checkbox
                    size="sm"
                    isSelected={selected.includes(key)}
                    onChange={() => toggleSeleccion(key)}
                  >
                    {etiquetas[key]}
                  </Checkbox>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </>
  );
}