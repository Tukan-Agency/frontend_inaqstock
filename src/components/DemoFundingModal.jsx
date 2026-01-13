import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Input, useDisclosure } from "@heroui/react";
import { useAccountMode } from "../context/AccountModeContext";
import { useBalance } from "../context/BalanceContext";
import axios from "axios";

export default function DemoFundingModal() {
  const { mode } = useAccountMode();
  const { refresh } = useBalance();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ CORRECCIÓN 1: Evitar doble apertura
  useEffect(() => {
    const handleOpen = (event) => {
      if (mode === "demo") {
        // Detiene la propagación para que si hay otro componente igual escuchando, no se entere
        if (event && typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        onOpen();
      }
    };
    
    window.addEventListener("open-demo-funding", handleOpen);
    return () => window.removeEventListener("open-demo-funding", handleOpen);
  }, [mode, onOpen]);

  const handleFund = async (amount) => {
    setIsProcessing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.post(
        `${apiUrl}/api/demo/reset`, 
        { amount }, 
        { withCredentials: true }
      );
      await refresh(); 
      onClose();
    } catch (e) {
      console.error("Error recargando saldo demo:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const options = [100, 1500, 100000];

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      isDismissable={true}
      hideCloseButton={false}
      backdrop="blur"
      size="lg"
      // ✅ CORRECCIÓN 2: Accesibilidad al Modal
      aria-label="Recargar saldo de cuenta demo"
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-center pt-10">
              <h2 className="text-2xl font-bold">Recarga tu Cuenta Demo 🚀</h2>
              <span className="text-sm font-normal text-default-500">
                Te has quedado sin fondos ficticios. Elige un monto para seguir practicando.
              </span>
            </ModalHeader>
            <ModalBody className="pb-10">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {options.map((opt) => (
                  <Button 
                    key={opt} 
                    className="h-24 text-xl border-2 font-semibold" 
                    variant="bordered"
                    onPress={() => handleFund(opt)}
                    isLoading={isProcessing}
                    aria-label={`Recargar ${opt} dólares`} // Accesibilidad botones
                  >
                    ${opt.toLocaleString()}
                  </Button>
                ))}
                
                <Button 
                  className={`h-24 text-xl border-2 font-semibold ${showCustom ? "border-primary text-primary" : ""}`}
                  variant={showCustom ? "flat" : "bordered"}
                  onPress={() => setShowCustom(true)}
                  aria-label="Ingresar monto personalizado"
                >
                  Personalizado
                </Button>
              </div>

              {showCustom && (
                <div className="flex gap-2 animate-appearance-in">
                  <Input 
                    type="number" 
                    label="Monto Personalizado" 
                    placeholder="Ej: 5000" 
                    value={customAmount} 
                    onValueChange={setCustomAmount}
                    size="lg"
                    startContent={<span className="text-default-400">$</span>}
                    // ✅ CORRECCIÓN 3: Accesibilidad Input
                    aria-label="Campo para monto personalizado"
                  />
                  <Button 
                    color="primary" 
                    className="h-full px-8 font-semibold"
                    size="lg"
                    onPress={() => handleFund(Number(customAmount))}
                    isLoading={isProcessing}
                    isDisabled={!customAmount || Number(customAmount) <= 0}
                    aria-label="Confirmar recarga personalizada"
                  >
                    Confirmar
                  </Button>
                </div>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}