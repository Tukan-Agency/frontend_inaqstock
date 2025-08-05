import { useSession } from "../hooks/use-session";
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import useDarkMode from "use-dark-mode";
import { Button, Input, Link, addToast } from "@heroui/react";
import { useNavigate, Link as NavLink } from "react-router-dom";
import Logo from "../components/objetos/Logo"

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

  // Redireccionar si ya está autenticado
  if (session.status === "authenticated") {
    return navigate("/operar");
  }

  // Elegir logo según modo oscuro
  useEffect(() => {
    const logos = darkmodevalue
      ? "/nasdaq_logo_dark.png"
      : "/nasdaq_logo_light.png";
    setLogo(logos);
  }, [darkmodevalue]);

  // Mostrar toast de error si lo hay
  useEffect(() => {
    if (error) {
      addToast({
        title: "Error al ingresar",
        description: error,
        color: "Danger", // rojo
        duration: 3000,
      });
      clearError();
    }
  }, [error, clearError]);

  return (
    <div
      style={{ background: "rgb(0 0 0 / 7%)" }}
      className="flex flex-col items-center justify-center pt-0 h-screen"
    >
      <Card shadow="sm" className="w-[25vw] p-10 mt-0 mb-10">
        <CardHeader className="px-4 pt-2 pb-9 flex items-center justify-center">
          
          <Logo data={{height: 230, width: 250}} />
        </CardHeader>
        <CardBody>
          <form
            autoComplete="off"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <Input
              type="text"
              name="email"
              label="Email"
              value={formData.email}
              variant="bordered"
              onChange={handleChange}
              size="sm"
              radius="md"
            />
            <Input
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              variant="bordered"
              onChange={handleChange}
              size="sm"
              radius="md"
            />
            <center>
              <Button
                type="submit"
                size="md"
                className="w-full disabled:cursor-not-allowed text-white"
                color="primary"
                isLoading={isLoading}
                spinner={
                  <svg
                    className="animate-spin h-5 w-5 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
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
            </center>
          </form>
        </CardBody>
        <div className="flex justify-center items-center gap-2">
          No tienes una cuenta?{" "}
          <Link showAnchorIcon className="text-primary">
            <NavLink to="/register">Regístrate</NavLink>
          </Link>
        </div>
      </Card>
    </div>
  );
}
