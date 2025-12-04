import React from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button
} from "@heroui/react";
import { Icon } from "@iconify/react";

function toNum(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim();
  // Soporta "111,00", "$111.00", "1.234,56"
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // Asumimos formato es-ES: 1.234,56 -> quitar separadores de miles y usar punto decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // Reemplaza coma decimal por punto y quita símbolos
    s = s.replace(",", ".");
  }
  s = s.replace(/[^0-9.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function calcItemsTotal(actions = []) {
  return actions.reduce((acc, a) => {
    const qty = toNum(a?.quantity);
    const price = toNum(a?.benefit ?? a?.price ?? a?.amount ?? 0);
    return acc + price * qty;
  }, 0);
}

export default function DetailsModal({ isOpen, onOpenChange, order, formatCurrency, formatDate, sumActionsCapital }) {
  const actions = order?.operationActions || [];

  // Usa la suma local por defecto; si te pasan sumActionsCapital como prop, úsalo:
  const itemsTotal = typeof sumActionsCapital === "function"
    ? sumActionsCapital(actions)
    : calcItemsTotal(actions);

  // Si hay acciones, el total es la suma de acciones; si no, cae a operationValue
  const finalTotal = actions.length > 0
    ? itemsTotal
    : toNum(order?.operationValue || 0);

  const currencyLabel = (order?.currency?.name || "USD").toUpperCase();

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Detalles de la orden</ModalHeader>
            <ModalBody>
              {order ? (
                <div className="space-y-4">
                  <p className="text-sm text-default-700">
                    La operación <strong>#{order.operationNumber ?? ""}</strong> se realizó el{" "}
                    <Chip size="sm" variant="flat" color="primary" className="mx-1">
                      {formatDate(order.operationDate)}
                    </Chip>
                    y está{" "}
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        (order.status || "").toLowerCase() === "finalizado"
                          ? "success"
                          : (order.status || "").toLowerCase() === "cancelado"
                          ? "danger"
                          : "primary"
                      }
                      className="mx-1"
                    >
                      {(order.status || "").toUpperCase()}
                    </Chip>
                    .
                  </p>

                  <Table aria-label="Detalle de conceptos" removeWrapper>
                    <TableHeader>
                      <TableColumn>CUENTA</TableColumn>
                      <TableColumn className="text-right">TOTAL</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {actions.map((a, i) => {
                        const qty = toNum(a?.quantity);
                        const price = toNum(a?.benefit ?? a?.price ?? a?.amount ?? 0);
                        const itemTotal = price * qty;
                        return (
                          <TableRow key={`${a._id || i}`}>
                            <TableCell>
                              <div className="flex items-center gap-2 text-default-600">
                                <Icon icon="mdi:card-account-details-outline" width={18} />
                                <span>
                                  {a.name} x{qty}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(itemTotal)}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2 text-default-800 font-medium">
                            <Icon icon="mdi:currency-usd" width={18} />
                            <span>Total</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(finalTotal)} {currencyLabel}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-sm text-default-500">Sin datos de la orden.</div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cerrar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}