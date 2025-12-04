import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  addToast,
  Chip,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import UserDetailsModal from "./UserDetaiIsModal .jsx";
import UserEditModal from "./UserEditModal.jsx";
import {
  listAllUsers,
  updateUserAdmin,
  deleteUserAdmin,
} from "../../../services/users.service.js";
import { listUserOrders } from "../../../services/orders.service.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// -------- Helpers --------
function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function flag20(url) {
  if (!url) return "";
  return url.replace(/\/w\d+\//, "/w20/");
}

function buildSearchKey(u) {
  const parts = [
    u.sequenceId,
    u.id,
    u.name,
    u.surname,
    u.email,
    u.currency?.code,
    u.currency?.name,
    u.country?.name,
    u.country?.code,
    u.address,
    u.company,
    u.contactNumber,
    u.whatsapp,
  ]
    .filter(Boolean)
    .map((v) => normalize(v));
  return parts.join(" ");
}

function mapDbToUiStatus(s) {
  return s === "Pendiente" ? "En progreso" : s || "En progreso";
}

function formatCurrency(n) {
  return Number(n || 0).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function sumActionsCapital(ops = []) {
  return (ops || []).reduce(
    (acc, a) => acc + Number(a?.benefit || 0) * Number(a?.quantity || 0),
    0
  );
}

function generateAuthCode(length = 25) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  return result;
}

const PAGE_SIZE = 50;

export default function AdminUsuarios() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginación
  const [page, setPage] = useState(1);

  // Sort
  // Por defecto, más recientes primero
  const [sortKey, setSortKey] = useState("createdAt"); // createdAt | name | ...
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  // Modales
  const [selected, setSelected] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // PDF
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const [pdfUser, setPdfUser] = useState(null);
  const [pdfOrders, setPdfOrders] = useState([]);
  const [pdfAuthCode, setPdfAuthCode] = useState("");
  const pdfContentRef = useRef(null);

  // Carga inicial
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await listAllUsers();

        if (!cancelled) {
          const withSearch = list.map((u) => ({
            ...u,
            country: u.country
              ? { ...u.country, flag: flag20(u.country.flag) }
              : u.country,
            searchKey: buildSearchKey(u),
          }));
          setUsers(withSearch);
          setPage(1);
        }
      } catch (e) {
        addToast({
          title: "Error",
          description: String(e?.message || e),
          color: "danger",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtro
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return users;
    return users.filter((u) => u.searchKey?.includes(q));
  }, [users, query]);

  // Funciones de sort
  const getSortValue = (u, key) => {
    switch (key) {
      case "createdAt": {
        // Preferir createdAt; fallback a updatedAt; luego numérico por sequenceId o id
        const ts =
          new Date(u.createdAt || u.updatedAt || 0).getTime() ||
          Number(u.sequenceId) ||
          Number(u.id) ||
          0;
        return ts;
      }
      case "name":
        return normalize(u.name);
      case "surname":
        return normalize(u.surname);
      case "email":
        return normalize(u.email);
      case "country":
        return normalize(u.country?.name);
      case "currency":
        return normalize(u.currency?.code || u.currency?.name);
      case "id":
        return Number(u.sequenceId) || Number(u.id) || 0;
      default:
        return "";
    }
  };

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    arr.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      // string
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Reiniciar a página 1 cuando cambie el filtro
  useEffect(() => {
    setPage(1);
  }, [query, sortKey, sortDir]);

  // Datos paginados
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleRows = sorted.slice(start, end);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombres" },
    { key: "surname", label: "Apellidos" },
    { key: "email", label: "E-mail" },
    { key: "currency", label: "Moneda" },
    { key: "country", label: "País" },
    { key: "more", label: "Ver Más" },
    { key: "edit", label: "Editar" },
    { key: "orders", label: "Ver Órdenes" },
    { key: "pdf", label: "Descargar PDF" },
    { key: "delete", label: "Eliminar usuario" },
  ];

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ label, active, dir }) => (
    <button
      type="button"
      onClick={() => toggleSort("name")}
      className={`inline-flex items-center gap-1 ${
        active ? "text-default-900 font-semibold" : "text-default-600"
      }`}
      title="Ordenar por nombre"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <Icon icon="mdi:chevron-up" width={16} />
        ) : (
          <Icon icon="mdi:chevron-down" width={16} />
        )
      ) : (
        <Icon icon="mdi:unfold-more-horizontal" width={16} className="opacity-50" />
      )}
    </button>
  );

  const handleOpenDetails = (u) => {
    setSelected(u);
    setOpenDetails(true);
  };

  const handleOpenEdit = (u) => {
    setSelected(u);
    setOpenEdit(true);
  };

  const handleSaveEdit = async (data) => {
    try {
      await updateUserAdmin(data.id, {
        ...data,
        currency: { name: data.currency?.name ?? data.currency?.code ?? "USD" },
        newPassword: data.newPassword,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.id
            ? {
                ...u,
                ...data,
                country: u.country
                  ? { ...data.country, flag: flag20(data.country?.flag) }
                  : data.country,
                searchKey: buildSearchKey({ ...u, ...data }),
              }
            : u
        )
      );

      addToast({
        title: "Usuario actualizado",
        description: `Se guardaron los cambios de #${data.id}.`,
        color: "success",
        duration: 2000,
      });
    } catch (e) {
      addToast({
        title: "Error",
        description: String(e?.message || e),
        color: "danger",
      });
    }
  };

  const handleOrders = (u) => {
    navigate(`/panel/usuarios/${u.id}/ordenes`, { state: { user: u } });
  };

  // ========= Descargar PDF igual que PanelUserOrders, pero desde aquí =========
  const handlePDF = async (u) => {
    try {
      setPdfAuthCode(generateAuthCode(25));
      setPdfUser(u);

      const ordenes = await listUserOrders({ clientId: String(u.id) });
      const normalized = (ordenes || []).map((o, idx) => ({
        id: o._id || o.id || idx,
        code: `#${o.operationNumber ?? ""}`,
        operationNumber: o.operationNumber ?? idx + 1001,
        operationDate: o.operationDate || new Date().toISOString(),
        operationValue: Number(o.operationValue || 0),
        status: mapDbToUiStatus(o.operationStatus || o.status),
        isCapital: Boolean(o.isCapital),
        isWithdrawl: Boolean(o.isWithdrawl),
        operationActions: Array.isArray(o.operationActions) ? o.operationActions : [],
        clientId: o.clientId || u.id,
        _raw: o,
      }));
      setPdfOrders(normalized);

      setIsPdfRendering(true);
      await new Promise((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => setTimeout(r, 140));

      const node = pdfContentRef.current;
      if (!node) {
        setIsPdfRendering(false);
        return;
      }

      const canvas = await html2canvas(node, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let position = 0;
      let heightLeft = pdfHeight;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      const fileId = u.sequenceId || u.id || "cliente";
      pdf.save(`reporte-ordenes-${fileId}.pdf`);
    } catch (e) {
      addToast({
        title: "Error",
        description: String(e?.message || e),
        color: "danger",
      });
    } finally {
      setIsPdfRendering(false);
    }
  };

  const handleDelete = async (u) => {
    const ok = window.confirm(
      `¿Eliminar al usuario #${u.id} (${u.name} ${u.surname})?`
    );
    if (!ok) return;
    try {
      await deleteUserAdmin(u.id);
      const next = users.filter((x) => x.id !== u.id);
      setUsers(next);

      // Ajustar página si quedó vacía
      const after = sorted.length - 1;
      const newTotalPages = Math.max(1, Math.ceil(after / PAGE_SIZE));
      if (page > newTotalPages) setPage(newTotalPages);

      addToast({
        title: "Usuario eliminado",
        description: `Se eliminó #${u.id}.`,
        color: "secondars",
        duration: 1800,
      });
    } catch (e) {
      addToast({
        title: "Error",
        description: String(e?.message || e),
        color: "danger",
      });
    }
  };

  // ========= Derivados para PDF oculto =========
  const pdfTableRows = useMemo(() => {
    return (pdfOrders || [])
      .slice()
      .sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
      .map((o, idx) => {
        const actionsTotal = sumActionsCapital(o.operationActions);
        const capital = o.isCapital && !o.isWithdrawl ? actionsTotal : 0;
        const retiros = o.isWithdrawl ? actionsTotal : 0;
        const ganancia =
          !o.isWithdrawl && o.operationValue > 0 ? o.operationValue : 0;
        const perdida =
          !o.isWithdrawl && o.operationValue < 0
            ? Math.abs(o.operationValue)
            : 0;
        return {
          id: o.id || idx,
          operacion: o.code || `#${idx + 1}`,
          fecha: formatDate(o.operationDate),
          estado: o.status || "En progreso",
          capital,
          ganancia,
          perdida,
          retiros,
        };
      });
  }, [pdfOrders]);

  const pdfTotals = useMemo(() => {
    return {
      capital: pdfTableRows.reduce((acc, r) => acc + Number(r.capital || 0), 0),
      ganancia: pdfTableRows.reduce(
        (acc, r) => acc + Number(r.ganancia || 0),
        0
      ),
      perdida: pdfTableRows.reduce(
        (acc, r) => acc + Number(r.perdida || 0),
        0
      ),
      retiros: pdfTableRows.reduce(
        (acc, r) => acc + Number(r.retiros || 0),
        0
      ),
    };
  }, [pdfTableRows]);

  const pdfCurrentBalance = useMemo(() => {
    let balance = 0;
    (pdfOrders || []).forEach((order) => {
      if (order.isCapital) {
        balance += sumActionsCapital(order.operationActions);
      }
      balance += Number(order.operationValue || 0);
    });
    return balance;
  }, [pdfOrders]);

  // ========= Skeletons =========
  const SkeletonRow = ({ cells = 11 }) => (
    <div className="grid grid-cols-11 gap-3 w-full px-3 py-2">
      {Array.from({ length: cells }).map((_, i) => (
        <Skeleton key={i} className="h-5 rounded-md" />
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6 space-y-4">
          <div className="text-sm text-default-500 flex items-center gap-2">
            <Icon icon="mdi:home-outline" width={18} />
            <span>Administrador</span>
            <Icon icon="mdi:chevron-right" width={16} />
            <span className="text-default-700 font-medium">Lista de clientes</span>
          </div>

          <div className="max-w-md">
            <Input
              placeholder="Buscar"
              startContent={<Icon icon="mdi:magnify" width={18} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="bordered"
              radius="lg"
              size="md"
            />
          </div>

          <Table
            aria-label="Lista de usuarios"
            removeWrapper
            classNames={{
              table: "rounded-2xl",
              th: "text-[11px] font-semibold text-default-500 uppercase tracking-wide bg-transparent",
              tr: "hover:bg-default-50/60",
              td: "text-sm",
            }}
            bottomContent={
              !loading && sorted.length > 0 && (
                <div className="flex items-center justify-between w-full py-2">
                  <div className="text-sm text-default-500">
                    Mostrando {start + 1} - {Math.min(end, sorted.length)} de{" "}
                    {sorted.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                      isDisabled={pageSafe <= 1}
                      startContent={<Icon icon="mdi:chevron-left" width={16} />}
                      className="text-default-800"
                    >
                      Anterior
                    </Button>
                    <div className="text-sm text-default-600">
                      Página {pageSafe} / {totalPages}
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                      isDisabled={pageSafe >= totalPages}
                      endContent={<Icon icon="mdi:chevron-right" width={16} />}
                      className="text-default-800"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )
            }
          >
            <TableHeader>
              <TableColumn key="id">ID</TableColumn>
              <TableColumn key="name">
                <SortHeader
                  label="Nombres"
                  active={sortKey === "name"}
                  dir={sortDir}
                />
              </TableColumn>
              <TableColumn key="surname">Apellidos</TableColumn>
              <TableColumn key="email">E-mail</TableColumn>
              <TableColumn key="currency">Moneda</TableColumn>
              <TableColumn key="country">País</TableColumn>
              <TableColumn key="more">Ver Más</TableColumn>
              <TableColumn key="edit">Editar</TableColumn>
              <TableColumn key="orders">Ver Órdenes</TableColumn>
              <TableColumn key="pdf">Descargar PDF</TableColumn>
              <TableColumn key="delete">Eliminar usuario</TableColumn>
            </TableHeader>

            <TableBody
              emptyContent={
                loading ? (
                  <div className="w-full py-3">
                    {/* Cabecera skeleton */}
                    <div className="grid grid-cols-11 gap-3 px-3 mb-3">
                      {Array.from({ length: 11 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full rounded-md" />
                      ))}
                    </div>
                    {/* Filas skeleton */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </div>
                ) : (
                  "No hay usuarios para mostrar"
                )
              }
            >
              {!loading &&
                visibleRows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.sequenceId ?? u.id}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.surname}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="majesticons:mail"
                          width={16}
                          className="text-default-400"
                        />
                        <span>{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color="default"
                        className="font-medium"
                      >
                        {u.currency?.code || u.currency?.name || "—"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {u.country?.flag ? (
                          <img
                            src={flag20(u.country.flag)}
                            alt={u.country?.code || u.country?.name || "flag"}
                            width={20}
                            height={14}
                            className="rounded-sm border border-default-200"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Icon
                            icon="mdi:flag-outline"
                            width={18}
                            className="text-default-400"
                          />
                        )}
                        <span>{u.country?.name || "—"}</span>
                      </div>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell>
                      <Button
                        isIconOnly
                        radius="full"
                        size="sm"
                        variant="flat"
                        color="success"
                        className="text-default-900"
                        onPress={() => {
                          setSelected(u);
                          setOpenDetails(true);
                        }}
                        aria-label="Ver más"
                      >
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
                        className="text-default-900"
                        onPress={() => {
                          setSelected(u);
                          setOpenEdit(true);
                        }}
                        aria-label="Editar"
                      >
                        <Icon icon="mdi:pencil" width={18} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        radius="full"
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="text-default-900"
                        onPress={() => handleOrders(u)}
                        aria-label="Ver órdenes"
                      >
                        <Icon icon="mdi:file-document-outline" width={18} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        radius="full"
                        size="sm"
                        variant="flat"
                        color="danger"
                        className="text-default-900"
                        onPress={() => handlePDF(u)}
                        aria-label="Descargar PDF"
                      >
                        <Icon icon="mdi:file-pdf-box" width={18} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        radius="full"
                        size="sm"
                        variant="flat"
                        color="secondary"
                        className="text-default-900"
                        onPress={() => handleDelete(u)}
                        aria-label="Eliminar usuario"
                      >
                        <Icon icon="mdi:close-circle-outline" width={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modales */}
      <UserDetailsModal
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        user={selected}
      />
      <UserEditModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        user={selected}
        onSave={handleSaveEdit}
      />

      {/* Contenido PDF oculto */}
      {isPdfRendering && (
        <div
          ref={pdfContentRef}
          id="pdf-content"
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            background: "#fff",
            padding: 24,
            width: 600,
            zIndex: -1,
            color: "#111",
            fontFamily:
              "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 22 }}>
              {pdfUser ? `${pdfUser.name} ${pdfUser.surname}` : ""}
            </div>
            <div>ID: {pdfUser?.sequenceId || pdfUser?.id || ""}</div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>
              Balance: {formatCurrency(pdfCurrentBalance)}
            </div>
          </div>

          <h2 style={{ textAlign: "center", marginBottom: 18 }}>
            REPORTE DE ÓRDENES
          </h2>

          <div
            style={{
              background: "#f8f8f8",
              borderRadius: 8,
              padding: "18px 12px",
              marginBottom: 20,
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            <div style={{ marginBottom: 8 }}>Resumen de Totales</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "right", padding: 6 }}>Capital</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Ganancia</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Pérdida</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Retiros</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: "right", padding: 6 }}>
                    {formatCurrency(pdfTotals.capital)}
                  </td>
                  <td style={{ textAlign: "right", padding: 6 }}>
                    {formatCurrency(pdfTotals.ganancia)}
                  </td>
                  <td style={{ textAlign: "right", padding: 6 }}>
                    {formatCurrency(pdfTotals.perdida)}
                  </td>
                  <td style={{ textAlign: "right", padding: 6 }}>
                    {formatCurrency(pdfTotals.retiros)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 18,
              fontSize: 15,
            }}
          >
            <thead>
              <tr style={{ background: "#e8e8e8" }}>
                <th style={{ padding: 6, textAlign: "left" }}>Operación</th>
                <th style={{ padding: 6, textAlign: "left" }}>Fecha</th>
                <th style={{ padding: 6, textAlign: "left" }}>Estado</th>
                <th style={{ padding: 6, textAlign: "right" }}>$ Capital</th>
                <th style={{ padding: 6, textAlign: "right" }}>$ Ganancia</th>
                <th style={{ padding: 6, textAlign: "right" }}>$ Pérdida</th>
                <th style={{ padding: 6, textAlign: "right" }}>$ Retiros</th>
              </tr>
            </thead>
            <tbody>
              {pdfTableRows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: 6 }}>{row.operacion}</td>
                  <td style={{ padding: 6 }}>{row.fecha}</td>
                  <td style={{ padding: 6 }}>
                    <span
                      style={{
                        background:
                          row.estado === "Finalizado" ? "#4caf5045" : "#9abaff82",
                        color:
                          row.estado === "Finalizado" ? "#086721" : "#002645",
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontSize: 12,
                      }}
                    >
                      {row.estado.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: 6, textAlign: "right" }}>
                    {formatCurrency(row.capital)}
                  </td>
                  <td style={{ padding: 6, textAlign: "right" }}>
                    {formatCurrency(row.ganancia)}
                  </td>
                  <td style={{ padding: 6, textAlign: "right" }}>
                    {formatCurrency(row.perdida)}
                  </td>
                  <td style={{ padding: 6, textAlign: "right" }}>
                    {formatCurrency(row.retiros)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ fontSize: 12, color: "#666", marginTop: 18 }}>
            Informe generado el {new Date().toLocaleDateString("es-EC")} por
            solicitud del administrador.
            <br />
            Autenticación: <b>{pdfAuthCode}</b>
          </div>
        </div>
      )}
    </div>
  );
}