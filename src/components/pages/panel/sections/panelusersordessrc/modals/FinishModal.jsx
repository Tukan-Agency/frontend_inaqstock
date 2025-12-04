import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";

export default function FinishModal({
  isOpen,
  onOpenChange,
  order,
  gain,
  loss,
  setGain,
  setLoss,
  onSave,
  maxLoss,
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" scrollBehavior="inside">
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">Finalizar Orden #{order?.operationNumber ?? ""}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-3">
              <Input
                label="Ganancia"
                type="number"
                value={String(gain || "")}
                onChange={(e) => setGain(e.target.value)}
                placeholder="USD"
                variant="bordered"
                radius="sm"
              />
              <Input
                label={`Pérdida (≤ ${maxLoss})`}
                type="number"
                value={String(loss || "")}
                onChange={(e) => setLoss(e.target.value)}
                placeholder="USD"
                variant="bordered"
                radius="sm"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button color="primary" className="bg-[#00689B]" onPress={onSave}>
              Guardar
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}