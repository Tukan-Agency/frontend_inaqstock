import { useLocation } from "react-router-dom";
import VerifyForm from "./verify-form.jsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state;
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [code, setCode] = useState(""); // Mantenemos el código OTP en el estado
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isDisabled, setIsDisabled] = useState(true);

  // Redirigir a la página principal si no hay id
  if (!id) {
    navigate("/");
  }

  // Manejar cambio del valor OTP
// En el componente Verify
const handleChange = (value) => {
  setCode(value); // Actualizamos el valor del OTP con el valor recibido
};


  // Enviar OTP al servidor para verificar
  async function handleSubmit(e) {
    e.preventDefault();
    if (!code) {
      setError("OTP code is required");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/verify/`,
        {
          id: id,
          code: code,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.status === 200) {
        return window.location.replace("/operar");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  // Enviar una nueva solicitud de OTP
  const handleSendNewCode = async () => {
    setTimeLeft(120);
    setIsDisabled(true);
    setIsRequesting(true);
    try {
      const res = await axios.post(
        import.meta.env.VITE_API_URL + "/api/auth/resend",
        {
          id: id,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.status === 200) {
        const message = await res.data.message;
        setMessage(message);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong.");
    } finally {
      setIsRequesting(false);
    }
  };

  // Temporizador para la expiración del OTP
  useEffect(() => {
    if (timeLeft === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div className="text-foreground bg-background h-[100vh]">
    <VerifyForm
      code={code}
      handleSubmit={handleSubmit}
      handleSendNewCode={handleSendNewCode}
      error={error}
      resendMessage={message}
      timeLeft={timeLeft}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isRequesting={isRequesting}
      handleChange={handleChange}
    />
    </div>
  );
}
