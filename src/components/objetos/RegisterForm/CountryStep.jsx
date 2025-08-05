import { Input, Select, SelectItem, Button, Avatar } from "@heroui/react";
import { useState } from "react";
import countries from "./paises.json";

export default function CountryStep({
  formData,
  selectedCountryCode,
  handleCountryChange,
  previousStep,
  nextStep,
}) {
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!selectedCountryCode) {
      setError("Por favor selecciona un país válido.");
      return;
    }

    setError("");
    nextStep();
  };

  const handleSelectionChange = (key) => {
    const selectedCountry = countries.find((c) => c.code === key);

    if (selectedCountry) {
      handleCountryChange(
        key,
        {
          code: selectedCountry.ext,
          name: selectedCountry.name,
        },
        {
          name: selectedCountry.currency,
          symbol: selectedCountry.currency,
        }
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 px-6">
      <h3 className="text-xl font-semibold">País</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Selecciona tu país"
          selectedKeys={
            selectedCountryCode ? new Set([selectedCountryCode]) : new Set()
          }
          onSelectionChange={(keys) => {
            const key = keys instanceof Set ? Array.from(keys)[0] : keys;
            handleSelectionChange(key);
          }}
          isInvalid={!selectedCountryCode}
          variant="bordered"
          size="sm"
          className="max-w-xs"
          disallowEmptySelection={false}
        >
          {countries.map((country) => (
            <SelectItem
              key={country.code}
              value={country.code}
              textValue={country.name}
              startContent={
                <Avatar
                  alt={country.name}
                  className="w-6 h-6"
                  src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                />
              }
            >
              {country.name}
            </SelectItem>
          ))}
        </Select>

        <Input
          name="country.code"
          label="Prefijo telefónico"
          value={formData.country?.code || ""}
          disabled
        />
      </div>

      <Input
        name="currency.name"
        label="Moneda"
        value={formData.currency?.name || ""}
        disabled
      />

      {error && <p className="text-red-500 text-sm pt-2">{error}</p>}

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
