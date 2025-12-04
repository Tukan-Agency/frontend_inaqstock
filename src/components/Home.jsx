import { useState, useEffect } from "react";
import axios from "axios";
import LoginForm from "./login-form.jsx";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/use-session.jsx";

export default function Home() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function erorres(errs) {
    if (errs.message === "Network Error") {
      return "Algo salió mal. Contacte soporte.";
    } else {
      const errbackend = errs.response?.data?.message || "Error en el servidor";
      return errbackend;
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
    });
  };

  const handleChange = (event) => {
    setFormData((prevData) => ({
      ...prevData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const res = await axios.post(
        import.meta.env.VITE_API_URL + "/api/auth/login",
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.status === "exito") {
        return window.location.replace("/operar");
      }
      if (res.data.status === "error") {
        setError(res.data.menssage || "Credenciales inválidas");
        resetForm();
      } else {
        setError("Error en el servidor!");
      }
    } catch (e) {
      setError(erorres(e));
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Simular click en el logo 1s después de montar
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const selector ='.logo-inaq';

    const clickLogo = () => {
      const el = document.querySelector(selector);
      if (el) {
        if (typeof el.click === "function") {
          el.click();
        } else {
          el.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
          );
        }
      }
    };

    const t = setTimeout(clickLogo, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="text-foreground bg-background h-[100vh]">
      <LoginForm
        formData={formData}
        error={error}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        isLoading={isLoading}
        clearError={clearError}
        resetForm={resetForm}
      />
    </div>
  );
}