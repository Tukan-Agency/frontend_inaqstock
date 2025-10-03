import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { useNavigate, useResolvedPath, useLocation } from "react-router-dom";

const items = [
  { to: "ordenes", label: "Lista de órdenes", icon: "solar:document-bold" },
  { to: "movimientos", label: "Movimientos", icon: "mingcute:transfer-fill" },
  { to: "deposito", label: "Depósito", icon: "solar:card-bold-duotone" },
  { to: "retiro", label: "Retiro", icon: "solar:dollar-bold" },
  { to: "cuenta", label: "Cuenta", icon: "solar:user-bold" },
];

// Botón del sidebar que navega con useNavigate y calcula "activo" sin NavLink
function SidebarNavItem({
  to,
  label,
  icon,
  activeColor = "#00689B",
  end = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const resolved = useResolvedPath(to); // resuelve relativo al layout, ej: "cuenta" => "/explorar/cuenta"

  // Considera activo cuando:
  // - end=true: coincide exactamente, o si es "cuenta" y estamos en el index "/explorar"
  // - end=false: el path actual empieza con el path resuelto
  const basePath = resolved.pathname.replace(/\/[^/]+$/, ""); // padre, ej: "/explorar"
  const isIndex =
    location.pathname === basePath || location.pathname === `${basePath}/`;
  const isActive = end
    ? location.pathname === resolved.pathname || (to === "ordenes" && isIndex)
    : location.pathname.startsWith(resolved.pathname);

  const handlePress = () => {
    // Navega al path resuelto sin recargar la página
    navigate(resolved.pathname);
  };

  return (
    <Button
      variant="light"
      radius="lg"
      onPress={handlePress}
      className={[
        "w-full justify-start gap-3 rounded-xl border transition-all select-none",
        isActive
          ? [
              "shadow-sm",
              "text-[#00689B]",
              "bg-[rgba(0,104,155,0.10)] dark:bg-[rgba(0,104,155,0.20)]",
              "border-[rgba(0,104,155,0.20)] dark:border-[rgba(0,104,155,0.30)]",
            ].join(" ")
          : [
              "bg-transparent border-transparent",
              "hover:bg-white/60 dark:hover:bg-white/5",
              "hover:border-black/5 dark:hover:border-white/10",
            ].join(" "),
      ].join(" ")}
      startContent={
        <Icon
          icon={icon}
          width={22}
          color={isActive ? activeColor : "#9CA3AF"}
        />
      }
      style={isActive ? { color: activeColor } : undefined}
    >
      {label}
    </Button>
  );
}

export default function ExplorarSidebar() {
  return (
    <nav className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl p-3 border border-black/10  ">
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.to}>
            <SidebarNavItem
              to={it.to}
              label={it.label}
              icon={it.icon}
              activeColor="#00689B"
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
