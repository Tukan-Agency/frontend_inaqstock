// ✅ Nuevo RegisterForm adaptado al StepWizard, sin submit interno
// Archivo: register-form.jsx

import { useEffect } from "react";
import StepWizard from "react-step-wizard";
import { Card } from "@heroui/card";

import PersonalDataStep from "../components/objetos/RegisterForm/PersonalDataStep";
import ContactStep from "../components/objetos/RegisterForm/ContactStep";
import CountryStep from "../components/objetos/RegisterForm/CountryStep";
import PasswordStep from "../components/objetos/RegisterForm/PasswordStep";
import countries from "../components/objetos/RegisterForm/paises.json";

const countryList = countries;

export default function RegisterForm({
  formData,
  setFormData,
  handleChange,
  handleSubmit,
  isLoading,
  whatsappDifferent,
  setWhatsappDifferent,
  selectedCountryCode,
  setSelectedCountryCode,
}) {
  useEffect(() => {
    if (!whatsappDifferent) {
      setFormData((prev) => ({
        ...prev,
        whatsapp: prev.contactNumber,
      }));
    }
  }, [whatsappDifferent, formData.contactNumber]);

  const handleCountryChange = (code) => {
    const selected = countryList.find((c) => c.code === code);
    if (!selected) return;
    setSelectedCountryCode(code);
        const flagUrl = `https://flagcdn.com/${String(selected.code || "").toLowerCase()}.svg`;

    setFormData((prev) => ({
      ...prev,
      country: {
        name: selected.name,
        code: selected.ext, // prefijo telefónico
        flag: flagUrl,      // URL correcta de la bandera
      },
      currency: {
        name: selected.currency,
        symbol: selected.symbol || selected.currency, // opcional, si tu JSON tiene symbol
      },
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <Card className="w-[50vw] p-10">
        <StepWizard>
          <PersonalDataStep formData={formData} handleChange={handleChange} />
          <ContactStep
            formData={formData}
            handleChange={handleChange}
            whatsappDifferent={whatsappDifferent}
            setWhatsappDifferent={setWhatsappDifferent}
          />
          <CountryStep
            formData={formData}
            handleCountryChange={handleCountryChange}
            selectedCountryCode={selectedCountryCode}
          />
          <PasswordStep
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </StepWizard>
      </Card>
    </div>
  );
}