import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { useNavigate, useResolvedPath, useLocation } from "react-router-dom";

const items = [
  { to: "dashboard", label: "Dashboard", icon: "mdi:view-dashboard" },
  { to: "usuarios", label: "Usuarios", icon: "mdi:account-group" },
  { to: "solicitudes", label: "Solicitudes", icon: "mdi:clipboard-text" },
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
  const resolved = useResolvedPath(to); // ej: "usuarios" => "/panel/usuarios"

  // Considera activo cuando:
  // - end=true: coincide exactamente, o si es "dashboard" y estamos en el index de /panel
  // - end=false: el path actual empieza con el path resuelto
  const basePath = resolved.pathname.replace(/\/[^/]+$/, ""); // padre, ej: "/panel"
  const isIndex =
    location.pathname === basePath || location.pathname === `${basePath}/`;
  const isActive = end
    ? location.pathname === resolved.pathname || (to === "dashboard" && isIndex)
    : location.pathname.startsWith(resolved.pathname);

  const handlePress = () => navigate(resolved.pathname);

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

export default function PanelSidebar() {
  return (
    <nav className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl p-3 border border-black/10">
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