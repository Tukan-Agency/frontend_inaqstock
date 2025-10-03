import React, { useState, useMemo } from "react";
import {
  Button,
  Select,
  SelectItem,
  Input,
  Card,
  CardBody,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

export default function Deposito() {
  const navigate = useNavigate();

  // Diccionario de países → bancos (igual al del proyecto anterior)
  const bankData = useMemo(
    () => ({
      Ecuador: [
        "Banco Guayaquil",
        "Banco Pichincha",
        "Red Activa",
        "Mi Comisariato",
        "Farmacias 911",
        "Tía",
        "Tarjeta de Crédito o Débito",
      ],
      Chile: [
        "Banco BCI",
        "BANCO TBANC",
        "aCuenta",
        "Express Líder",
        "Líder",
        "ServiEstado",
        "Caja Vecina",
        "Mach",
        "Banco Estado",
        "Khipu",
        "Khipu Banco Estado",
        "Khipu BCI",
        "Tarjeta de Crédito o Débito",
      ],
      "Costa Rica": ["Banco Nacional", "Tarjeta de Crédito o Débito"],
      Perú: [
        "BBVA Continental",
        "Banco de Crédito",
        "Caja Arequipa",
        "Caja Huancayo",
        "Caja Tacna",
        "Caja Trujillo",
        "Interbank",
        "Banco Ripley",
        "Scotibank Perú",
        "Tambo",
        "Western Unión",
        "Tarjeta de Crédito o Débito",
      ],
      México: [
        "Banco Azteca",
        "Banorte",
        "HSBC México",
        "OpenPay",
        "SPEI MX",
        "Banco Santander",
        "Scotibank México",
        "Tarjeta de Crédito o Débito",
      ],
      "El Salvador": ["Punto Xpress SLV", "Tarjeta de Crédito o Débito"],
      Colombia: ["Efecty", "PSE", "Tarjeta de Crédito o Débito"],
      USA: ["Evolve Bank & Trust", "Tarjeta de Crédito o Débito"],
      Bolivia: ["Tarjeta de Crédito o Débito"],
      Nicaragua: ["Tarjeta de Crédito o Débito", "Criptomonedas"],
      Honduras: ["Tarjeta de Crédito o Débito", "Criptomonedas"],
      Panamá: ["Western Unión", "Tarjeta de Crédito o Débito"],
    }),
    []
  );

  const countryList = useMemo(() => Object.keys(bankData), [bankData]);

  const [country, setCountry] = useState(""); // país seleccionado
  const [bank, setBank] = useState(""); // banco seleccionado
  const [amount, setAmount] = useState(""); // monto solicitado
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bankOptions = country ? bankData[country] ?? [] : [];
  const canSubmit = country && bank && Number(amount) > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    // Aquí puedes hacer tu llamada al backend. Simulamos éxito inmediato.
    addToast({
      title: "Solicitud enviada",
      description: "Tu solicitud de depósito ha sido enviada correctamente.",
      color: "success",
      duration: 3000,
    });

    setTimeout(() => {
      navigate("/explorar");
    }, 3000);
  };

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl max-w-xl m-auto">
        <CardBody className="px-2 sm:px-6 py-4">
          <h1 className="text-2xl font-semibold tracking-wide">DEPÓSITO</h1>
          <p className="mt-1 text-[15px] text-[#8D8D8D] dark:text-default-400">
            Aquí podrás realizar tu depósito
          </p>

          {/* Tile visual de Banco (no interactivo), como en la maqueta */}
          <div className="mt-6">
            <div className="inline-flex flex-col items-center gap-2 rounded-2xl border border-[#7fb1c9] px-5 py-4 w-[116px]">
              <div className="w-14 h-14 rounded-md flex items-center justify-center bg-[#e6f0f5]">
                <Icon icon="mdi:bank" width={28} color="#277fa0" />
              </div>
              <span className="text-[15px] font-medium text-[#00689B]">
                Banco
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* País */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide">
                SELECCIONA TU PAÍS
              </label>
              <Select
                aria-label="Selecciona tu país"
                placeholder="Seleccionar país"
                selectedKeys={country ? [country] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] || "";
                  setCountry(value);
                  setBank(""); // reset banco al cambiar país
                }}
                variant="bordered"
                radius="lg"
                size="md"
                className="w-full"
                classNames={{
                  selectorIcon: "hidden",
                  value: "text-[15px]",
                }}
                endContent={
                  <Icon
                    icon="mdi:chevron-right"
                    width={20}
                    className="text-default-400"
                  />
                }
              >
                {countryList.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Banco (solo si hay país seleccionado) */}
            {country && (
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide">
                  SELECCIONA TU BANCO
                </label>
                <Select
                  aria-label="Selecciona tu banco"
                  placeholder="Bancos disponibles"
                  selectedKeys={bank ? [bank] : []}
                  onSelectionChange={(keys) => setBank(Array.from(keys)[0] || "")}
                  variant="bordered"
                  radius="lg"
                  size="md"
                  className="w-full"
                  classNames={{
                    selectorIcon: "hidden",
                    value: "text-[15px]",
                  }}
                  endContent={
                    <Icon
                      icon="mdi:chevron-right"
                      width={20}
                      className="text-default-400"
                    />
                  }
                >
                  {bankOptions.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}

            {/* Monto solicitado */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide">
                MONTO SOLICITADO
              </label>
              <Input
                aria-label="Monto solicitado"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                variant="bordered"
                radius="lg"
                size="md"
              />
            </div>

            {/* Botón Enviar */}
            <div className="pt-2 flex justify-center">
              <Button
                type="submit"
                size="md"
                className="px-12 h-12 rounded-xl bg-[#00689B] text-white hover:opacity-90"
                isDisabled={!canSubmit || isSubmitting}
                isLoading={isSubmitting}
              >
                Enviar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}