import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import { useSession } from "../hooks/use-session.jsx";
import { changeMyPassword } from "./services/account.js";

export default function ForcePasswordChangeModal() {
  const { session, getUser } = useSession();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const mustChangePassword = Boolean(
    session?.user?.mustChangePassword ?? session?.user?.user?.mustChangePassword
  );
  const passwordError =
    password.length > 0 && (password.length < 8 || !/\d/.test(password))
      ? "Mínimo 8 caracteres y al menos un número"
      : "";
  const confirmationError =
    confirmation.length > 0 && password !== confirmation
      ? "Las contraseñas no coinciden"
      : "";
  const canSubmit =
    password.length >= 8 &&
    /\d/.test(password) &&
    password === confirmation &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      await changeMyPassword(password);
      await getUser();
      setPassword("");
      setConfirmation("");
      addToast({
        title: "Contraseña actualizada",
        description: "Ya puedes continuar usando tu cuenta.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "No se pudo cambiar la contraseña",
        description:
          error?.response?.data?.message || error?.message || "Intenta nuevamente.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={mustChangePassword}
      isDismissable={false}
      isKeyboardDismissDisabled
      hideCloseButton
      backdrop="blur"
      size="md"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Cambia tu contraseña</h2>
          <p className="text-sm font-normal text-default-500">
            Por seguridad debes establecer una contraseña nueva antes de continuar.
          </p>
        </ModalHeader>
        <ModalBody>
          <Input
            type="password"
            label="Nueva contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            variant="bordered"
            autoComplete="new-password"
            isInvalid={Boolean(passwordError)}
            errorMessage={passwordError}
            startContent={<Icon icon="mdi:lock-outline" width={18} />}
          />
          <Input
            type="password"
            label="Confirmar contraseña"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            variant="bordered"
            autoComplete="new-password"
            isInvalid={Boolean(confirmationError)}
            errorMessage={confirmationError}
            startContent={<Icon icon="mdi:lock-check-outline" width={18} />}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!canSubmit}
            isLoading={loading}
            className="w-full"
          >
            Guardar nueva contraseña
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
