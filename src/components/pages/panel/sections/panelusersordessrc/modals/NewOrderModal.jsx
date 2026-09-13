import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function NewOrderModal({
  isOpen,
  onOpenChange,
  nextOrderNumber,
  actions,
  setName,
  setQty,
  setBenefit,
  name,
  qty,
  benefit,
  addItemByKind,
  removeAction,
  firstKind,
  KIND,
  formatCurrency,
  onSave,
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">Nueva orden #{nextOrderNumber}</ModalHeader>
          <ModalBody>
            <div className="mb-2">
              {actions.length === 0 ? null : (
                <ul className="list-disc pl-5 space-y-1">
                  {actions.map((a, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-sm">
                        <b>{a.name}</b>: {formatCurrency(a.benefit)} <span className="text-default-500">x{a.quantity}</span>
                      </span>
                      <button className="text-default-400 hover:text-danger-500" onClick={() => removeAction(i)} title="Quitar">
                        <Icon icon="mdi:trash-can-outline" width={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input label="Nombre" placeholder="Ingrese movimiento" value={name} onChange={(e) => setName(e.target.value)} variant="bordered" radius="sm" />
              <Input label="Cantidad" type="number" value={qty} onChange={(e) => setQty(e.target.value)} variant="bordered" radius="sm" />
              <Input label="Precio" type="number" value={benefit} onChange={(e) => setBenefit(e.target.value)} variant="bordered" radius="sm" />
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {(firstKind === null || firstKind === KIND.MOVEMENT) && (
                <Button className="bg-sky-400 text-white" startContent={<Icon icon="mdi:plus" width={18} />} onPress={() => addItemByKind(KIND.MOVEMENT)}>
                  Agregar movimiento
                </Button>
              )}
              {(firstKind === null || firstKind === KIND.CAPITAL) && (
                <Button className="bg-sky-400 text-white" startContent={<Icon icon="mdi:plus" width={18} />} onPress={() => addItemByKind(KIND.CAPITAL)}>
                  Agregar capital
                </Button>
              )}
              {(firstKind === null || firstKind === KIND.CAPITAL_WITHDRAWL) && (
                <Button className="bg-sky-400 text-white" startContent={<Icon icon="mdi:plus" width={18} />} onPress={() => addItemByKind(KIND.CAPITAL_WITHDRAWL)}>
                  Retirar de capital
                </Button>
              )}
              {(firstKind === null || firstKind === KIND.PROFIT_WITHDRAWL) && (
                <Button className="bg-sky-400 text-white" startContent={<Icon icon="mdi:plus" width={18} />} onPress={() => addItemByKind(KIND.PROFIT_WITHDRAWL)}>
                  Retirar de ganancia
                </Button>
              )}
            </div>

            {actions.length === 0 && <div className="text-sm text-default-500 mt-2">Sin movimientos agregados.</div>}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button color="primary" className="bg-[#00689B]" onPress={onSave} isDisabled={actions.length === 0}>
              Guardar
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}