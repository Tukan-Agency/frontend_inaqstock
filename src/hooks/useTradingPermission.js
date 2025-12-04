import { useMemo } from "react";
import { useBalance } from "../context/BalanceContext.jsx"; // Ajusta path si es ../contexts
import { useAccountMode } from "../context/AccountModeContext";

/**
 * Permiso para operar unificado (Real y Demo).
 * - Verifica capital disponible en la cuenta correspondiente.
 */
export function useTradingPermission({ quantity, price }) {
  const { balances, loading, error, refresh } = useBalance();
  const { mode } = useAccountMode(); // "real" | "demo"

  return useMemo(() => {
    const requiredCost = quantity && price ? quantity * price : 0;

    if (loading) {
      return {
        canTrade: false,
        reason: "Cargando saldos...",
        requiredCost,
        capital: 0,
        mode,
        refresh,
      };
    }

    if (error) {
      return {
        canTrade: false,
        reason: "Error de conexión.",
        requiredCost,
        capital: 0,
        mode,
        refresh,
      };
    }

    // ✅ SELECCIÓN DINÁMICA DE CARTERA
    const currentWallet = mode === "demo" ? (balances?.demo || {}) : (balances?.real || {});
    const capital = Number(currentWallet.capital ?? 0);

    // Validaciones comunes para ambos modos
    if (capital <= 0) {
      return {
        canTrade: false,
        reason: `Sin saldo ${mode === "demo" ? "Demo" : "Real"}.`,
        requiredCost,
        capital,
        mode,
        refresh,
      };
    }

    if (requiredCost > capital) {
      return {
        canTrade: false,
        reason: "Saldo insuficiente para esta operación.",
        requiredCost,
        capital,
        mode,
        refresh,
      };
    }

    return {
      canTrade: true,
      reason: "",
      requiredCost,
      capital,
      mode,
      refresh,
    };
  }, [balances, loading, error, mode, quantity, price, refresh]);
}