import React, { useEffect, useState } from "react";
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
  Spinner,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import AdminVerifyModal from "./AdminVerifyModal.jsx";
import { adminListRequests, adminSetGlobal } from "../../../services/verificationservice.js";

export default function SolicitudesVerify() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminListRequests();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error al cargar solicitudes:", err);
      addToast({
        title: "Error al cargar datos",
        description: err?.message || "No se pudieron obtener las solicitudes de verificación.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModalFor = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const toggleGlobal = async (row) => {
    const userId = row.userId;
    const verificado = row?.global?.status === "verified";
    try {
      setBusy((b) => ({ ...b, [userId]: true }));
      const updated = await adminSetGlobal(userId, !verificado);
      // Actualizar fila local
      setRows((prev) =>
        prev.map((r) => (String(r.userId) === String(userId) ? { ...r, global: updated.global } : r))
      );
      addToast({
        title: updated?.global?.status === "verified" ? "Cuenta verificada" : "Cuenta no verificada",
        color: updated?.global?.status === "verified" ? "success" : "danger",
        duration: 2200,
      });
    } catch (err) {
      addToast({
        title: "Error",
        description: err?.message || "No se pudo actualizar verificación global.",
        color: "danger",
      });
    } finally {
      setBusy((b) => ({ ...b, [userId]: false }));
    }
  };

  const handleUpdatedFromModal = (uv) => {
    // Sincroniza la fila correspondiente con el objeto devuelto por el backend
    if (!uv?.userId) return;
    setRows((prev) =>
      prev.map((r) => (String(r.userId) === String(uv.userId) ? { ...r, documents: uv.documents, global: uv.global } : r))
    );
    setSelectedRow((s) => (s && String(s.userId) === String(uv.userId) ? { ...s, documents: uv.documents, global: uv.global } : s));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Spinner size="lg" color="primary" />
      </div>
    );

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-wide">Solicitudes de Verificación</h2>

          <Table
            aria-label="Solicitudes de verificación"
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
              <TableColumn>Email</TableColumn>
              <TableColumn>Archivo</TableColumn>
              <TableColumn>Fecha</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn>Acción</TableColumn>
            </TableHeader>

            <TableBody emptyContent="Aún no hay solicitudes registradas">
              {rows.map((r) => {
                const userId = r.userId;
                const verificado = r?.global?.status === "verified";

                return (
                  <TableRow key={userId}>
                    <TableCell>{r.nombre}</TableCell>
                    <TableCell>{r.email}</TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => openModalFor(r)}
                        startContent={<Icon icon="mdi:eye-outline" width={18} />}
                      >
                        Verificar documentos
                      </Button>
                    </TableCell>

                    <TableCell>{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("es-ES") : "—"}</TableCell>

                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={verificado ? "success" : "danger"}
                        className="font-medium"
                      >
                        {verificado ? "Verificado" : "Sin verificar"}
                      </Chip>
                    </TableCell>

                    <TableCell>
                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="flat"
                        color={verificado ? "danger" : "success"}
                        isDisabled={busy[userId]}
                        onPress={() => toggleGlobal(r)}
                      >
                        <Icon icon={verificado ? "mdi:close" : "mdi:check-bold"} width={20} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <AdminVerifyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userRow={selectedRow}
        onUpdated={handleUpdatedFromModal}
      />
    </div>
  );
}