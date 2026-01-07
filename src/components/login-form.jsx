import { useSession } from "../hooks/use-session";
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import useDarkMode from "use-dark-mode";
import { Button, Input, Link, addToast } from "@heroui/react";
import { useNavigate, Link as NavLink } from "react-router-dom";
import Logo from "../components/objetos/Logo";

export default function LoginForm({
  error,
  formData,
  handleSubmit,
  handleChange,
  isLoading,
  clearError,
  resetForm,
}) {
  const { session } = useSession();
  const navigate = useNavigate();
  const darkmodevalue = useDarkMode().value;
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    if (session.status === "authenticated") {
      navigate("/operar", { replace: true });
    }
  }, [session.status, navigate]);

  useEffect(() => {
    const logos = darkmodevalue ? "/nasdaq_logo_dark_v2.png" : "/nasdaq_logo_light_v2.png";
    setLogo(logos);
  }, [darkmodevalue]);

  useEffect(() => {
    if (error) {
      addToast({
        title: "Error al ingresar",
        description: error,
        color: "danger",
        duration: 3000,
      });
      clearError();
    }
  }, [error, clearError]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[rgb(0_0_0_/_7%)] px-4 py-6">
      <Card shadow="sm" className="w-full max-w-xs sm:max-w-sm md:max-w-md px-2 sm:px-4">
        <CardHeader className="px-2 sm:px-4 pt-4 pb-6 flex items-center justify-center">
          <div className="w-[160px] sm:w-[200px]">
            <Logo data={{ height: 160, width: 200 }} />
          </div>
        </CardHeader>

        <CardBody className="pb-6">
          <form autoComplete="off" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="text"
              name="email"
              label="Email"
              value={formData.email}
              variant="bordered"
              onChange={handleChange}
              size="md"
              radius="md"
            />
            
            <div className="flex flex-col gap-1">
              <Input
                type="password"
                name="password"
                label="Password"
                value={formData.password}
                variant="bordered"
                onChange={handleChange}
                size="md"
                radius="md"
              />
              {/* ✅ ENLACE DE RECUPERACIÓN AGREGADO AQUÍ */}
              <div className="flex justify-end">
                <Link as={NavLink} to="/forgot-password" size="sm" className="text-primary text-xs cursor-pointer hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full disabled:cursor-not-allowed text-white"
              color="primary"
              isLoading={isLoading}
              spinner={
                <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    fill="currentColor"
                  />
                </svg>
              }
              disabled={isLoading}
            >
              {isLoading ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardBody>

        <div className="flex justify-center items-center gap-1 sm:gap-2 pb-4 text-sm sm:text-base">
          <span>¿No tienes una cuenta?</span>
          <Link showAnchorIcon className="text-primary">
            <NavLink to="/register">Regístrate</NavLink>
          </Link>
        </div>
      </Card>
    </div>
  );
}