/* eslint-disable react/prop-types */
import { Icon } from "@iconify/react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";

import { useAccountMode } from "../context/AccountModeContext.jsx";

const MODES = {
  real: {
    label: "Cuenta real",
    description: "Opera con tu capital",
    icon: "material-symbols:account-balance-wallet",
  },
  demo: {
    label: "Cuenta demo",
    description: "Practica sin riesgo",
    icon: "material-symbols:science-outline",
  },
};

export default function AccountModeSelector({ compact = false }) {
  const { mode, setMode } = useAccountMode();
  const selected = MODES[mode] || MODES.real;

  return (
    <Dropdown placement="bottom-start">
      <DropdownTrigger>
        <Button
          aria-label="Cambiar tipo de cuenta"
          className={`${compact ? "min-w-[122px]" : "min-w-[150px]"} h-10 justify-between border border-white/10 bg-[#111727] px-3 text-white shadow-lg shadow-[#111727]/20`}
          endContent={<Icon icon="solar:alt-arrow-down-linear" width={16} />}
          startContent={
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <Icon icon={selected.icon} width={17} />
              <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111727] ${mode === "demo" ? "bg-[#18A777]" : "bg-white"}`} />
            </span>
          }
        >
          <span className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-medium text-white/60">Modo de cuenta</span>
            <span className="mt-1 text-xs font-semibold">{mode === "demo" ? "Demo" : "Real"}</span>
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Seleccionar tipo de cuenta"
        selectionMode="single"
        selectedKeys={[mode]}
        onAction={(key) => setMode(String(key))}
        className="min-w-[250px]"
      >
        {Object.entries(MODES).map(([key, option]) => (
          <DropdownItem
            key={key}
            description={option.description}
            startContent={
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode === key ? "bg-[#18A777] text-white" : "bg-default-100 text-foreground"}`}>
                <Icon icon={option.icon} width={20} />
              </span>
            }
            endContent={mode === key ? <Icon icon="material-symbols:check-circle-rounded" className="text-[#18A777]" width={20} /> : null}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
