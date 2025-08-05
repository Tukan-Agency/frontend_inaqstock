import { Input, Button, Checkbox, addToast } from "@heroui/react";
import { useState, useEffect } from "react";

export default function ContactStep({
  formData,
  handleChange,
  nextStep,
  previousStep,
  whatsappDifferent,
  setWhatsappDifferent,
}) {
  const [error, setError] = useState("");

  const handleNext = () => {
    const { contactNumber, whatsapp, address, company } = formData;

    if (!contactNumber || !address || !company) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (whatsappDifferent && !whatsapp) {
      setError("El número de WhatsApp es obligatorio si marcaste la casilla.");
      return;
    }

    setError("");
    nextStep();
  };
      const clearError = () => {
    setError(null);
  };
    useEffect(() => {
      if (error) {
        addToast({
          title: "Error al ingresar",
          description: error,
          color: "warning", // rojo
          duration: 3000,
        });
        clearError();
      }
    }, [error, clearError]);

  return (
    <div className="flex flex-col gap-6 px-6">
      <h3 className="text-xl font-semibold">Contacto</h3>

      <Checkbox
        isSelected={whatsappDifferent}
        onChange={() => setWhatsappDifferent(!whatsappDifferent)}
      >
        ¿Su número de WhatsApp es diferente al número de contacto?
      </Checkbox>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          variant="bordered"
          size="sm"
          name="contactNumber"
          placeholder="Ingrese sin código de país"
          label="Número de contacto"
          type="number"
          value={formData.contactNumber}
          onChange={handleChange}
          isInvalid={!formData.contactNumber}
        />
        <Input
        placeholder="Ingrese el lugar de su residencia"
          variant="bordered"
          size="sm"
          name="whatsapp"
          label="WhatsApp"
          type="number"
          value={formData.whatsapp}
          onChange={handleChange}
          disabled={!whatsappDifferent}
          isInvalid={whatsappDifferent && !formData.whatsapp}
        />
      </div>

      <Input
        variant="bordered"
        size="sm"
        name="address"
        label="Dirección"
        placeholder="Ingrese el lugar de su residencia"
        value={formData.address}
        onChange={handleChange}
        isInvalid={!formData.address}
      />

      <Input
        variant="bordered"
        size="sm"
        name="company"
        label="Empresa"
        placeholder="Ingrese el nombre de su empresa"
        value={formData.company}
        onChange={handleChange}
        isInvalid={!formData.company}
      />

 

      <div className="flex justify-between pt-4">
        <Button onClick={previousStep} className="text-white" color="primary">
          Anterior
        </Button>
        <Button onClick={handleNext} className="text-white" color="primary">
          Siguiente
        </Button>
      </div>
    </div>
  );
}
