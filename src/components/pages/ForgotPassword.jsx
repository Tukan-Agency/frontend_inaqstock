import React, { useState } from "react";
import { Input, Button, Card, CardBody, CardHeader, Link } from "@heroui/react";
import { RecoveryService } from "../services/recoveryService";
import { Icon } from "@iconify/react";
import Logo from "../objetos/Logo"; // Asegúrate de que la ruta al Logo sea correcta

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // Para mostrar éxito o error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    const res = await RecoveryService.requestReset(email);

    setLoading(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Si el correo existe, recibirás un enlace en breve." });
      setEmail(""); // Limpiar campo
    } else {
      setMessage({ type: "error", text: res.message || "Ocurrió un error. Inténtalo de nuevo." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <Card className="w-full max-w-md p-4">
        <CardHeader className="flex flex-col gap-3 items-center pb-0">
          <Logo  height={120} width={120} />
          
          <h1 className="text-xl font-bold">Recuperar Contraseña</h1>
          <p className="text-sm text-default-500 text-center">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu acceso.
          </p>
        </CardHeader>
        
        <CardBody className="gap-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'alertestyle' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label="Correo electrónico"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="bordered"
              startContent={<Icon icon="solar:letter-linear" className="text-default-400" />}
            />

            <Button 
              type="submit" 
              color="primary" 
              isLoading={loading} 
              className="font-semibold"
              fullWidth
            >
              Enviar enlace de recuperación
            </Button>
          </form>

          <div className="flex justify-center mt-2">
            <Link href="/" size="sm" className="text-default-500 hover:text-primary transition-colors cursor-pointer">
              <Icon icon="solar:arrow-left-linear" className="mr-1" />
              Volver al inicio de sesión
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}