import { Input, Button, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

export default function PasswordStep({
  formData,
  handleChange,
  handleSubmit,
  previousStep,
  isLoading,
}) {
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para validar la contraseña
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("Mínimo 8 caracteres.");
    if (!/\d/.test(password)) errors.push("Al menos un número.");
    return errors;
  };

  useEffect(() => {
    const match = formData.password && formData.cpassword && formData.password === formData.cpassword;
    setPasswordMatch(!!match);
    
    // Validar contraseña cada vez que cambia
    if (formData.password) {
      const errors = validatePassword(formData.password);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  }, [formData.password, formData.cpassword]);

  const onRegister = async () => {
    console.log("Botón Registrarse clickeado");
    console.log("Datos actuales:", {
      password: formData.password,
      cpassword: formData.cpassword,
      passwordMatch,
      passwordErrors: passwordErrors.length,
      isLoading
    });

    // Validaciones antes de enviar
    if (!formData.password || !formData.cpassword) {
      addToast({
        title: "Error de validación",
        description: "Ambas contraseñas son requeridas",
        color: "danger",
        duration: 3500,
      });
      return;
    }

    if (formData.password !== formData.cpassword) {
      addToast({
        title: "Contraseñas no coinciden",
        description: "Las contraseñas deben ser iguales.",
        color: "danger",
        duration: 3500,
      });
      return;
    }

    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      addToast({
        title: "Contraseña inválida",
        description: errors.join(" "),
        color: "danger",
        duration: 3500,
      });
      return;
    }

    try {
      console.log("Intentando registrar...");
      setIsSubmitting(true);
      
      // Llamar a handleSubmit desde el padre
      await handleSubmit();
      
    } catch (err) {
      console.error("Error en registro:", err);
      const data = err?.response?.data || {};
      const msg = data.message || err?.message || "Error al registrar usuario";
      const detail = typeof data.error === "string"
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Definir requisitos con estado cumplido/no cumplido
  const password = formData.password || "";
  const requirements = [
    { label: "Mínimo 8 caracteres.", fulfilled: password.length >= 8 },
    { label: "Al menos un número.", fulfilled: /\d/.test(password) },
  ];

  const allRequirementsMet = requirements.every(req => req.fulfilled);
  const canSubmit = passwordMatch && allRequirementsMet && !isSubmitting;

  return (
    <div className="flex flex-col gap-6 px-6">
      <h3 className="text-xl font-semibold">Contraseña</h3>

      <div className="border border-default-200 rounded-lg p-4 text-sm leading-relaxed">
        <p className="mb-2 font-semibold">Debe tener:</p>
        <ul className="list-none ml-0 space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center gap-2">
              <Icon
                icon={req.fulfilled ? "mdi:check-circle" : "mdi:close-circle"}
                className={req.fulfilled ? "text-green-600" : "text-red-600"}
                width="20"
                height="20"
              />
              <span className={req.fulfilled ? "text-green-600" : "text-red-600"}>
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          name="password" 
          label="Contraseña" 
          type={showPassword ? "text" : "password"}
          value={formData.password} 
          onChange={handleChange}
          endContent={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} />
            </button>
          }
        />
        <Input 
          name="cpassword" 
          label="Confirmar Contraseña" 
          type={showCPassword ? "text" : "password"}
          value={formData.cpassword} 
          onChange={handleChange}
          endContent={
            <button
              type="button"
              onClick={() => setShowCPassword(!showCPassword)}
              className="focus:outline-none"
              aria-label={showCPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
            >
              <Icon icon={showCPassword ? "mdi:eye-off" : "mdi:eye"} />
            </button>
          }
        />
      </div>

      {/* Mensaje de estado de validación */}
      <div className="mt-2">
        {formData.password && formData.cpassword && !passwordMatch && (
          <p className="text-red-500 text-sm">⚠️ Las contraseñas no coinciden</p>
        )}
        {passwordMatch && allRequirementsMet && (
          <p className="text-green-500 text-sm">✓ Contraseña válida</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          onClick={previousStep} 
          className="text-white" 
          color="primary"
          disabled={isSubmitting}
        >
          Anterior
        </Button>
        <Button 
          color="success" 
          onClick={onRegister} 
          isLoading={isSubmitting || isLoading}
          disabled={!canSubmit}
        >
          Registrarse
        </Button>
      </div>
    </div>
  );
}