import { Input, Button, DatePicker, addToast } from "@heroui/react";
import axios from "axios";

import { useState, useEffect } from "react";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";

export default function PersonalDataStep({ formData, handleChange, nextStep }) {
  const [error, setError] = useState("");
    const [alerta, setAlerta] = useState({});
  const [emailExists, setEmailExists] = useState(false);
  const checkEmailExists = async (email) => {
    try {
      const res = await axios.post(
        import.meta.env.VITE_API_URL + "/api/auth/check-email",
        { email },
        { withCredentials: true }
      );

      if (res.data.exists) {
        setEmailExists(true);
        setError("Este correo ya está registrado");
        setAlerta({
          color: "danger",
          titulo: "Registro rechazado",
        });
      } else {
        setEmailExists(false);
        setError("Correo Disponible");
         setAlerta({
          color: "success",
          titulo: "Registro aprobado",
        });
      }
    } catch (err) {
      console.log("Error verificando correo:", err);
    }
  };

  // Convertir el valor del formulario a CalendarDate
  const getDateValue = () => {
    if (!formData.birthday) return null;
    try {
      return parseDate(formData.birthday);
    } catch {
      return null;
    }
  };

  const handleNext = () => {
    const { name, surname, email, birthday } = formData;

    if (!name || !surname || !email || !birthday) {
      setError("Todos los campos son obligatorios.");
      setAlerta({
          color: "warning",
          titulo: "No se pudo continuar",
        });
      return;
    }

    if (emailExists) {
      setError("Este correo ya está registrado.");
      return;
    }

    try {
      parseDate(birthday);
    } catch {
      setError("Por favor ingrese una fecha válida (YYYY-MM-DD)");
      return;
    }

    setError("");
    nextStep();
  };

  const handleDateChange = (dateValue) => {
    // dateValue es del tipo CalendarDate de @internationalized/date
    handleChange({
      target: {
        name: "birthday",
        value: dateValue.toString(), // Esto devuelve el formato YYYY-MM-DD
      },
    });
  };

  const clearError = () => {
    setError(null);
  };
  useEffect(() => {
    if (error) {
      addToast({
        title: alerta.titulo,
        description: error,
        color: alerta.color, // rojo
        duration: 1000,
      });
      clearError();
    }
  }, [error, clearError]);

  return (
    <div className="flex flex-col gap-6 px-6">
      <h3 className="text-xl font-semibold">Datos Personales</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          variant="bordered"
          size="sm"
          name="name"
          label="Nombre"
          value={formData.name}
          onChange={handleChange}
        />
        <Input
          variant="bordered"
          size="sm"
          name="surname"
          label="Apellido"
          value={formData.surname}
          onChange={handleChange}
        />
      </div>

      <Input
        variant="bordered"
        size="sm"
        name="email"
        label="Correo electrónico"
        type="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={(e) => checkEmailExists(e.target.value)} // verificación al salir del campo
      />

      <DatePicker
        variant="bordered"
        size="sm"
        label="Fecha de nacimiento"
        value={getDateValue()}
        onChange={handleDateChange}
        className="max-w-[284px]"
        isRequired
        allowsNonEditableInputs={false}
        shouldForceLeadingZeros
        placeholder="YYYY-MM-DD"
        minValue={today(getLocalTimeZone()).subtract({ years: 100 })}
        maxValue={today(getLocalTimeZone()).subtract({ years: 18 })}
        granularity="day"
        validate={(value) => {
          if (!value) return "Este campo es requerido";
          return null;
        }}
      />

      <div className="flex justify-end pt-4">
        <Button className="text-white" color="primary" onClick={handleNext}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
