import { Input, Button, addToast } from "@heroui/react";
import { useState, useEffect } from "react";

export default function PasswordStep({
  formData,
  handleChange,
  handleSubmit,
  previousStep,
  isLoading,
}) {
  const [passwordMatch, setPasswordMatch] = useState(false);

  useEffect(() => {
    const match =
      formData.password &&
      formData.cpassword &&
      formData.password === formData.cpassword;
    setPasswordMatch(!!match);
  }, [formData.password, formData.cpassword]);

  const onRegister = async () => {
    try {
      await Promise.resolve(handleSubmit());
    } catch (err) {
      const data = err?.response?.data || {};
      const msg = data.message || err?.message || "Error al registrar usuario";
      const detail =
        typeof data.error === "string"
          ? data.error
          : data.error
          ? JSON.stringify(data.error)
          : "";
      addToast({
        title: "Registro fallido",
        description: detail ? `${msg} · ${detail}` : msg,
        color: "danger",
        duration: 3500,
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 px-6">
      <h3 className="text-xl font-semibold">Contraseña</h3>

      <div className="border border-default-200 rounded-lg p-4 text-sm leading-relaxed">
        <p className="mb-2 font-semibold">Debe tener:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Al menos una minúscula.</li>
          <li>Al menos una mayúscula.</li>
          <li>Al menos un número.</li>
          <li>Mínimo 8 caracteres.</li>
          <li>No se aceptan caracteres especiales.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input name="password" label="Contraseña" type="password" value={formData.password} onChange={handleChange} />
        <Input name="cpassword" label="Confirmar Contraseña" type="password" value={formData.cpassword} onChange={handleChange} />
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={previousStep} className="text-white" color="primary">
          Anterior
        </Button>
        <Button color="success" onClick={onRegister} isLoading={isLoading} disabled={!passwordMatch || isLoading}>
          Registrarse
        </Button>
      </div>
    </div>
  );
}