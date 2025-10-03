import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { changeMyPassword } from "../../../../services/account.js"; // ajusta la ruta si tu árbol difiere

export default function ChangePasswordForm({ onSubmit }) {
  const [pwd, setPwd] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const minLen = 6;
  const tooShort = pwd.trim().length > 0 && pwd.trim().length < minLen;
  const disabled = pwd.trim().length === 0 || tooShort || loading;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (disabled) return;

    try {
      setLoading(true);
      await changeMyPassword(pwd.trim());

      addToast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se cambió correctamente.",
        color: "success",
        duration: 2200,
      });

      // Callback opcional del padre (si lo pasan)
      onSubmit?.(pwd.trim());

      setPwd("");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo actualizar la contraseña";
      addToast({
        title: "Error",
        description: msg,
        color: "danger",
        duration: 2600,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Contraseña nueva"
        type={visible ? "text" : "password"}
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        radius="sm"
        variant="bordered"
        isInvalid={tooShort}
        errorMessage={
          tooShort ? `La contraseña debe tener al menos ${minLen} caracteres` : ""
        }
        endContent={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-foreground-500"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Icon
              icon={visible ? "mdi:eye-off-outline" : "mdi:eye-outline"}
              width={18}
            />
          </button>
        }
      />
      <Button
        type="submit"
        color="primary"
        className="bg-black text-white hover:opacity-90 w-fit"
        isDisabled={disabled}
        isLoading={loading}
        startContent={<Icon icon="mdi:lock-reset" width={18} />}
      >
        Actualizar contraseña
      </Button>
    </form>
  );
}