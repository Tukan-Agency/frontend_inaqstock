"use client";
import {
  Tabs,
  Tab,
  Button,
  Navbar,
  NavbarItem,
  NavbarBrand,
  NavbarContent,
} from "@heroui/react";
import { Select, SelectItem } from "@heroui/react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Logo from "./objetos/Logo";
import { useAccountMode } from "../context/AccountModeContext.jsx";
import { useSession } from "../hooks/use-session.jsx";
import UserDropdown from "./objetos/UserDropdown";
import SaldosDropdown from "./objetos/SaldosDropdown";
import { useEffect, useState } from "react";

export default function Nav() {
  const style = {
    border: "solid 2px #f3003642",
    padding: "7px",
    borderRadius: "11px",
    fontSize: "10pt",
    background: "#f3003608",
    color: "#f30036",
    fontWeight: "500",
    cursor: "pointer",
  };
   const style_verify = {
    border: "solid 2px #00f30542",
    padding: "7px",
    borderRadius: "11px",
    fontSize: "10pt",
    background: "#00f31508",
    color: "#0e9306",
    fontWeight: "500",
    cursor: "pointer",
  };


  const location = useLocation();
  const currentSlug = location.pathname.split("/")[1];
  const navigate = useNavigate();
  const { mode, setMode } = useAccountMode();
  const { session } = useSession();

  const [cuentaVerificada, setCuentaVerificada] = useState(null); // null = cargando

  useEffect(() => {
    if (session?.user?.user) {
      setCuentaVerificada(session.user.user.cuenta_verify);
    }
  }, [session]);

  // Si aún está cargando la sesión, no renderizamos el texto
  const mostrarAviso = cuentaVerificada === false;

  return (
    <Navbar height={30} isBlurred={true} maxWidth="full" isBordered={false}>
      <NavbarBrand>
        <Link style={{ cursor: "pointer" }} to="/operar">
          <Logo data={{ height: 120, width: 150 }} />
        </Link>
      </NavbarBrand>

      <NavbarContent className="flex gap-x-10">
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
          selectedKey={currentSlug || "operar"}
          onSelectionChange={(key) => navigate(`/${key}`)}
          aria-label="Tabs sizes"
          size="sm"
          variant="bordered"
        >
          <Tab key="operar" title="Operar" />
          <Tab key="analitica" title="Analítica" />
          <Tab key="graficastock" title="Gráfica" />
          <Tab key="explorar" title="Explorar" />
        </Tabs>
      </NavbarContent>

      <NavbarContent className="flex gap-x-10">
        <SaldosDropdown />
      </NavbarContent>

      <NavbarContent justify="end" className="flex items-center gap-3">
        {/* ✅ Solo muestra el aviso cuando realmente se sepa que NO está verificada */}
        {mostrarAviso && <p style={style}>Cuenta no verificada</p>}
         {!mostrarAviso && <p style={style_verify}>Cuenta verificada</p>}

        <UserDropdown cuentaVerificada={cuentaVerificada} />
        <Button className="text-white" color="primary" variant="shadow">
          Depósito
        </Button>
      </NavbarContent>
    </Navbar>
  );
}
