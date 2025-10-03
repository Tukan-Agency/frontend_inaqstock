import React, { useState } from "react";
import {
  Button,
  Input,
  Card,
  CardBody,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

export default function Retiro() {
  const navigate = useNavigate();

  const [swift, setSwift] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    swift.trim() !== "" &&
    bankName.trim() !== "" &&
    accountNumber !== "" &&
    Number(amount) > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    // Aquí puedes realizar tu llamada al backend para crear la solicitud
    addToast({
      title: "Solicitud enviada",
      description: "Tu solicitud de retiro ha sido enviada correctamente.",
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
          <h1 className="text-2xl font-semibold tracking-wide">Retiro</h1>
          <p className="mt-1 text-[15px] text-[#8D8D8D] dark:text-default-400">
            Aquí podrás realizar tu retiro
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
            {/* Cuenta SWIFT */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide">
                CUENTA SWIFT
              </label>
              <Input
                aria-label="Cuenta SWIFT"
                type="text"
                placeholder="Ingresa tu cuenta SWIFT"
                value={swift}
                onChange={(e) => setSwift(e.target.value)}
                variant="bordered"
                radius="lg"
                size="md"
              />
            </div>

            {/* Nombre de banco */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide">
                NOMBRE DE BANCO
              </label>
              <Input
                aria-label="Nombre de banco"
                type="text"
                placeholder="Nombre del banco"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                variant="bordered"
                radius="lg"
                size="md"
              />
            </div>

            {/* Número de cuenta */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide">
                NÚMERO DE CUENTA
              </label>
              <Input
                aria-label="Número de cuenta"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                variant="bordered"
                radius="lg"
                size="md"
              />
            </div>

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