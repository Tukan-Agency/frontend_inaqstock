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
import { useBalance } from "../../context/BalanceContext"; // 👈 IMPORTAR EL CONTEXT

export default function SaldosDropdown() {
  const LOCAL_KEY = "saldosSeleccionados";
  
  // 👈 USAR EL CONTEXT PARA OBTENER BALANCES
  const { balances, loading, error } = useBalance();

  // Estado inicial cargado desde localStorage (solo para las preferencias)
  const [selected, setSelected] = useState(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : ["balance"];
  });

  // Guardar cambios en localStorage cuando cambia `selected`
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(selected));
  }, [selected]);

  // 👈 VALORES DINÁMICOS DESDE EL BACKEND
  const valores = {
    balance: `$${balances.balance.toFixed(2)} `,
    capital: `$${balances.capital.toFixed(2)} `,
    ganancias: `$${balances.ganancias.toFixed(2)} `,
    margen: `$${balances.margen.toFixed(2)} `,
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
        <span className={loading ? "opacity-50" : " "}>
          {loading ? "Cargando..." : valores[clave]}
        </span>
      </div>
    );

  // 👈 MOSTRAR ERROR SI HAY PROBLEMAS
  if (error) {
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
          <Button size="sm" variant="flat" disabled={loading}>
            <Icon icon="mingcute:down-fill" width="24" height="24" />
          </Button>
        </DropdownTrigger>

        <DropdownMenu closeOnSelect={false} aria-label="Saldos disponibles">
          {Object.entries(valores).map(([key, value]) => (
            <DropdownItem key={key} className="py-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  size="sm"
                  className="text-white"
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