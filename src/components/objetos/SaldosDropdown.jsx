import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { Checkbox } from "@heroui/checkbox";
import { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { useBalance } from "../../context/BalanceContext";
import { useAccountMode } from "../../context/AccountModeContext";

export default function SaldosDropdown() {
  const LOCAL_KEY = "saldosSeleccionados";
  const { balances, loading, error } = useBalance();
  const { mode } = useAccountMode(); // <<---- modo DEMO / REAL

  const [selected, setSelected] = useState(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : ["balance"];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(selected));
  }, [selected]);

  // Valores ficticios para DEMO
  const demoValues = {
    balance: "$11999.00",
    capital: "$9499.00",
    ganancias: "$1,334,344.00",
    margen: "$21,000.00",
  };

  const valores =
    mode === "demo"
      ? demoValues
      : {
          balance: `$${balances.balance.toFixed(2)}`,
          capital: `$${balances.capital.toFixed(2)}`,
          ganancias: `$${balances.ganancias.toFixed(2)}`,
          margen: `$${balances.margen.toFixed(2)}`,
        };

  const toggleSeleccion = (valor) => {
    setSelected((prev) =>
      prev.includes(valor)
        ? prev.filter((item) => item !== valor)
        : [...prev, valor]
    );
  };

  const mostrarValor = (clave, label) =>
    selected.includes(clave) && (
      <div className="text-xs px-2" key={clave}>
        <strong>
          <h3>{label}</h3>
        </strong>
        <span
          className={`${
            loading && mode === "real" ? "opacity-50" : "text-default-600"
          }`}
        >
          {loading && mode === "real" ? "Cargando..." : valores[clave]}
        </span>
      </div>
    );

  if (error && mode === "real") {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md text-red-500">
        <span className="text-xs">Error cargando balances</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-md">
      <div className="flex gap-4">
        {mostrarValor("margen", "Margen")}
        {mostrarValor("capital", "Capital")}
        {mostrarValor("balance", "Balance")}
        {mostrarValor("ganancias", "Ganancias")}
      </div>

      <Dropdown>
        <DropdownTrigger>
          <Button size="sm" variant="flat" disabled={loading && mode === "real"}>
            <Icon icon="mingcute:down-fill" width="24" height="24" />
          </Button>
        </DropdownTrigger>

        <DropdownMenu closeOnSelect={false} aria-label="Saldos disponibles">
          {Object.entries(valores).map(([key]) => (
            <DropdownItem key={key} className="py-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  size="sm"
                  isSelected={selected.includes(key)}
                  onChange={() => toggleSeleccion(key)}
                >
                  {key
                    .replace("ganancias", "Ganancias")
                    .replace("margen", "Margen")
                    .replace("capital", "Capital")
                    .replace("balance", "Balance")}
                </Checkbox>
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
