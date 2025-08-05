// src/components/UserDropdown.jsx
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
      {
        withCredentials: true,
      }
    );
    if (res.status === 200) {
      clearSession();
      navigate("/");
    }
  }

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
        <Button isIconOnly aria-label="Like" color="default">
          <Icon icon="solar:user-bold" width="24" height="24" />
        </Button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Custom item styles"
        className="p-3  "
        disabledKeys={["profile"]}
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
        <DropdownSection showDivider aria-label="Profile & Actions ">
          <DropdownItem
            key="profile"
            isReadOnly
            className="h-14 gap-2 opacity-100"
          >
            <User
              classNames={{
                name: "text-default-700 ",
                description: "text-default-700",
              }}
              name={session.user.name}
              description={session.user.email || "User"}
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

        <DropdownSection showDivider aria-label="Preferences">
          <DropdownItem className={classtext} key="quick_search">
            Movimientos
          </DropdownItem>
          <DropdownItem
            key="theme"
            isReadOnly
            className="cursor-default"
            endContent={
              <select
                className="z-10 outline-none w-16 py-0.5 rounded-md text-tiny group-data-[hover=true]:border-default-500 border-small border-default-300 dark:border-default-200 bg-transparent text-default-500"
                onChange={(e) => {
                  const theme = e.target.value;

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
                    darkMode.toggle();

                    // Reset manual y aplicar por sistema
                    html.classList.remove("dark");
                    html.classList.remove("light");

                    const prefersDark = window.matchMedia(
                      "(prefers-color-scheme: dark)"
                    ).matches;
                    html.classList.add(prefersDark ? "dark" : "light");
                  }
                }}
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

        <DropdownSection aria-label="Help & Feedback">
          <DropdownItem className={classtext} key="help_and_feedback">
            Ayuda y comentarios
          </DropdownItem>
          <DropdownItem key="logout" color="danger">
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
