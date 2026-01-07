import React, { StrictMode } from "react";
import useDarkMode from "use-dark-mode";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { SessionProvider } from "./context/session";
import { BalanceProvider } from "../src/context/BalanceContext.jsx"; // 👈 IMPORTAR
import { AccountModeProvider } from "../src/context/AccountModeContext.jsx"; // 👈 IMPORTAR
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import ErrorBoundary from "./components/error-boundary";
import Error from "./components/error";
import { SettingsProvider } from "./context/SettingsContext.jsx";

window.global = window;

if (localStorage.getItem("darkMode") === null) {
  localStorage.setItem("darkMode", "false");
}

const RootComponent = () => {
  const darkMode = useDarkMode(false, { global: window });

  return (
    <StrictMode>
      <BrowserRouter>
        <HeroUIProvider>
          {/* ToastProvider siempre debe estar lo más alto posible */}
          <div className="fixed z-[100] ">
            <ToastProvider placement="top-right" toastOffset={60} />
          </div>

          <SessionProvider>
            <AccountModeProvider>
              <BalanceProvider>
                {" "}
                {/* 👈 AGREGAR AQUÍ */}
                <ErrorBoundary fallback={<Error />}>
                  <main
                    className={`${
                      darkMode.value ? "dark" : ""
                    } text-foreground bg-background `}
                  >
                    <SettingsProvider>
                      <App />
                    </SettingsProvider>
                  </main>
                </ErrorBoundary>
              </BalanceProvider>{" "}
              {/* 👈 CERRAR AQUÍ */}
            </AccountModeProvider>
          </SessionProvider>
        </HeroUIProvider>
      </BrowserRouter>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")).render(<RootComponent />);
