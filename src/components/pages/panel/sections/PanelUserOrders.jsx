import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Chart from "react-apexcharts";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listUserOrders } from "../../../services/orders.service";

// Modal "Nueva orden": tipos permitidos
const KIND = {
  MOVEMENT: "movement",
  CAPITAL: "capital",
  CAPITAL_WITHDRAWL: "capitalWithdrawl",
  PROFIT_WITHDRAWL: "profitWithdrawl",
};

export default function PanelUserOrders() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const userFromState = location.state?.user || null;

  const [ordersLike, setOrdersLike] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Nueva orden: inputs + lista
  const [accionistaName, setAccionistaName] = useState("");
  const [accionistaQty, setAccionistaQty] = useState("");
  const [accionistaBenefit, setAccionistaBenefit] = useState("");
  const [newActions, setNewActions] = useState([]);
  // firstKind es el TIPO elegido al primer click, y bloquea el resto.
  const [firstKind, setFirstKind] = useState(null);

  // Editar orden
  const [editActions, setEditActions] = useState([]);
  const [editDate, setEditDate] = useState("");

  // Cargar órdenes por usuario (admin)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const ordenes = await listUserOrders({ clientId: userId }).catch(() => []);
        const normalized = (ordenes || []).map((o, idx) => ({
          id: o._id || o.id || idx,
          code: `#${o.operationNumber ?? ""}`,
          operationNumber: o.operationNumber ?? idx + 1001,
          operationDate: o.operationDate || new Date().toISOString(),
          operationValue: Number(o.operationValue || 0),
          status: o.operationStatus || o.status || "En progreso",
          isCapital: Boolean(o.isCapital),
          isWithdrawl: Boolean(o.isWithdrawl),
          operationActions: Array.isArray(o.operationActions) ? o.operationActions : [],
          clientId: o.clientId || userId,
          _raw: o,
        }));
        if (!cancelled) setOrdersLike(normalized);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (userId) load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const userFullName = useMemo(() => {
    if (!userFromState) return `Usuario ${userId}`;
    const n = [userFromState.name, userFromState.surname].filter(Boolean).join(" ");
    return n || `Usuario ${userId}`;
  }, [userFromState, userId]);

  // Helpers de formato
  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });

  const sumActionsCapital = (ops = []) =>
    (ops || []).reduce((acc, a) => acc + Number(a?.benefit || 0) * Number(a?.quantity || 0), 0);

  // Filas tabla
  const columns = [
    { key: "operacion", label: "Operación" },
    { key: "fecha", label: "Fecha" },
    { key: "estado", label: "Estado" },
    { key: "capital", label: "$ Capital" },
    { key: "ganancia", label: "$ Ganancia" },
    { key: "perdida", label: "$ Pérdida" },
    { key: "retiros", label: "$ Retiros" },
    { key: "more", label: "Ver Más" },
    { key: "edit", label: "Editar" },
    { key: "delete", label: "Eliminar" },
    { key: "update", label: "Actualizar estado" },
  ];

  const tableRows = useMemo(() => {
    return ordersLike
      .slice()
      .sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
      .map((o, idx) => {
        const actionsTotal = sumActionsCapital(o.operationActions);
        const capital = o.isCapital && !o.isWithdrawl ? actionsTotal : 0;
        const retiros = o.isWithdrawl ? actionsTotal : 0;
        const ganancia = !o.isWithdrawl && o.operationValue > 0 ? o.operationValue : 0;
        const perdida = !o.isWithdrawl && o.operationValue < 0 ? Math.abs(o.operationValue) : 0;
        return {
          id: o.id || idx,
          operacion: o.code || `#${idx + 1}`,
          fecha: new Date(o.operationDate).toLocaleDateString("es-EC"),
          estado: o.status || "En progreso",
          capital,
          ganancia,
          perdida,
          retiros,
          original: o,
        };
      });
  }, [ordersLike]);

  // Gráfico simple (total por mes)
  const monthly = useMemo(() => {
    const m = Array.from({ length: 12 }, () => 0);
    ordersLike.forEach((o) => {
      const d = new Date(o.operationDate);
      const total = (o.isCapital ? sumActionsCapital(o.operationActions) : 0) + Number(o.operationValue || 0);
      m[d.getMonth()] += total;
    });
    return m;
  }, [ordersLike]);

  const chartOptions = {
    chart: { type: "area", height: 260, toolbar: { show: false }, background: "transparent", zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3, colors: ["#00689b"] },
    markers: { size: 4, colors: ["#00689b"], strokeColors: "#fff", strokeWidth: 2, hover: { size: 6 } },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: "#00689b", opacity: 0.4 },
          { offset: 100, color: "#00689b", opacity: 0.1 },
        ],
      },
    },
    xaxis: {
      categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
      labels: { style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px" } } },
    grid: { show: true, borderColor: "var(--nextui-colors-default-200)" },
    legend: { show: false },
    tooltip: { y: { formatter: (v) => formatCurrency(v) } },
    colors: ["#00689b"],
  };
  const chartSeries = [{ name: "Total", data: monthly }];

  // Acciones fila
  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const openEdit = (order) => {
    setSelectedOrder(order);
    setEditActions(
      order.operationActions?.map((a) => ({
        name: a.name,
        quantity: Number(a.quantity || 0),
        benefit: Number(a.benefit || 0),
      })) || []
    );
    setEditDate(toISO(order.operationDate));
    setIsEditOpen(true);
  };

  const deleteOrder = (order) => {
    if (!window.confirm(`¿Eliminar la orden #${order.operationNumber}?`)) return;
    setOrdersLike((prev) => prev.filter((o) => o.id !== order.id));
    addToast({ title: "Orden eliminada", color: "secondary", duration: 1600 });
  };

  const updateState = (order, next) => {
    setOrdersLike((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    addToast({ title: "Estado actualizado", description: `#${order.operationNumber} -> ${next}`, color: next === "Cancelado" ? "danger" : "success", duration: 1800 });
  };

  const saveEdit = () => {
    if (!selectedOrder) return;
    setOrdersLike((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, operationActions: editActions.slice(), operationDate: new Date(editDate).toISOString() }
          : o
      )
    );
    setIsEditOpen(false);
    addToast({ title: "Orden actualizada", color: "success", duration: 1600 });
  };

  // Util
  const toISO = (d) => {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "";
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // -------- Nueva orden (flujo igual al Angular) --------
  const resetNewOrder = () => {
    setAccionistaName("");
    setAccionistaQty("");
    setAccionistaBenefit("");
    setNewActions([]);
    setFirstKind(null);
  };

  const validateInputs = () => {
    const q = Number(accionistaQty);
    const b = Number(accionistaBenefit);
    if (!accionistaName.trim() || q <= 0 || b <= 0) {
      addToast({ title: "Completa los campos", description: "Nombre, Cantidad y Precio son obligatorios", color: "warning", duration: 1800 });
      return false;
    }
    return true;
  };

  // Cuando se pulsa cualquiera de los 4 botones: añade a la lista y "bloquea" el tipo
  const addItemByKind = (kind) => {
    if (!validateInputs()) return;

    // Si ya hay tipo elegido, solo permitimos el mismo
    if (firstKind && firstKind !== kind) {
      addToast({ title: "Tipo no permitido", description: "Ya elegiste otro tipo para esta orden.", color: "danger", duration: 1800 });
      return;
    }

    // Añadir ítem a la lista
    const q = Number(accionistaQty);
    const b = Number(accionistaBenefit);
    setNewActions((prev) => [...prev, { name: accionistaName.trim(), quantity: q, benefit: b }]);

    // Fijar tipo si es el primer ítem
    if (!firstKind) setFirstKind(kind);

    // Limpiar inputs
    setAccionistaName("");
    setAccionistaQty("");
    setAccionistaBenefit("");

    addToast({ title: "Movimiento agregado", color: "success", duration: 1200 });
  };

  const removeNewAction = (idx) => {
    setNewActions((arr) => {
      const next = arr.filter((_, i) => i !== idx);
      // Si la lista quedó vacía, reabrimos todos los tipos
      if (next.length === 0) setFirstKind(null);
      return next;
    });
  };

  const saveNewOrder = () => {
    if (newActions.length === 0) {
      addToast({ title: "Agrega al menos un movimiento", color: "warning", duration: 1600 });
      return;
    }
    // Derivar banderas desde el tipo elegido (igual que en Angular)
    const isCapital = firstKind === KIND.CAPITAL || firstKind === KIND.CAPITAL_WITHDRAWL;
    const isWithdrawl = firstKind === KIND.CAPITAL_WITHDRAWL || firstKind === KIND.PROFIT_WITHDRAWL;

    const maxOp = ordersLike.reduce((m, o) => Math.max(m, Number(o.operationNumber || 0)), 1000);
    const newOrder = {
      id: `tmp-${Date.now()}`,
      code: `#${maxOp + 1}`,
      operationNumber: maxOp + 1,
      operationDate: new Date().toISOString(),
      operationValue: 0,
      status: "En progreso",
      isCapital,
      isWithdrawl,
      operationActions: newActions.slice(),
      clientId: userId,
    };
    setOrdersLike((prev) => [newOrder, ...prev]);
    setIsNewOpen(false);
    resetNewOrder();
    addToast({ title: "Orden creada", color: "success", duration: 1600 });
  };

  const nextOrderNumber = (ordersLike.reduce((m, o) => Math.max(m, Number(o.operationNumber || 0)), 1000) + 1) || 1001;

  if (loading) {
    return (
      <div className="p-6">
        <Card className="shadow-none rounded-3xl">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center justify-between bg-default-100 rounded-xl px-4 py-3">
              <div className="h-5 w-48 bg-default-200 rounded" />
              <div className="flex gap-2">
                <div className="h-9 w-32 bg-default-200 rounded" />
                <div className="h-9 w-24 bg-default-200 rounded" />
              </div>
            </div>
            <div className="h-[260px] w-full bg-default-100 rounded-2xl" />
            <div className="h-[300px] w-full bg-default-100 rounded-2xl" />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6 space-y-6">
          {/* Toolbar admin */}
          <div className="flex items-center justify-between gap-4 bg-[#0f2536] text-white rounded-xl px-4 py-3">
            <div className="text-sm">
              <span className="opacity-90">Cliente:</span>{" "}
              <span className="font-semibold">{userFullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-sky-600 text-white"
                startContent={<Icon icon="mdi:plus" width={18} />}
                onPress={() => {
                  resetNewOrder();
                  setIsNewOpen(true);
                }}
              >
                Nueva orden
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 text-white"
                onPress={() => navigate("/panel/usuarios")}
              >
                Volver
              </Button>
            </div>
          </div>

          {/* Gráfico */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardBody>
              <Chart options={chartOptions} series={chartSeries} type="area" height={260} />
            </CardBody>
          </Card>

          {/* Tabla */}
          <Card className="border-0 shadow-md rounded-2xl">
            <CardBody className="p-0">
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
                  {(c) => <TableColumn key={c.key}>{c.label}</TableColumn>}
                </TableHeader>
                <TableBody emptyContent="Este usuario no tiene órdenes">
                  {tableRows.map((row) => {
                    const o = row.original;
                    const finalized = (o.status || "").toLowerCase() === "finalizado";
                    const canceled = (o.status || "").toLowerCase() === "cancelado";
                    const canUpdate = !finalized && !canceled;
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
                        <TableCell className="text-right">{formatCurrency(row.capital)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.ganancia)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.perdida)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.retiros)}</TableCell>

                        <TableCell>
                          <Button isIconOnly radius="full" size="sm" variant="flat" color="success" onPress={() => openDetails(o)} aria-label="Ver más">
                            <Icon icon="mdi:eye-outline" width={18} />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button isIconOnly radius="full" size="sm" variant="flat" color="warning" onPress={() => openEdit(o)} aria-label="Editar" isDisabled={canceled}>
                            <Icon icon="mdi:pencil" width={18} />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button isIconOnly radius="full" size="sm" variant="flat" color="secondary" onPress={() => deleteOrder(o)} aria-label="Eliminar">
                            <Icon icon="mdi:close-circle-outline" width={18} />
                          </Button>
                        </TableCell>
                        <TableCell>
                          {canUpdate ? (
                            <div className="flex items-center gap-2">
                              <Button size="sm" radius="sm" color="success" variant="flat" onPress={() => updateState(o, "Finalizado")}>
                                Finalizar
                              </Button>
                              <Button size="sm" radius="sm" color="danger" variant="flat" onPress={() => updateState(o, "Cancelado")}>
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
            </CardBody>
          </Card>
        </CardBody>
      </Card>

      {/* Modal Ver detalles */}
      <Modal isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} size="xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => {
            const modalOrder = selectedOrder;
            const actions = modalOrder?.operationActions || [];
            const itemsTotal = sumActionsCapital(actions);
            const finalTotal = modalOrder?.isCapital ? itemsTotal : Number(modalOrder?.operationValue || 0);
            return (
              <>
                <ModalHeader className="flex flex-col gap-1">Detalles de la orden</ModalHeader>
                <ModalBody>
                  {modalOrder ? (
                    <div className="space-y-4">
                      <p className="text-sm text-default-700">
                        La operación <strong>#{modalOrder.operationNumber ?? ""}</strong> se realizó el{" "}
                        <Chip size="sm" variant="flat" color="primary" className="mx-1">
                          {formatDate(modalOrder.operationDate)}
                        </Chip>
                        y está{" "}
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            (modalOrder.status || "").toLowerCase() === "finalizado"
                              ? "success"
                              : (modalOrder.status || "").toLowerCase() === "cancelado"
                              ? "danger"
                              : "primary"
                          }
                          className="mx-1"
                        >
                          {(modalOrder.status || "").toUpperCase()}
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
                            const itemTotal = Number(a.benefit || 0) * Number(a.quantity || 0);
                            return (
                              <TableRow key={`${a._id || i}`}>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-default-600">
                                    <Icon icon="mdi:card-account-details-outline" width={18} />
                                    <span>
                                      {a.name} x{a.quantity}
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
                            <TableCell className="text-right font-semibold">{formatCurrency(finalTotal)} USD</TableCell>
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
            );
          }}
        </ModalContent>
      </Modal>

      {/* Modal Editar orden (UI igual a la captura) */}
      <Modal isOpen={isEditOpen} onOpenChange={setIsEditOpen} size="xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Editar la orden</ModalHeader>
          <ModalBody>
            <div className="bg-default-50 dark:bg-default-100 border border-default-200 rounded-xl p-4 space-y-6">
              {/* Línea superior: operación, fecha input y estado */}
              <div className="text-default-800 text-sm flex items-center flex-wrap gap-2">
                <span>La operación</span>
                <Chip size="sm" variant="flat" color="primary" className="font-semibold">
                  #{selectedOrder?.operationNumber ?? ""}
                </Chip>
                <span>se realizó el</span>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  variant="bordered"
                  size="sm"
                  radius="sm"
                  className="w-56"
                />
                <span>y está actualmente</span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    (selectedOrder?.status || "").toLowerCase() === "finalizado"
                      ? "success"
                      : (selectedOrder?.status || "").toLowerCase() === "cancelado"
                      ? "danger"
                      : "primary"
                  }
                  className="uppercase"
                >
                  {(selectedOrder?.status || "En progreso").toUpperCase()}
                </Chip>
                <span>.</span>
              </div>

              <div className="h-px bg-default-200" />

              {/* Filas de edición: nombre (solo lectura), cantidad y valor */}
              <div className="space-y-6">
                {editActions.map((a, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-2 text-default-600">
                      <Icon icon="mdi:chart-line" width={18} />
                      <span>
                        Nombre: <span className="text-default-800 font-medium">{a.name || "—"}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1">
                        <Input
                          type="number"
                          label="Cantidad"
                          value={String(a.quantity)}
                          onChange={(e) => {
                            const v = Number(e.target.value || 0);
                            setEditActions((prev) => prev.map((x, idx) => (idx === i ? { ...x, quantity: v } : x)));
                          }}
                          variant="bordered"
                          size="sm"
                          radius="sm"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Input
                          type="number"
                          label="Valor"
                          value={String(a.benefit)}
                          onChange={(e) => {
                            const v = Number(e.target.value || 0);
                            setEditActions((prev) => prev.map((x, idx) => (idx === i ? { ...x, benefit: v } : x)));
                          }}
                          variant="bordered"
                          size="sm"
                          radius="sm"
                        />
                      </div>
                    </div>
                    <div className="h-px bg-default-200" />
                  </div>
                ))}
                {editActions.length === 0 && (
                  <div className="text-sm text-default-500">Esta orden no tiene movimientos para editar.</div>
                )}
              </div>

              {/* Botón centrado como en la captura */}
              <div className="flex justify-center">
                <Button
                  color="primary"
                  className="bg-sky-600 text-white"
                  onPress={saveEdit}
                  isDisabled={editActions.length === 0}
                >
                  Actualizar orden
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal Nueva orden (flujo corregido) */}
      <Modal isOpen={isNewOpen} onOpenChange={(open) => { setIsNewOpen(open); if (!open) resetNewOrder(); }} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Nueva orden #{nextOrderNumber}</ModalHeader>
          <ModalBody>
            {/* Lista arriba como en Angular */}
            <div className="mb-2">
              {newActions.length === 0 ? null : (
                <ul className="list-disc pl-5 space-y-1">
                  {newActions.map((a, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-sm">
                        <b>{a.name}</b>: {formatCurrency(a.benefit)}{" "}
                        <span className="text-default-500">x{a.quantity}</span>
                      </span>
                      <button
                        className="text-default-400 hover:text-danger-500"
                        onClick={() => removeNewAction(i)}
                        title="Quitar"
                      >
                        <Icon icon="mdi:trash-can-outline" width={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Inputs Nombre, Cantidad, Precio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                label="Nombre"
                placeholder="Ingrese movimiento"
                value={accionistaName}
                onChange={(e) => setAccionistaName(e.target.value)}
                variant="bordered"
                radius="sm"
              />
              <Input
                label="Cantidad"
                type="number"
                value={accionistaQty}
                onChange={(e) => setAccionistaQty(e.target.value)}
                variant="bordered"
                radius="sm"
              />
              <Input
                label="Precio"
                type="number"
                value={accionistaBenefit}
                onChange={(e) => setAccionistaBenefit(e.target.value)}
                variant="bordered"
                radius="sm"
              />
            </div>

            {/* Botones de tipo: cada uno AÑADE y fija el tipo, como en Angular */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {(firstKind === null || firstKind === KIND.MOVEMENT) && (
                <Button
                  className="bg-sky-400 text-white"
                  startContent={<Icon icon="mdi:plus" width={18} />}
                  onPress={() => addItemByKind(KIND.MOVEMENT)}
                >
                  Agregar movimiento
                </Button>
              )}
              {(firstKind === null || firstKind === KIND.CAPITAL) && (
                <Button
                  className="bg-sky-400 text-white"
                  startContent={<Icon icon="mdi:plus" width={18} />}
                  onPress={() => addItemByKind(KIND.CAPITAL)}
                >
                  Agregar capital
                </Button>
              )}
              {(firstKind === null || firstKind === KIND.CAPITAL_WITHDRAWL) && (
                <Button
                  className="bg-sky-400 text-white"
                  startContent={<Icon icon="mdi:plus" width={18} />}
                  onPress={() => addItemByKind(KIND.CAPITAL_WITHDRAWL)}
                >
                  Retirar de capital
                </Button>
              )}
              {(firstKind === null || firstKind === KIND.PROFIT_WITHDRAWL) && (
                <Button
                  className="bg-sky-400 text-white"
                  startContent={<Icon icon="mdi:plus" width={18} />}
                  onPress={() => addItemByKind(KIND.PROFIT_WITHDRAWL)}
                >
                  Retirar de ganancia
                </Button>
              )}
            </div>

            {/* Mensaje si no hay items agregados */}
            {newActions.length === 0 && (
              <div className="text-sm text-default-500 mt-2">
                Sin movimientos agregados.
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => { setIsNewOpen(false); resetNewOrder(); }}>
              Cancelar
            </Button>
            <Button color="primary" className="bg-[#00689B]" onPress={saveNewOrder} isDisabled={newActions.length === 0}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}