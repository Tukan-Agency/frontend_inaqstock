import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  addToast,
  Pagination,
  Skeleton,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { adminRequestsService } from "../../../services/adminRequests.service.js";

function formatDateISO(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}
function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
function statusChipColor(status) {
  const s = String(status || "").toLowerCase();
  if (s === "finalizado") return "success";
  if (s === "rechazado") return "danger";
  if (s === "en proceso") return "primary";
  return "warning";
}
function rightStatusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "creado") return "En proceso";
  if (s === "en proceso") return "En proceso";
  if (s === "finalizado") return "Finalizado";
  if (s === "rechazado") return "Rechazado";
  return "Estado";
}
const STATUS_ORDER = { "En proceso": 0, Creado: 1, Finalizado: 2, Rechazado: 3 };

// Fallback seguro para mostrar cuenta
function accountToText(v, fallback = "—") {
  if (v === null || v === undefined || v === "") return fallback;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v?.toString === "function") {
    const s = v.toString();
    return s === "[object Object]" ? fallback : s;
  }
  try {
    return JSON.stringify(v);
  } catch {
    return fallback;
  }
}

// Texto abreviado con “...”
function ellipsize(text = "", max = 12) {
  const s = String(text);
  if (s.length <= max) return s;
  return `${s.slice(0, max)}...`;
}

