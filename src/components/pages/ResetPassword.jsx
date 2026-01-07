import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Input, Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import { RecoveryService } from "../services/recoveryService";
import Logo from "../objetos/Logo"; // Asegúrate de que la ruta sea correcta
// Si usas sonner u otro toast, impórtalo aquí. Usaré alert simple como fallback o addToast si tienes contexto.
import { addToast } from "@heroui/react"; 

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, success, error

  // Validar si hay token al cargar
  useEffect(() => {
    if (!token) {
      addToast({ title: "Error", description: "Enlace inválido o incompleto", color: "danger" });
      setStatus("error");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword.length < 6) {
      addToast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", color: "warning" });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({ title: "Error", description: "Las contraseñas no coinciden", color: "warning" });
      return;
    }

    setLoading(true);
    const res = await RecoveryService.performReset(token, newPassword);
    setLoading(false);

    if (res.ok) {
      setStatus("success");
      addToast({ title: "Éxito", description: "Contraseña actualizada correctamente", color: "success" });
      // Redirigir al login después de unos segundos
      setTimeout(() => navigate("/"), 3000);
    } else {
      addToast({ title: "Error", description: res.message, color: "danger" });
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center  ">
        <Card className="max-w-md w-full p-6 text-center">
          <CardBody className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <Icon icon="solar:check-circle-bold" width={40} />
            </div>
            <h2 className="text-2xl font-bold">¡Contraseña Actualizada!</h2>
            <p className="text-gray-500">
              Tu contraseña ha sido restablecida con éxito. Ahora puedes iniciar sesión con tu nueva clave.
            </p>
            <Button color="primary" className="w-full mt-4" onPress={() => navigate("/")}>
              Ir al Inicio de Sesión
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (status === "error" && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center  ">
        <Card className="max-w-md w-full p-6 text-center">
          <CardBody>
            <Icon icon="solar:danger-circle-bold" className="text-danger mx-auto mb-4" width={48} />
            <h2 className="text-xl font-bold mb-2">Enlace inválido</h2>
            <p className="text-gray-500 mb-6">Este enlace de recuperación no es válido o falta el token de seguridad.</p>
            <Button as={Link} to="/forgot-password" variant="flat">
              Solicitar nuevo enlace
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="flex flex-col gap-3 pb-0 pt-6 px-6">
          <div className="mx-auto mb-2">
            <Logo size={50} />
          </div>
          <h1 className="text-2xl font-bold text-center">Nueva Contraseña</h1>
          <p className="text-sm text-gray-500 text-center">
            Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
          </p>
        </CardHeader>
        
        <CardBody className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Nueva Contraseña"
              type="password"
              variant="bordered"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              startContent={<Icon icon="solar:lock-password-linear" className="text-gray-400" />}
              isRequired
            />

            <Input
              label="Confirmar Contraseña"
              type="password"
              variant="bordered"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              startContent={<Icon icon="solar:lock-password-linear" className="text-gray-400" />}
              isRequired
              color={confirmPassword && newPassword !== confirmPassword ? "danger" : "default"}
              errorMessage={confirmPassword && newPassword !== confirmPassword ? "Las contraseñas no coinciden" : ""}
            />

            <Button 
              type="submit" 
              color="primary" 
              className="w-full font-semibold" 
              size="lg"
              isLoading={loading}
              isDisabled={!newPassword || !confirmPassword}
            >
              Restablecer Contraseña
            </Button>

            <div className="text-center mt-2">
              <Link to="/" className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-1">
                <Icon icon="solar:arrow-left-linear" />
                Volver al inicio
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}