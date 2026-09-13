import React, { useState } from "react";
import { Button, Input, Card, CardBody, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
// Reutiliza tu hook de sesión (ya usado en otras pantallas)
import { useSession } from "../../../../hooks/use-session.jsx";
import { requestsService } from "../../../services/requests.service.js";
 

export default function Retiro() {
  const navigate = useNavigate();
  const { session } = useSession();
 
  // Tomar clientId y clientName desde la sesión (ajusta si tus campos difieren)
  const clientId =
    session?.user?.clientId ||
    session?.user?.id ||
    session?.user?._id ||
    session?.user?.uid ||
    "";
  const clientName =
    session?.user?.name ||
    session?.user?.fullName ||
    session?.user?.displayName ||
    session?.user?.email?.split("@")[0] ||
    "Usuario";

  const [swift, setSwift] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState(""); // usamos string, convertimos al enviar
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    swift.trim() !== "" &&
    bankName.trim() !== "" &&
    accountNumber.trim() !== "" &&
    Number(amount) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    // Validación extra de sesión
    if (!clientId) {
      addToast({
        title: "Sesión requerida",
        description: "No pudimos identificar tu usuario. Inicia sesión nuevamente.",
        color: "warning",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Mapear “CUENTA SWIFT” -> ibanAccount (legacy)
      // numberAccount opcional; convertimos a Number si aplica
      const numberAccountValue =
        accountNumber.trim() === "" ? null : Number(accountNumber);

      await requestsService.createWithdraw({
        clientId,
        clientName,
        ibanAccount: swift,
        bankName,
        numberAccount: Number.isFinite(numberAccountValue) ? numberAccountValue : null,
        requestedValue: Number(amount),
      });

      addToast({
        title: "Solicitud enviada",
        description: "Tu solicitud de retiro ha sido enviada correctamente.",
        color: "success",
        duration: 2400,
      });

      setTimeout(() => {
        navigate("/explorar");
      }, 2400);
    } catch (err) {
      addToast({
        title: "Error",
        description: err?.message || "No se pudo enviar la solicitud de retiro.",
        color: "danger",
        duration: 3200,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl max-w-xl m-auto">
        <CardBody className="px-2 sm:px-6 py-4">
          <h1 className="text-2xl font-semibold tracking-wide">Retiro</h1>
          <p className="mt-1 text-[15px] text-[#8D8D8D] dark:text-default-400">Aquí podrás realizar tu retiro</p>

          {/* Tile visual de Banco */}
          <div className="mt-6">
            <div className="inline-flex flex-col items-center gap-2 rounded-2xl border border-[#7fb1c9] px-5 py-4 w-[116px]">
              <div className="w-14 h-14 rounded-md flex items-center justify-center bg-[#e6f0f5]">
                <Icon icon="mdi:bank" width={28} color="#277fa0" />
              </div>
              <span className="text-[15px] font-medium text-[#00689B]">Banco</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Cuenta SWIFT -> ibanAccount */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide">CUENTA SWIFT</label>
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
              <label className="text-sm font-semibold tracking-wide">NOMBRE DE BANCO</label>
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

            {/* Número de cuenta (string para no perder ceros; convertimos al enviar) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide">NÚMERO DE CUENTA</label>
              <Input
                aria-label="Número de cuenta"
                type="text"
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
              <label className="text-sm font-semibold tracking-wide">MONTO SOLICITADO</label>
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