export default function AdminSolicitudes() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Ordenamiento: por defecto Fecha DESC (más recientes primero)
  const [sortDescriptor, setSortDescriptor] = useState({ column: "date", direction: "descending" });

  // Paginación client-side
  const [page, setPage] = useState(1);
  const perPage = 50;

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const { list } = await adminRequestsService.getAll(); // trae todos
        if (cancel) return;

        const normalized = (list || []).map((r) => ({
          id: r._id || r.id,
          name: r.clientName,
          type: r.requestType,
          iban: r.ibanAccount,
          bank: r.bankName,
          accountRaw: r.numberAccountText ?? r.numberAccount,
          amount: r.requestedValue,
          date: r.requestDate,
          status: r.requestStatus,
          _raw: r,
        }));

        setRows(normalized);
        setPage(1);
      } catch (e) {
        addToast({
          title: "Error al cargar",
          description: e?.message || "No se pudieron cargar las solicitudes.",
          color: "danger",
          duration: 2800,
        });
      } finally {
        if (!cancel) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancel = true;
    };
  }, []);

  // Filtro por texto
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return rows;
    return rows.filter((r) => {
      const fields = [
        r.id,
        r.name,
        r.type,
        r.iban,
        r.bank,
        accountToText(r.accountRaw, ""),
        r.amount,
        r.date,
        r.status,
      ]
        .filter(Boolean)
        .map((v) => normalize(v));
      return fields.some((f) => f.includes(q));
    });
  }, [rows, query]);

  // Valor comparable por columna para ordenar
  const getComparable = (row, columnKey) => {
    switch (columnKey) {
      case "name":
        return String(row.name ?? "");
      case "type":
        return String(row.type ?? "");
      case "iban":
        return String(row.iban ?? "");
      case "bank":
        return String(row.bank ?? "");
      case "account":
        return accountToText(row.accountRaw, "");
      case "amount":
        return Number(row.amount ?? 0);
      case "date":
        return new Date(row.date).getTime() || 0;
      case "status":
        return STATUS_ORDER[row.status] ?? 99;
      default:
        return "";
    }
  };

  // Ordenamiento controlado por HeroUI (sortDescriptor)
  const sorted = useMemo(() => {
    const data = filtered.slice();
    const { column, direction } = sortDescriptor || {};
    if (!column) return data;

    data.sort((a, b) => {
      const av = getComparable(a, column);
      const bv = getComparable(b, column);

      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else if (typeof av === "string" && typeof bv === "string") {
        cmp = av.localeCompare(bv, "es", { sensitivity: "base", numeric: true });
      } else {
        cmp = String(av).localeCompare(String(bv), "es", { sensitivity: "base", numeric: true });
      }

      return direction === "descending" ? -cmp : cmp;
    });

    return data;
  }, [filtered, sortDescriptor]);

  // Paginación client-side después del ordenamiento
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, page]);

  const updateStatus = async (id, newStatus) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await adminRequestsService.updateStatus(id, newStatus);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      addToast({
        title: "Estado actualizado",
        description: `La solicitud ${id} ahora está en "${newStatus}".`,
        color: newStatus === "Rechazado" ? "danger" : "Finalizado" ? "success" : "primary",
        duration: 1800,
      });
    } catch (e) {
      addToast({
        title: "Error",
        description: e?.message || "No se pudo actualizar el estado.",
        color: "danger",
        duration: 2200,
      });
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const startProcess = (id) => updateStatus(id, "En proceso");
  const approve = (id) => updateStatus(id, "Finalizado");
  const reject = (id) => updateStatus(id, "Rechazado");

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6 space-y-4">
          <div className="text-sm text-default-500 flex items-center gap-2">
            <Icon icon="mdi:home-outline" width={18} />
            <span>Administrador</span>
            <Icon icon="mdi:chevron-right" width={16} />
            <span className="text-default-700 font-medium">Solicitudes</span>
          </div>

          <div className="max-w-md">
            <Input
              placeholder="Buscar por nombre, tipo, banco, cuenta, estado, etc."
              startContent={<Icon icon="mdi:magnify" width={18} />}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              variant="bordered"
              radius="lg"
              size="md"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3 mt-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table
              aria-label="Tabla de solicitudes"
              removeWrapper
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
              classNames={{
                table: "rounded-2xl",
                th: "text-[11px] font-semibold text-default-500 uppercase tracking-wide bg-transparent",
                tr: "hover:bg-default-50/60",
                td: "text-sm",
              }}
              bottomContent={
                totalPages > 1 ? (
                  <div className="flex w-full justify-center p-2">
                    <Pagination
                      page={page}
                      total={totalPages}
                      onChange={setPage}
                      showControls
                      isCompact
                      color="primary"
                    />
                  </div>
                ) : null
              }
            >
              <TableHeader>
                <TableColumn key="name" allowsSorting className="min-w-[260px] w-[30%]">
                  Nombre
                </TableColumn>
                <TableColumn key="type" allowsSorting className="w-[120px]">
                  Tipo
                </TableColumn>
                <TableColumn key="iban" allowsSorting className="w-[140px]">
                  IBAN
                </TableColumn>
                <TableColumn key="bank" allowsSorting className="min-w-[200px] w-[22%]">
                  Banco
                </TableColumn>
                <TableColumn key="account" allowsSorting className="w-[160px]">
                  Cuenta
                </TableColumn>
                <TableColumn key="amount" allowsSorting className="w-[110px] text-right">
                  Monto
                </TableColumn>
                <TableColumn key="date" allowsSorting className="w-[120px]">
                  Fecha
                </TableColumn>
                <TableColumn key="status" allowsSorting className="w-[130px]">
                  Estado
                </TableColumn>
                <TableColumn key="actions" className="w-[130px] text-center">
                  Acciones
                </TableColumn>
                <TableColumn key="statusBtn" className="w-[140px] text-right">
                  Estado
                </TableColumn>
              </TableHeader>

              <TableBody emptyContent="Aún no hay solicitudes para mostrar">
                {paged.map((row) => {
                  const statusLower = String(row.status || "").toLowerCase();
                  const isEnProceso = statusLower === "en proceso";
                  const showProcessBtn = !isEnProceso;
                  const rowBusy = !!busy[row.id];

                  const accountDisplay = accountToText(row.accountRaw, "—");
                  const hasIban = !!row.iban;

                  return (
                    <TableRow key={row.id} className="border-b border-default-200">
                      <TableCell className="whitespace-pre-wrap text-[15px] leading-6 min-w-[260px] w-[30%] pr-4">
                        {row.name}
                      </TableCell>

                      <TableCell className="w-[120px]">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={row.type === "Deposito" ? "success" : "danger"} // Retiro en rojo
                          className="font-medium"
                          startContent={
                            <Icon
                              icon={row.type === "Deposito" ? "solar:card-bold-duotone" : "solar:dollar-bold"}
                              width={16}
                            />
                          }
                        >
                          {row.type}
                        </Chip>
                      </TableCell>

                      <TableCell className="w-[140px]">
                        {hasIban ? (
                          <Tooltip content={row.iban} placement="top" closeDelay={0}>
                            <span className="inline-block max-w-[120px] truncate align-middle">
                              {ellipsize(row.iban, 12)}
                            </span>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell className="capitalize min-w-[200px] w-[22%]">{row.bank || "—"}</TableCell>
                      <TableCell className="w-[160px]">{accountDisplay}</TableCell>
                      <TableCell className="text-right w-[110px]">{String(row.amount ?? "")}</TableCell>
                      <TableCell className="w-[120px]">{formatDateISO(row.date)}</TableCell>

                      <TableCell className="w-[130px]">
                        <Chip size="sm" variant="flat" color={statusChipColor(row.status)} className="font-medium uppercase">
                          {String(row.status).toUpperCase()}
                        </Chip>
                      </TableCell>

                      <TableCell className="w-[130px]">
                        <div className="flex items-center gap-2 justify-center">
                          {isEnProceso && (
                            <>
                              <Button
                                isIconOnly
                                size="sm"
                                radius="full"
                                variant="flat"
                                color="success"
                                onPress={() => approve(row.id)}
                                isDisabled={rowBusy}
                                aria-label="Listo (Finalizar)"
                              >
                                <Icon icon="mdi:check-bold" width={18} />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                radius="full"
                                variant="flat"
                                color="secondary"
                                className="bg-pink-500/30 text-pink-700 dark:text-pink-300"
                                onPress={() => reject(row.id)}
                                isDisabled={rowBusy}
                                aria-label="Cancelar (Rechazar)"
                              >
                                <Icon icon="mdi:close-thick" width={18} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right w-[140px]">
                        {showProcessBtn ? (
                          <Button
                            size="sm"
                            className="rounded-md"
                            color="primary"
                            variant="flat"
                            onPress={() => startProcess(row.id)}
                            isDisabled={rowBusy}
                            endContent={<Icon icon="mdi:information-outline" width={18} />}
                          >
                            {rightStatusLabel(row.status)}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}