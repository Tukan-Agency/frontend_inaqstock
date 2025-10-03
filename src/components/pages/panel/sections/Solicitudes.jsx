import React, { useMemo, useState } from "react";
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
} from "@heroui/react";
import { Icon } from "@iconify/react";

// Datos ficticios (similares al backend)
const MOCK_REQUESTS = [
  {
    id: "SOL-0001",
    name: "Cuenta Demostracion",
    type: "Retiro", // Retiro | Deposito
    iban: "11",
    bank: "pichincha",
    account: "12548545556752",
    amount: 100,
    currency: "USD",
    date: "2022-10-28",
    status: "En proceso", // Creado | En proceso | Finalizado | Rechazado
  },
  {
    id: "SOL-0002",
    name: "Lucia Fernanda Veloz",
    type: "Deposito",
    iban: "",
    bank: "Banco Pichincha",
    account: "",
    amount: 500,
    currency: "USD",
    date: "2022-11-17",
    status: "En proceso",
  },
  {
    id: "SOL-0003",
    name: "iris sanchez",
    type: "Retiro",
    iban: "54545",
    bank: "guayaquil",
    account: "454545454545",
    amount: 50,
    currency: "USD",
    date: "2022-11-25",
    status: "Creado",
  },
  {
    id: "SOL-0004",
    name: "iris sanchez",
    type: "Retiro",
    iban: "5452454",
    bank: "banco de credito",
    account: "548745874542",
    amount: 100,
    currency: "USD",
    date: "2023-01-05",
    status: "Creado",
  },
  {
    id: "SOL-0005",
    name: "Luis samuel Maradiaga guzman",
    type: "Retiro",
    iban: "BSALSVSS",
    bank: "Davivienda",
    account: "8540653664",
    amount: 200,
    currency: "USD",
    date: "2023-01-07",
    status: "Creado",
  },
  {
    id: "SOL-0006",
    name: "Richard Almachi",
    type: "Retiro",
    iban: "GUAYECEG105",
    bank: "BANCO GUAYAQUIL",
    account: "13338162",
    amount: 5,
    currency: "USD",
    date: "2022-11-10",
    status: "Creado",
  },
  {
    id: "SOL-0007",
    name: "fabian paredes",
    type: "Deposito",
    iban: "",
    bank: "Tarjeta de Crédito o Débito",
    account: "",
    amount: 100,
    currency: "USD",
    date: "2022-11-16",
    status: "Creado",
  },
  {
    id: "SOL-0008",
    name: "iris sanchez",
    type: "Retiro",
    iban: "6456565",
    bank: "pichincha",
    account: "545454855885",
    amount: 50,
    currency: "USD",
    date: "2022-12-14",
    status: "Creado",
  },
  {
    id: "SOL-0009",
    name: "Luis samuel Maradiaga guzman",
    type: "Retiro",
    iban: "BSALSVSS",
    bank: "DAVIVIENDA",
    account: "8540653664",
    amount: 100,
    currency: "USD",
    date: "2023-02-17",
    status: "Creado",
  },
];

