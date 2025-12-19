"use client";
import {
  Tabs,
  Tab,
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  Skeleton
} from "@heroui/react";
import { Select, SelectItem } from "@heroui/react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState, useCallback } from "react";

import Logo from "./objetos/Logo";
import { useAccountMode } from "../context/AccountModeContext.jsx";
import { useSession } from "../hooks/use-session.jsx";
import UserDropdown from "./objetos/UserDropdown";
import SaldosDropdown from "./objetos/SaldosDropdown";
import useDarkMode from "use-dark-mode";
import axios from "axios";

export default function Nav() {
  const styleNoVerify = {
    border: "solid 2px #f3003642",
    padding: "6px 10px",
    borderRadius: "11px",
    fontSize: "10pt",
    background: "#f3003608",
    color: "#f30036",
    fontWeight: "500",
    cursor: "default",
    whiteSpace: "nowrap",
  };
  const styleVerify = {
    border: "solid 2px #00f30542",
    padding: "6px 10px",
    borderRadius: "11px",
    fontSize: "10pt",
    background: "#00f31508",
    color: "#0e9306",
    fontWeight: "500",
    cursor: "default",
    whiteSpace: "nowrap",
  };

  const location = useLocation();
  const currentSlug = location.pathname.split("/")[1] || "operar";
  const navigate = useNavigate();
  const { mode, setMode } = useAccountMode();
  const { session, clearSession } = useSession();

  const [cuentaVerificada, setCuentaVerificada] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Tema (mismo comportamiento que en UserDropdown)
  const darkMode = useDarkMode(false, {
    classNameDark: "dark",
    classNameLight: "light",
    global: typeof window !== "undefined" ? window : undefined,
  });
  const THEME_KEY = "app-theme-selection";
  const getInitialTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "Oscuro" || "Claro" || "System") return saved;
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
      html.classList.remove("dark");
      html.classList.remove("light");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.add(prefersDark ? "dark" : "light");
    }
    setThemeSelection(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  };
  useEffect(() => {
    if (themeSelection !== "System") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("System");
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeSelection]);

  useEffect(() => {
    if (session?.user?.user) {
      setCuentaVerificada(session.user.user.cuenta_verify);
      setIsLoading(false);
    } else if (session === null) {
      setIsLoading(false);
    }
  }, [session]);

  const mostrarAviso = cuentaVerificada === false;

  const onGo = useCallback(
    (path) => {
      navigate(path);
      setMenuOpen(false);
    },
    [navigate]
  );

  const tabs = useMemo(
    () => [
      { key: "operar", label: "Operar" },
      { key: "analitica", label: "Analítica" },
      { key: "graficastock", label: "Gráfica" },
      { key: "explorar", label: "Explorar" },
    ],
    []
  );

  // Datos de usuario
  const role = session?.user?.role ?? session?.user?.user?.role;
  const isAdmin = Number(role) === 1;
  const userName =
    session?.user?.name || session?.user?.user?.name || "Usuario";
  const userEmail =
    session?.user?.email || session?.user?.user?.email || "email@ejemplo.com";
  const userId =
    session?.user?.sequenceId || session?.user?.user?.sequenceId || "N/A";

  async function handleLogout() {
    try {
      const res = await axios.delete(
        import.meta.env.VITE_API_URL + "/api/auth/logout",
        { withCredentials: true }
      );
      if (res.status === 200) {
        clearSession();
        navigate("/");
      }
    } catch {
      clearSession();
      navigate("/");
    }
  }

  return (
    <>
      <Navbar
        height={56}
        isBlurred
        maxWidth="full"
        isBordered={false}
        className="px-2 md:px-4 z-50"
      >
        {/* Izquierda: Logo */}
        <NavbarBrand className="min-w-[120px]">
          <Link style={{ cursor: "pointer" }} to="/operar" onClick={() => setMenuOpen(false)}>
            <Logo data={{ height: 100, width: 120 }} />
          </Link>
        </NavbarBrand>

        {/* Centro (desktop): selector + tabs */}
        <NavbarContent className="hidden md:flex gap-x-10">
          <Select
            size="sm"
            color={mode === "demo" ? "success" : "secondary"}
            selectedKeys={[mode]}
            onChange={(e) => setMode(e.target.value)}
            className="w-[110px]"
            variant="flat"
          >
            <SelectItem key="real">Real</SelectItem>
            <SelectItem key="demo">Demo</SelectItem>
          </Select>

          <Tabs
            selectedKey={currentSlug}
            onSelectionChange={(key) => navigate(`/${key}`)}
            aria-label="Tabs navegación"
            size="sm"
            variant="bordered"
          >
            {tabs.map((t) => (
              <Tab key={t.key} title={t.label} />
            ))}
          </Tabs>
        </NavbarContent>

        {/* Centro (móvil): selector chico */}
        <NavbarContent className="flex md:hidden">
          <Select
            size="sm"
            color={mode === "demo" ? "success" : "secondary"}
            selectedKeys={[mode]}
            onChange={(e) => setMode(e.target.value)}
            className="w-[100px]"
            variant="flat"
          >
            <SelectItem key="real">Real</SelectItem>
            <SelectItem key="demo">Demo</SelectItem>
          </Select>
        </NavbarContent>

        {/* Derecha: desktop */}
        <NavbarContent className="hidden md:flex items-center gap-3" justify="end">
          {/* Skeleton para SaldosDropdown */}
          <Skeleton isLoaded={!isLoading} className="rounded-xl">
            <SaldosDropdown />
          </Skeleton>

          {/* Estado de verificación con skeleton */}
          {cuentaVerificada === null ? (
            <Skeleton className="rounded-xl w-[143px] h-[32px]" />
          ) : (
            <>
              {cuentaVerificada === false && <p style={styleNoVerify}>Cuenta no verificada</p>}
              {cuentaVerificada === true && <p style={styleVerify}>Cuenta verificada</p>}
            </>
          )}

          <UserDropdown cuentaVerificada={cuentaVerificada} />
          <Button className="text-white" color="primary" variant="shadow" onPress={() => navigate("/explorar/deposito")}>
            Depósito
          </Button>
        </NavbarContent>

        {/* Derecha: móvil → botón hamburguesa (drawer custom) */}
        <NavbarContent className="md:hidden" justify="end">
          <Button
            isIconOnly
            variant="light"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onPress={() => setMenuOpen((v) => !v)}
          >
            <Icon icon={menuOpen ? "material-symbols:close" : "mdi:menu"} width={24} />
          </Button>
        </NavbarContent>
      </Navbar>

      {/* Drawer móvil (custom) */}
      <div
        className={`fixed inset-0 z-[9999] ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        {/* Panel */}
        <div
          className={`absolute right-0 top-0 h-full bg-background border-l border-default-200 shadow-xl transition-transform duration-200 rounded-l-2xl
            ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
          style={{
            width: "94vw",              // más ancho en móvil
            maxWidth: 440,              // tope en móviles grandes
            paddingRight: "env(safe-area-inset-right)", // safe area
          }}
        >
          {/* Header del drawer: badges + botón depósito */}
          <div className="p-3 flex items-center justify-between border-b border-default-200">
            {/* Estado de verificación en móvil */}
            {cuentaVerificada === null ? (
              <Skeleton className="rounded-xl w-[120px] h-[24px]" />
            ) : (
              <>
                {cuentaVerificada === false && (
                  <span className="text-xs" style={styleNoVerify}>
                    Cuenta no verificada
                  </span>
                )}
                {cuentaVerificada === true && (
                  <span className="text-xs" style={styleVerify}>
                    Cuenta verificada
                  </span>
                )}
              </>
            )}
            <Button
              size="sm"
              className="text-white"
              color="primary"
              onPress={() => onGo("/explorar/deposito")}
            >
              Depósito
            </Button>
          </div>

          {/* Contenido del drawer */}
          <div className="px-4 py-4 space-y-8 overflow-y-auto h-[calc(100%-56px)]">
            {/* 1) Perfil encabezado */}
            <div className="flex items-center gap-3">
              <div
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-default-100 shrink-0"
                style={{
                  border: cuentaVerificada ? "2px solid #16a34a" : "2px solid #ccc",
                }}
              >
                <Icon icon="solar:user-bold" width={22} height={22} className="text-default-600" />
                {cuentaVerificada && (
                  <span
                    className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-[2px]"
                    style={{ border: "2px solid white" }}
                    title="Cuenta verificada"
                  >
                    <Icon icon="mdi:check-bold" width={9} height={9} />
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-foreground font-medium truncate">{userName}</span>
                <span className="text-default-500 text-sm truncate">{userEmail}</span>
              </div>
            </div>
            <div className="text-sm text-default-600 -mt-2">
              <strong>ID: {userId}</strong>
            </div>

            {/* 2) Navegación principal */}
            <div className="space-y-1">
              {tabs.map((t) => (
                <Button
                  key={t.key}
                  variant={currentSlug === t.key ? "flat" : "light"}
                  color="default"
                  className="w-full justify-start"
                  onPress={() => onGo(`/${t.key}`)}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <div className="border-t border-default-200" />

            {/* 3) Saldos: contenedor recortado (rounded + overflow-hidden) */}
            <div className="space-y-3">
              <div className="text-sm text-default-500">Saldos</div>
              <div className="rounded-2xl overflow-hidden border border-default-200 bg-content1">
                {/* Skeleton para SaldosDropdown en móvil */}
                <Skeleton isLoaded={!isLoading} className="rounded-xl">
                  <SaldosDropdown />
                </Skeleton>
              </div>
            </div>

            <div className="border-t border-default-200" />

            {/* 4) Acciones y preferencias */}
            <div className="space-y-1">
              <Button variant="light" className="w-full justify-start" onPress={() => onGo("/explorar/cuenta")}>
                Configuración
              </Button>
              <Button variant="light" className="w-full justify-start" onPress={() => onGo("/explorar/retiro")}>
                Retirar
              </Button>
              <Button
                variant="light"
                className="w-full justify-start"
                onPress={() => onGo("/explorar/deposito")}
                endContent={<Icon icon="mdi:plus" width={16} />}
              >
                Depósito
              </Button>

              <div className="my-2 border-t border-default-200" />

              <Button variant="light" className="w-full justify-start" onPress={() => onGo("/explorar/movimientos")}>
                Movimientos
              </Button>
              <Button variant="light" className="w-full justify-start" onPress={() => onGo("/explorar/ordenes")}>
                Órdenes
              </Button>

              {/* Tema */}
              <div className="mt-2">
                <div className="text-sm text-default-600 mb-1">Tema</div>
                <select
                  className="w-full outline-none py-2 px-3 rounded-md border-small border-default-300 dark:border-default-200 bg-transparent text-default-700"
                  value={themeSelection}
                  onChange={(e) => applyTheme(e.target.value)}
                >
                  <option>System</option>
                  <option>Oscuro</option>
                  <option>Claro</option>
                </select>
              </div>

              {/* Panel admin (si aplica) */}
              {isAdmin && (
                <Button className="w-full justify-center mt-2" color="primary" variant="bordered" onPress={() => onGo("/panel")}>
                  Panel admin
                </Button>
              )}

              {/* Logout */}
              <Button className="w-full justify-center mt-4" color="danger" variant="bordered" onPress={handleLogout}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}