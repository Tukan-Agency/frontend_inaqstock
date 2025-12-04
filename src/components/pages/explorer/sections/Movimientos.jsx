import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { listUserMovements } from "../../../services/movements.service";
import { useSession } from "../../../../hooks/use-session";
import { useAccountMode } from "../../../../context/AccountModeContext"; // ✅ IMPORTAR CONTEXTO

export default function Movimientos() {
  const { session } = useSession();
  const { mode } = useAccountMode(); // ✅ OBTENER MODO

  // Toma el id del usuario de la sesión (ajusta si tu sesión usa otra clave)
  const clientId = useMemo(
    () =>
      session?.user?.clientId ||
      session?.user?.id ||
      session?.user?._id ||
      session?.user?.uid ||
      null,
    [session]
  );
  console.log("clientId", clientId);
  
  // Loader con tiempo base
  const BASE_DELAY_MS = 300;
  const [isLoading, setIsLoading] = useState(true);
  const [movs, setMovs] = useState([]);
  const [error, setError] = useState(null);

  // Carga real desde API
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const minDelay = new Promise((res) => setTimeout(res, BASE_DELAY_MS));

        if (!clientId) {
          await minDelay;
          if (!cancelled) {
            setMovs([]);
            setIsLoading(false);
          }
          return;
        }

        const [items] = await Promise.all([
          listUserMovements({ clientId, mode }), // ✅ PASAR MODO AL SERVICIO
          minDelay,
        ]);

        // Normalización defensiva (mapea distintos nombres de campos posibles)
        const normalized = (items || []).map((m, idx) => {
          const dateIso = m.requestDate || m.date || m.createdAt || null;

          const rawAmount = m.value ?? m.amount ?? 0;

          const isWithdraw =
            (typeof m.type === "string" &&
              m.type.toLowerCase().includes("retiro")) ||
            m.isWithdrawl === true ||
            m.isWithdrawal === true;

          return {
            id: m._id || m.id || idx,
            name: m.clientName || m.name || "—",
            type: isWithdraw ? "withdraw" : "deposit",
            date: dateIso ? new Date(dateIso) : null,
            amount:
              Number(String(rawAmount).replace(/\./g, "").replace(",", ".")) ||
              0,
            _raw: m,
          };
        });

        if (!cancelled) setMovs(normalized);
      } catch (e) {
        console.error("Error cargando movimientos:", e);
        if (!cancelled)
          setError(
            e?.response?.data?.msg || e.message || "Error al cargar movimientos"
          );
        if (!cancelled) setMovs([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [clientId, mode]); // ✅ AGREGAR mode A DEPENDENCIAS

  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

  const rows = useMemo(() => {
    return [...movs]
      .sort((a, b) => {
        const da = a.date ? a.date.getTime() : 0;
        const db = b.date ? b.date.getTime() : 0;
        return db - da;
      })
      .map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type, // deposit | withdraw
        date: m.date ? m.date.toLocaleDateString("es-EC") : "—",
        amount: m.amount,
      }));
  }, [movs]);

  // Skeletons durante la carga
  if (isLoading) {
    return (
      <div className="p-6">
        {/* Título skeleton */}
        <Skeleton className="h-5 w-28 rounded-md mb-3" />

        {/* Card de tabla skeleton */}
        <Card className="border border-default-200 rounded-2xl">
          <CardBody className="p-4 space-y-4">
            {/* Header de tabla */}
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full rounded-md" />
              ))}
            </div>

            {/* Filas skeleton */}
            <div className="space-y-3">
              {Array.from({ length: 15 }).map((_, row) => (
                <div key={row} className="grid grid-cols-4 gap-4">
                  <Skeleton className="h-5 w-full rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-5 w-28 rounded-md" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-base font-medium text-default-700 mb-3">
        Movimientos
      </h3>

      <Card className="border border-default-200 rounded-2xl">
        <CardBody className="p-0">
          <Table
            aria-label="Tabla de movimientos"
            removeWrapper
            classNames={{
              table: "rounded-2xl",
              th: "text-[11px] font-semibold text-default-500 uppercase tracking-wide bg-default-100",
              tr: "hover:bg-default-50/60",
              td: "text-sm",
            }}
          >
            <TableHeader>
              <TableColumn>Nombre</TableColumn>
              <TableColumn>Tipo</TableColumn>
              <TableColumn>Fecha</TableColumn>
              <TableColumn className="text-right">Monto</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                error ? `Error: ${error}` : "No hay movimientos para mostrar"
              }
            >
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    {r.type === "deposit" ? (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="success"
                        className="font-medium"
                        startContent={
                          <Icon icon="solar:card-bold-duotone" width={16} />
                        }
                      >
                        Depósito
                      </Chip>
                    ) : (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="danger"
                        className="font-medium"
                        startContent={
                          <Icon icon="solar:dollar-bold" width={16} />
                        }
                      >
                        Retiro
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}