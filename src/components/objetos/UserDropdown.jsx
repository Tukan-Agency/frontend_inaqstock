import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import useDarkMode from "use-dark-mode";
import { useSession } from "../../hooks/use-session";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

export const PlusIcon = (props) => (
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

export default function UserDropdown({ cuentaVerificada = false }) {
  const classtext = "text-default-700";
  const darkMode = useDarkMode(false, {
    classNameDark: "dark",
    classNameLight: "light",
    global: typeof window !== "undefined" ? window : undefined,
  });

  const { session, clearSession } = useSession();
  const navigate = useNavigate();

  // Persistencia de tema en localStorage
  const THEME_KEY = "app-theme-selection"; // "System" | "Oscuro" | "Claro"

  const getInitialTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "Oscuro" || saved === "Claro" || saved === "System") return saved;
    } catch {}
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
      // System: seguimos la preferencia del SO
      html.classList.remove("dark");
      html.classList.remove("light");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) html.classList.add("dark");
      else html.classList.add("light");
    }

    setThemeSelection(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  };

  // Si el usuario elige "System", escuchar cambios del SO
  useEffect(() => {
    if (themeSelection !== "System") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("System");
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeSelection]);

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

  const role = session?.user?.role ?? session?.user?.user?.role;
  const isAdmin = Number(role) === 1;
  const goToAdminPanel = () => navigate("/panel");

  const userName = useMemo(
    () => session?.user?.name || session?.user?.user?.name || "Usuario",
    [session]
  );
  const userEmail = useMemo(
    () => session?.user?.email || session?.user?.user?.email || "email@ejemplo.com",
    [session]
  );

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
        disabledKeys={["profile"]} // importante: NO incluir "theme" aquí
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
          <DropdownItem key="profile" isReadOnly className="h-16 gap-2 opacity-100">
            <div className="relative flex items-center gap-2">
              <div
                className="relative w-10 h-10 flex items-center justify-center rounded-full"
                style={{
                  border: cuentaVerificada ? "2px solid #16a34a" : "2px solid #ccc",
                }}
              >
                <Icon icon="solar:user-bold" width={22} height={22} color="#555" />
                {cuentaVerificada && (
                  <span
                    className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-[2px]"
                    style={{ border: "2px solid white" }}
                  >
                    <Icon icon="mdi:check-bold" width={9} height={9} />
                  </span>
                )}
              </div>

              <div className="flex flex-col leading-tight">
                <span className="text-default-700 font-medium">{userName}</span>
                <span className="text-default-500 text-sm">{userEmail}</span>
              </div>
            </div>
          </DropdownItem>

          <DropdownItem className={classtext} key="settings">
            Configuración
          </DropdownItem>
          <DropdownItem className={classtext} key="dashboard">
            Retirar
          </DropdownItem>
          <DropdownItem className={classtext} key="new_project" endContent={<PlusIcon className="text-large" />}>
            Depósito
          </DropdownItem>
        </DropdownSection>

        <DropdownSection showDivider aria-label="Preferencias">
          <DropdownItem key="quick_search" className={classtext}>
            Movimientos
          </DropdownItem>
          <DropdownItem key="quick_orders" className={classtext}>
            Órdenes
          </DropdownItem>

          {/* Selector de tema */}
          <DropdownItem
            key="theme"
            isReadOnly
            className="cursor-default"
            endContent={
              <select
                className="z-10 outline-none w-24 py-0.5 rounded-md text-tiny border-small border-default-300 dark:border-default-200 bg-transparent text-default-600"
                value={themeSelection}
                onChange={(e) => applyTheme(e.target.value)}
                onClick={(e) => e.stopPropagation()} // evita que el click lo capture el item
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
              <Button onClick={goToAdminPanel} className="w-full" size="sm" color="primary" variant="bordered">
                Panel admin
              </Button>
            </DropdownItem>
          )}

          <DropdownItem key="logout" color="danger" isReadOnly>
            <Button onClick={handleLogout} className="w-full" size="sm" color="danger" variant="bordered">
              Cerrar sesión
            </Button>
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}