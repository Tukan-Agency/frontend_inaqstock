import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
  User,
} from "@heroui/react";
import { Icon } from "@iconify-icon/react";
import useDarkMode from "use-dark-mode";
import { useSession } from "../../hooks/use-session";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

export const PlusIcon = (props) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      >
        <path d="M6 12h12" />
        <path d="M12 18V6" />
      </g>
    </svg>
  );
};

export default function UserDropdown() {
  const classtext = "text-default-700";
  const darkMode = useDarkMode(false, {
    classNameDark: "dark",
    classNameLight: "light",
    global: window,
  });
  const { session, clearSession } = useSession();
  const navigate = useNavigate();

  async function handleLogout() {
    const res = await axios.delete(
      import.meta.env.VITE_API_URL + "/api/auth/logout",
      { withCredentials: true }
    );
    if (res.status === 200) {
      clearSession();
      navigate("/");
    }
  }

  function handleMenuAction(key) {
    switch (String(key)) {
      case "settings":
        navigate("/explorar/cuenta");
        break;
      case "dashboard":
        navigate("/explorar/retiro");
        break;
      case "new_project":
        navigate("/explorar/deposito");
        break;
      case "quick_search":
        navigate("/explorar/movimientos");
        break;
      case "quick_orders":
        navigate("/explorar/ordenes");
        break;
      default:
        break;
    }
  }

  const getInitialTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) return "Oscuro";
    if (html.classList.contains("light")) return "Claro";
    return "System";
  };
  const [themeSelection, setThemeSelection] = useState(getInitialTheme());

  const applyTheme = (theme) => {
    const html = document.documentElement;
    if (theme === "Oscuro") {
      darkMode.enable();
      html.classList.add("dark");
      html.classList.remove("light");
    } else if (theme === "Claro") {
      darkMode.disable();
      html.classList.add("light");
      html.classList.remove("dark");
    } else {
      // System
      darkMode.toggle(); // fuerza un cambio; usamos clases manualmente después
      html.classList.remove("dark");
      html.classList.remove("light");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.add(prefersDark ? "dark" : "light");
    }
    setThemeSelection(theme);
  };

  // Detecta rol admin: role === 1 (acepta string "1" por si viene desde API como string)
  const role = session?.user?.role ?? session?.user?.user?.role;
  const isAdmin = Number(role) === 1;

  const goToAdminPanel = () => navigate("/panel");

  return (
    <Dropdown
      showArrow
      classNames={{
        base: "before:bg-default-200",
        content: "p-0 border-small border-divider bg-background",
      }}
      radius="sm"
    >
      <DropdownTrigger>
        <Button isIconOnly aria-label="Abrir menú de usuario" color="default">
          <Icon icon="solar:user-bold" width="24" height="24" />
        </Button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Menú de usuario"
        className="p-3"
        // FIX: no deshabilites "theme", así el <select> recibe eventos
        disabledKeys={["profile"]}
        onAction={handleMenuAction}
        closeOnSelect={false}
        itemClasses={{
          base: [
            "rounded-md",
            "text-default-500",
            "transition-opacity",
            "data-[hover=true]:text-foreground",
            "data-[hover=true]:bg-default-100",
            "dark:data-[hover=true]:bg-default-50",
            "data-[selectable=true]:focus:bg-default-50",
            "data-[pressed=true]:opacity-70",
            "data-[focus-visible=true]:ring-default-500",
          ],
        }}
      >
        <DropdownSection showDivider aria-label="Perfil y acciones">
          <DropdownItem key="profile" isReadOnly className="h-14 gap-2 opacity-100">
            <User
              classNames={{
                name: "text-default-700",
                description: "text-default-700",
              }}
              name={session?.user?.name || "Usuario"}
              description={session?.user?.email || "User"}
            />
          </DropdownItem>

          <DropdownItem className={classtext} key="settings">
            Configuración
          </DropdownItem>
          <DropdownItem className={classtext} key="dashboard">
            Retirar
          </DropdownItem>
          <DropdownItem
            className={classtext}
            key="new_project"
            endContent={<PlusIcon className="text-large" />}
          >
            Depósito
          </DropdownItem>
        </DropdownSection>

        <DropdownSection showDivider aria-label="Preferencias">
          <DropdownItem key="quick_search" className={classtext}>
            Movimientos
          </DropdownItem>
          <DropdownItem key="quick_orders" className={classtext}>
            Ordenes
          </DropdownItem>

          <DropdownItem
            key="theme"
            // isReadOnly evita que el item cierre el menú o sea "seleccionable",
            // pero permite interactuar con el contenido interno (el select).
            isReadOnly
            className="cursor-default"
            endContent={
              <select
                className="z-10 outline-none w-20 py-0.5 rounded-md text-tiny group-data-[hover=true]:border-default-500 border-small border-default-300 dark:border-default-200 bg-transparent text-default-500"
                value={themeSelection}
                onChange={(e) => applyTheme(e.target.value)}
              >
                <option>System</option>
                <option>Oscuro</option>
                <option>Claro</option>
              </select>
            }
          >
            <p className={classtext}>Tema</p>
          </DropdownItem>
        </DropdownSection>

        <DropdownSection aria-label="Sesión">
          {isAdmin && (
            <DropdownItem key="admin-panel" color="primary" isReadOnly>
              <Button
                onClick={goToAdminPanel}
                className="w-full"
                size="sm"
                color="primary"
                variant="bordered"
              >
                Panel admin
              </Button>
            </DropdownItem>
          )}

          <DropdownItem key="logout" color="danger" isReadOnly>
            <Button
              onClick={handleLogout}
              className="w-full"
              size="sm"
              color="danger"
              variant="bordered"
            >
              Cerrar sesión
            </Button>
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}