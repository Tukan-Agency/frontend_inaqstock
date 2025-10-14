import { createContext, useContext, useState, useEffect } from "react";

const AccountModeContext = createContext();

export const AccountModeProvider = ({ children }) => {
  const LOCAL_KEY = "accountMode";
  const [mode, setMode] = useState(() => {
    return localStorage.getItem(LOCAL_KEY) || "real";
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, mode);
  }, [mode]);

  return (
    <AccountModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AccountModeContext.Provider>
  );
};

export const useAccountMode = () => useContext(AccountModeContext);
