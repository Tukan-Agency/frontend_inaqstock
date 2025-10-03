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
import { useLocation, Link, useNavigate } from "react-router-dom";
import Logo from "./objetos/Logo";
import UserDropdown from "./objetos/UserDropdown"; 
import SaldosDropdown from "./objetos/SaldosDropdown";

export default function Nav() {
  const location = useLocation();
  const currentSlug = location.pathname.split("/")[1];
  const navigate = useNavigate();

  return (
    <Navbar height={30} isBlurred={true} maxWidth="full" isBordered={false}>
      <NavbarBrand>
        <Link style={{ cursor: "pointer" }} to="/operar">
          <Logo data={{ height: 120, width: 150 }} />
        </Link>
      </NavbarBrand>

      <NavbarContent className={"flex gap-x-10"}>
        <Tabs
          selectedKey={currentSlug || "operar"}
          onSelectionChange={(key) => navigate(`/${key}`)}
          aria-label="Tabs sizes"
          size="sm"
          variant="bordered"
        >
          <Tab key="operar" title="Operar" />
          <Tab key="analitica" title="Analítica" />
          <Tab key="explorar" title="Explorar" />
        </Tabs>
      </NavbarContent>

      <NavbarContent className={"flex gap-x-10"}>
       <SaldosDropdown />
      </NavbarContent>

      <NavbarContent justify="end">
        <UserDropdown />  
        <Button className="text-white" color="primary" variant="shadow">
          Depósito
        </Button>
      </NavbarContent>
    </Navbar>
  );
}
