import React, { useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";

export default function EditModal({
  isOpen,
  onOpenChange,
  order,
  actions,
  setActions,
  editDate,
  setEditDate,
  onSave,
}) {
  const updateAction = (index, key, value) => {
    setActions((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [key]: key === "name" ? value : Number(value) } : a))
    );
  };

  const removeAction = (index) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const canSave = useMemo(() => {
    if (!Array.isArray(actions) || actions.length === 0) return false;
    return actions.every(
      (a) =>
        String(a?.name || "").trim().length > 0 &&
        Number(a?.quantity) > 0 &&
        Number(a?.benefit) >= 0
    );
  }, [actions]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">Editar la orden #{order?.operationNumber ?? ""}</ModalHeader>
          <ModalBody>
            <div className="mb-3">
              <Input
                label="Fecha de operación"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                variant="bordered"
                radius="sm"
              />
            </div>

            <div className="space-y-2">
              {actions.length === 0 ? (
                <div className="text-sm text-default-500">No hay conceptos para esta orden.</div>
              ) : (
                actions.map((a, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div className="md:col-span-6">
                      <Input
                        label={`Nombre`}
                        value={a.name}
                        onChange={(e) => updateAction(i, "name", e.target.value)}
                        variant="bordered"
                        radius="sm"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        label="Cantidad"
                        type="number"
                        value={String(a.quantity ?? 0)}
                        onChange={(e) => updateAction(i, "quantity", e.target.value)}
                        variant="bordered"
                        radius="sm"
                        min={1}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        label="Precio"
                        type="number"
                        value={String(a.benefit ?? 0)}
                        onChange={(e) => updateAction(i, "benefit", e.target.value)}
                        variant="bordered"
                        radius="sm"
                        min={0}
                      />
                    </div>
                    <div className="md:col-span-12">
                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="flat"
                        color="danger"
                        onPress={() => removeAction(i)}
                        aria-label="Quitar concepto"
                        className="mt-1"
                        title="Quitar concepto"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button color="primary" className="bg-[#00689B]" onPress={onSave} isDisabled={!canSave}>
              Actualizar orden
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}