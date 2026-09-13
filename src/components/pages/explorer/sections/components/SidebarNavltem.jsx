import SidebarNavItem from "./SidebarNavItem.jsx"; // o pega el componente arriba y elimina esta línea

const items = [
  { to: "cuenta", label: "Cuenta", icon: "solar:user-bold" },
  { to: "ordenes", label: "Lista de órdenes", icon: "solar:document-bold" },
  { to: "movimientos", label: "Movimientos", icon: "mingcute:transfer-fill" },
  { to: "deposito", label: "Depósito", icon: "solar:card-bold-duotone" },
  { to: "retiro", label: "Retiro", icon: "solar:dollar-bold" },
];

export default function ExplorarSidebar() {
  return (
    <nav className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl p-3 border border-black/10 dark:border-white/10">
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