function formatMoney(n, currency = "USD") {
  return Number(n || 0).toLocaleString("es-EC", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
function formatDateISO(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
  return "warning"; // creado u otros
}

export default function AdminSolicitudes() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(MOCK_REQUESTS);
  const [busy, setBusy] = useState({}); // { [id]: boolean }

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
        r.account,
        r.amount,
        r.currency,
        r.date,
        r.status,
      ]
        .filter(Boolean)
        .map((v) => normalize(v));
      return fields.some((f) => f.includes(q));
    });
  }, [rows, query]);

  // Simula llamada a backend para actualizar estado
  const updateStatus = async (id, newStatus) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      // TODO: sustituir por llamada real: await apiDataFetch(`/api/admin/requests/${id}/status`, "PUT", { status: newStatus })
      await new Promise((r) => setTimeout(r, 500));
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      addToast({
        title: "Estado actualizado",
        description: `La solicitud ${id} ahora está en "${newStatus}".`,
        color: newStatus === "Rechazado" ? "danger" : newStatus === "Finalizado" ? "success" : "primary",
        duration: 1800,
      });
    } catch (e) {
      addToast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
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

  const rightStatusLabel = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "creado") return "En proceso";
    if (s === "en proceso") return "En proceso";
    if (s === "finalizado") return "Finalizado";
    if (s === "rechazado") return "Rechazado";
    return "Estado";
  };

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6 space-y-4">
          {/* Breadcrumb simple */}
          <div className="text-sm text-default-500 flex items-center gap-2">
            <Icon icon="mdi:home-outline" width={18} />
            <span>Administrador</span>
            <Icon icon="mdi:chevron-right" width={16} />
            <span className="text-default-700 font-medium">Solicitudes</span>
          </div>

          {/* Buscador */}
          <div className="max-w-md">
            <Input
              placeholder="Buscar por nombre, tipo, banco, cuenta, estado, etc."
              startContent={<Icon icon="mdi:magnify" width={18} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="bordered"
              radius="lg"
              size="md"
            />
          </div>

          {/* Tabla principal */}
          <Table
            aria-label="Tabla de solicitudes"
            removeWrapper
            classNames={{
              table: "rounded-2xl",
              th: "text-[11px] font-semibold text-default-500 uppercase tracking-wide bg-transparent",
              tr: "hover:bg-default-50/60",
              td: "text-sm",
            }}
          >
            <TableHeader>
              <TableColumn>Nombre</TableColumn>
              <TableColumn>Tipo</TableColumn>
              <TableColumn>IBAN</TableColumn>
              <TableColumn>Banco</TableColumn>
              <TableColumn>Cuenta</TableColumn>
              <TableColumn className="text-right">Monto</TableColumn>
              <TableColumn>Fecha</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn className="text-center">Acciones</TableColumn>
              <TableColumn className="text-right">Estado</TableColumn>
            </TableHeader>

            <TableBody emptyContent="Aún no hay solicitudes para mostrar">
              {filtered.map((s) => {
                const statusLower = String(s.status || "").toLowerCase();
                const isCreado = statusLower === "creado";
                const isEnProceso = statusLower === "en proceso";
                const showProcessBtn = !isEnProceso; // Creado/Rechazado/Finalizado muestran botón "En proceso"
                const rowBusy = !!busy[s.id];

                return (
                  <TableRow key={s.id} className="border-b border-default-200">
                    <TableCell className="whitespace-pre-wrap">{s.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={s.type === "Deposito" ? "success" : "default"}
                        className="font-medium"
                        startContent={
                          <Icon
                            icon={
                              s.type === "Deposito"
                                ? "solar:card-bold-duotone"
                                : "solar:dollar-bold"
                            }
                            width={16}
                          />
                        }
                      >
                        {s.type}
                      </Chip>
                    </TableCell>
                    <TableCell>{s.iban || "—"}</TableCell>
                    <TableCell className="capitalize">{s.bank || "—"}</TableCell>
                    <TableCell>{s.account || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(s.amount, s.currency)}
                    </TableCell>
                    <TableCell>{formatDateISO(s.date)}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={statusChipColor(s.status)}
                        className="font-medium uppercase"
                      >
                        {String(s.status).toUpperCase()}
                      </Chip>
                    </TableCell>

                    {/* Acciones: solo cuando está En proceso */}
                    <TableCell>
                      <div className="flex items-center gap-2 justify-center">
                        {isEnProceso && (
                          <>
                            <Button
                              isIconOnly
                              size="sm"
                              radius="full"
                              variant="flat"
                              color="success"
                              onPress={() => approve(s.id)}
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
                              onPress={() => reject(s.id)}
                              isDisabled={rowBusy}
                              aria-label="Cancelar (Rechazar)"
                            >
                              <Icon icon="mdi:close-thick" width={18} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* Botón azul a la derecha: "En proceso" cuando NO está En proceso */}
                    <TableCell className="text-right">
                      {showProcessBtn ? (
                        <Button
                          size="sm"
                          className="rounded-md"
                          color="primary"
                          variant="flat"
                          onPress={() => startProcess(s.id)}
                          isDisabled={rowBusy}
                          endContent={<Icon icon="mdi:information-outline" width={18} />}
                        >
                          {rightStatusLabel(s.status)}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}