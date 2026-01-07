import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function OrdersTable({
  columns,
  rows,
  formatCurrency,
  onOpenDetails,
  onOpenEdit,
  onDelete,
  onFinalize,
  onCancel,
}) {
  
  // Función auxiliar para sumar acciones de capital si existen
  const sumActionsCapital = (ops = []) =>
    (ops || []).reduce(
      (acc, a) => acc + Number(a?.benefit || 0) * Number(a?.quantity || 0),
      0
    );

  return (
    <div className="mt-2">
      <Table
        aria-label="Órdenes del usuario"
        removeWrapper
        classNames={{
          table: "rounded-2xl",
          th: "text-[11px] font-semibold text-default-500 uppercase tracking-wide bg-transparent",
          tr: "hover:bg-default-50/60",
          td: "text-sm",
        }}
      >
        <TableHeader columns={columns}>
          {(c) => <TableColumn key={c.key} className={["capital","ganancia","perdida","retiros"].includes(c.key) ? "text-right" : ""}>{c.label}</TableColumn>}
        </TableHeader>
        <TableBody emptyContent="Este usuario no tiene órdenes">
          {rows.map((row) => {
            const o = row.original;
            const finalized = (o.status || "").toLowerCase() === "finalizado";
            const canceled = (o.status || "").toLowerCase() === "cancelado";
            const canUpdate = !finalized && !canceled;

            // --- LÓGICA DE REPARACIÓN DE DATOS ---
            const actionsTotal = sumActionsCapital(o.operationActions);
            const val = Number(o.operationValue || 0);
            const isCapital = o.isCapital === true;
            // Normalizar nombre de propiedad withdrawal/withdrawl
            const isWithdrawalRaw = o.isWithdrawl === true || o.isWithdrawal === true; 
            const hasActions = actionsTotal !== 0;

            let finalCapital = 0;
            let finalRetiros = 0;
            let finalGanancia = 0;
            let finalPerdida = 0;

            if (isCapital && !isWithdrawalRaw) {
                // Depósito
                finalCapital = hasActions ? actionsTotal : val;
            } else if (isWithdrawalRaw && hasActions) {
                // Retiro real (administrativo con desglose)
                finalRetiros = actionsTotal;
            } else {
                // Trading (incluye pérdidas mal marcadas como retiros)
                if (val >= 0) {
                    finalGanancia = val;
                } else {
                    finalPerdida = Math.abs(val); // Valor absoluto para columna Pérdida
                }
            }
            // -------------------------------------

            return (
              <TableRow key={row.id}>
                <TableCell>{row.operacion}</TableCell>
                <TableCell>{row.fecha}</TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={finalized ? "success" : canceled ? "danger" : "primary"}
                    className="font-medium uppercase"
                    startContent={<Icon icon="mdi:information-outline" width={16} />}
                  >
                    {o.status || "En progreso"}
                  </Chip>
                </TableCell>
                
                {/* Usamos los valores recalculados (final...) en lugar de los row... */}
                <TableCell className="text-right">
                  {formatCurrency(finalCapital)}
                </TableCell>
                
                {/* Ganancia: Verde si > 0 */}
                <TableCell className={`text-right ${finalGanancia > 0 ? "text-success-600 font-bold" : ""}`}>
                  {formatCurrency(finalGanancia)}
                </TableCell>
                
                {/* Pérdida: Rojo si > 0 */}
                <TableCell className={`text-right ${finalPerdida > 0 ? "text-danger-600 font-bold" : ""}`}>
                  {formatCurrency(finalPerdida)}
                </TableCell>
                
                <TableCell className="text-right">
                  {formatCurrency(finalRetiros)}
                </TableCell>

                <TableCell>
                  <Button isIconOnly radius="full" size="sm" variant="flat" color="success" onPress={() => onOpenDetails(o)} aria-label="Ver más">
                    <Icon icon="mdi:eye-outline" width={18} />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    isIconOnly
                    radius="full"
                    size="sm"
                    variant="flat"
                    color="warning"
                    onPress={() => onOpenEdit(o)}
                    aria-label="Editar"
                    isDisabled={finalized || canceled}
                  >
                    <Icon icon="mdi:pencil" width={18} />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button isIconOnly radius="full" size="sm" variant="flat" color="secondary" onPress={() => onDelete(o)} aria-label="Eliminar">
                    <Icon icon="mdi:close-circle-outline" width={18} />
                  </Button>
                </TableCell>
                <TableCell>
                  {canUpdate ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" radius="sm" color="success" variant="flat" onPress={() => onFinalize(o)}>
                        Finalizar
                      </Button>
                      <Button size="sm" radius="sm" color="danger" variant="flat" onPress={() => onCancel(o)}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="text-default-400 text-xs text-right">N/A</div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}