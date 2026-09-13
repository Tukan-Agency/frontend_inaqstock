import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Chip,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  adminApproveDocument,
  adminRejectDocument,
  adminUploadDocument,
  adminSetGlobal,
} from "../../../services/verificationservice.js";

// Definición de los 4 documentos
const DOCS_DEF = [
  { id: "banco", label: "Cuenta Bancaria", icon: "duo-icons:bank" },
  { id: "domicilio", label: "Comprobante de domicilio", icon: "majesticons:home" },
  { id: "id", label: "Pasaporte ID", icon: "teenyicons:id-solid" },
  { id: "otros", label: "Otros", icon: "f7:doc-text-fill" },
];

const DOC_STATUS = {
  NONE: "none",
  PENDING: "pending",
  VERIFIED: "verified",
};

// 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helpers de archivo
const isPdf = (f) => !!f && f.type === "application/pdf";
const isImage = (f) => !!f && /^image\//i.test(f.type);
const fileIconFor = (fOrName) => {
  if (!fOrName) return "mdi:file-outline";
  if (typeof fOrName !== "string") {
    return isPdf(fOrName) ? "mdi:file-pdf-box" : isImage(fOrName) ? "mdi:image" : "mdi:file-outline";
  }
  const lower = fOrName.toLowerCase();
  if (lower.endsWith(".pdf")) return "mdi:file-pdf-box";
  if (lower.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "mdi:image";
  return "mdi:file-outline";
};
const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export default function AdminVerifyModal({ open, onClose, userRow, onUpdated }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const userId = userRow?.userId;

  // Estado inicial desde la fila
  const initialDocs = useMemo(() => {
    const base = {};
    for (const d of DOCS_DEF) {
      const slot = userRow?.documents?.[d.id] || {};
      base[d.id] = {
        status: slot.status || DOC_STATUS.NONE,
        fileUrl: slot.fileUrl ? `${API_URL}${slot.fileUrl}` : null,
        fileName: slot.fileName || null,
        newFile: null,
      };
    }
    return base;
  }, [userRow, API_URL]);

  const [docs, setDocs] = useState(initialDocs);
  const [editingId, setEditingId] = useState(null);
  const [globalStatus, setGlobalStatus] = useState(userRow?.global?.status || "not_verified");
  const [busy, setBusy] = useState({}); // busy por docId

  useEffect(() => {
    setDocs(initialDocs);
    setEditingId(null);
    setGlobalStatus(userRow?.global?.status || "not_verified");
    setBusy({});
  }, [initialDocs, userRow, open]);

  const openUrl = (url) => url && window.open(url, "_blank", "noopener,noreferrer");

  const statusChip = (st) => {
    if (st === DOC_STATUS.VERIFIED)
      return <Chip size="sm" variant="flat" className="bg-green-100 text-emerald-700 font-medium">Verificado</Chip>;
    if (st === DOC_STATUS.PENDING)
      return <Chip size="sm" variant="flat" className="bg-default-200 text-default-700 font-medium">Pendiente</Chip>;
    return <Chip size="sm" variant="flat" className="bg-rose-100 text-rose-700 font-medium">No verificado</Chip>;
  };

  const pickFile = (docId, e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      addToast({ title: "Archivo demasiado grande", description: "Máximo 10 MB.", color: "danger", duration: 2500 });
      e.target.value = null;
      return;
    }
    setDocs((prev) => ({ ...prev, [docId]: { ...prev[docId], newFile: f } }));
    addToast({ title: "Archivo seleccionado", description: f.name, color: "primary", duration: 1800 });
  };

  // Acciones servidor
  const doApprove = async (docId) => {
    if (!userId) return;
    try {
      setBusy((b) => ({ ...b, [docId]: true }));
      const uv = await adminApproveDocument(userId, docId);
      hydrateFromServer(uv);
      addToast({ title: "Documento verificado", color: "success", duration: 1600 });
    } catch (err) {
      addToast({ title: "Error", description: err?.message, color: "danger" });
    } finally {
      setBusy((b) => ({ ...b, [docId]: false }));
    }
  };

  const doReject = async (docId) => {
    if (!userId) return;
    try {
      setBusy((b) => ({ ...b, [docId]: true }));
      const uv = await adminRejectDocument(userId, docId);
      hydrateFromServer(uv);
      addToast({ title: "Documento marcado como no verificado", color: "warning", duration: 1600 });
    } catch (err) {
      addToast({ title: "Error", description: err?.message, color: "danger" });
    } finally {
      setBusy((b) => ({ ...b, [docId]: false }));
    }
  };

  const doUpload = async (docId) => {
    const file = docs[docId]?.newFile;
    if (!userId) return;
    if (!file) {
      addToast({ title: "Selecciona un archivo", color: "warning", duration: 1600 });
      return;
    }
    try {
      setBusy((b) => ({ ...b, [docId]: true }));
      const uv = await adminUploadDocument(userId, docId, file);
      hydrateFromServer(uv);
      setEditingId(null);
      addToast({ title: "Documento actualizado", color: "success", duration: 1600 });
    } catch (err) {
      addToast({ title: "Error", description: err?.message, color: "danger" });
    } finally {
      setBusy((b) => ({ ...b, [docId]: false }));
    }
  };

  const hydrateFromServer = (uv) => {
    if (!uv) return;
    // Actualiza docs y global desde la respuesta real del backend
    setDocs((prev) => {
      const next = { ...prev };
      for (const d of DOCS_DEF) {
        const slot = uv.documents?.[d.id] || {};
        next[d.id] = {
          ...next[d.id],
          status: slot.status || DOC_STATUS.NONE,
          fileUrl: slot.fileUrl ? `${API_URL}${slot.fileUrl}` : null,
          fileName: slot.fileName || null,
          newFile: null,
        };
      }
      return next;
    });
    setGlobalStatus(uv?.global?.status || "not_verified");
    // Notificar al padre
    if (typeof onUpdated === "function") onUpdated(uv);
  };

  const setGlobal = async (value) => {
    if (!userId) return;
    try {
      setBusy((b) => ({ ...b, global: true }));
      const uv = await adminSetGlobal(userId, value);
      hydrateFromServer(uv);
      addToast({
        title: uv?.global?.status === "verified" ? "Cuenta verificada" : "Cuenta no verificada",
        color: uv?.global?.status === "verified" ? "success" : "danger",
        duration: 1600,
      });
    } catch (err) {
      addToast({ title: "Error", description: err?.message, color: "danger" });
    } finally {
      setBusy((b) => ({ ...b, global: false }));
    }
  };

  const startEdit = (docId) => {
    setEditingId((id) => {
      const next = id === docId ? null : docId;
      setTimeout(() => {
        const el = document.getElementById(`doc-row-${docId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      return next;
    });
  };

  return (
    <Modal
      isOpen={!!open}
      onOpenChange={(o) => !o && onClose?.()}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: "rounded-2xl max-w-[1200px] w-[96vw]",
        header: "px-8 py-6",
        body: "px-8 py-6",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold">VERIFICACIÓN DE DOCUMENTOS</h2>
            <p className="text-default-500">Cliente: {userRow?.nombre || "—"}</p>
          </div>
          <div>
            {globalStatus === "verified" ? (
              <span className="inline-flex items-center rounded-full border border-emerald-600/60 text-emerald-700 px-3 py-1 text-sm bg-emerald-50">
                Cuenta verificada
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-rose-600/60 text-rose-700 px-3 py-1 text-sm bg-rose-50">
                Cuenta no verificada
              </span>
            )}
          </div>
        </ModalHeader>

        <ModalBody className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Tabla con header sticky */}
          <div className="w-full overflow-x-auto rounded-xl border border-default-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-content1">
                <tr className="text-default-500">
                  <th className="text-left py-3 pl-4 pr-3 w-14">No.</th>
                  <th className="text-left py-3 px-3 w-[280px]">Documento</th>
                  <th className="text-left py-3 px-3">Url de documento</th>
                  <th className="text-left py-3 px-3 w-[160px]">Status</th>
                  <th className="text-left py-3 pr-4 pl-3 w-[220px]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {DOCS_DEF.map((d, idx) => {
                  const st = docs[d.id]?.status || DOC_STATUS.NONE;
                  const fileUrl = docs[d.id]?.fileUrl || null;
                  const hasNew = !!docs[d.id]?.newFile;
                  const fileName = docs[d.id]?.fileName || null;

                  return (
                    <React.Fragment key={d.id}>
                      <tr id={`doc-row-${d.id}`} className="border-t border-default-200">
                        <td className="py-3 pl-4 pr-3 align-top">{idx + 1}</td>
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex w-8 h-8 rounded-md items-center justify-center bg-default-100">
                              <Icon icon={d.icon} width={18} />
                            </span>
                            <span className="font-medium">{d.label}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              isDisabled={!fileUrl}
                              onPress={() => openUrl(fileUrl)}
                              startContent={<Icon icon="mdi:eye-outline" width={18} />}
                            >
                              Ver documento
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              radius="full"
                              variant="flat"
                              onPress={() => startEdit(d.id)}
                              aria-label="Editar"
                            >
                              <Icon icon="mdi:pencil" width={18} />
                            </Button>
                          </div>
                          {/* nombre del archivo guardado (si existe) */}
                          {fileUrl && fileName && (
                            <div className="text-xs text-default-500 mt-1 flex items-center gap-1">
                              <Icon icon={fileIconFor(fileName)} width={14} /> <span className="truncate">{fileName}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top">{statusChip(st)}</td>

                        <td className="py-3 pr-4 pl-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            {st === DOC_STATUS.PENDING && (
                              <>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  radius="full"
                                  color="success"
                                  variant="solid"
                                  onPress={() => doApprove(d.id)}
                                  isDisabled={!!busy[d.id]}
                                  aria-label="Aprobar"
                                >
                                  <Icon icon="mdi:check-bold" width={18} />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  radius="full"
                                  color="danger"
                                  variant="flat"
                                  onPress={() => doReject(d.id)}
                                  isDisabled={!!busy[d.id]}
                                  aria-label="Rechazar"
                                >
                                  <Icon icon="mdi:close-thick" width={18} />
                                </Button>
                              </>
                            )}

                            {st === DOC_STATUS.VERIFIED && (
                              <Button
                                isIconOnly
                                size="sm"
                                radius="full"
                                color="danger"
                                variant="flat"
                                onPress={() => doReject(d.id)}
                                isDisabled={!!busy[d.id]}
                                aria-label="Marcar no verificado"
                              >
                                <Icon icon="mdi:close-thick" width={18} />
                              </Button>
                            )}

                            {st === DOC_STATUS.NONE && (
                              <Button
                                isIconOnly
                                size="sm"
                                radius="full"
                                color="success"
                                variant="flat"
                                onPress={() => doApprove(d.id)}
                                isDisabled={!!busy[d.id]}
                                aria-label="Aprobar sin archivo"
                              >
                                <Icon icon="mdi:check-bold" width={18} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Editor inline: barra sticky + info de archivo + dropzone */}
                      {editingId === d.id && (
                        <tr className="bg-content2/40">
                          <td className="py-0" />
                          <td className="py-0 px-3" colSpan={4}>
                            <div className="space-y-4">
                              {/* Barra superior sticky */}
                              <div className="sticky top-0 z-10 bg-content2/90 backdrop-blur rounded-xl border border-default-200 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-default-700">
                                  <span className="inline-flex w-9 h-9 rounded-md items-center justify-center bg-default-100">
                                    <Icon icon={d.icon} width={20} />
                                  </span>
                                  <span className="text-base font-semibold">{d.label}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    color="primary"
                                    className="bg-[#00689B] text-white"
                                    onPress={() => doUpload(d.id)}
                                    isDisabled={!docs[d.id]?.newFile || !!busy[d.id]}
                                    isLoading={!!busy[d.id]}
                                    startContent={<Icon icon="mdi:content-save" width={18} />}
                                  >
                                    Guardar cambios
                                  </Button>
                                  <Button
                                    variant="flat"
                                    onPress={() => {
                                      setDocs((prev) => ({ ...prev, [d.id]: { ...prev[d.id], newFile: null } }));
                                      setEditingId(null);
                                    }}
                                    startContent={<Icon icon="mdi:close-circle-outline" width={18} />}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>

                              {/* Info del archivo seleccionado (persistente) */}
                              {docs[d.id]?.newFile && (
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-default-200 bg-content1 px-4 py-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Icon icon={fileIconFor(docs[d.id].newFile)} width={18} className="text-default-600" />
                                    <span className="truncate max-w-[60vw]">{docs[d.id].newFile.name}</span>
                                    <span className="text-default-500 text-xs">
                                      ({formatBytes(docs[d.id].newFile.size)})
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="secondary"
                                    onPress={() =>
                                      setDocs((prev) => ({ ...prev, [d.id]: { ...prev[d.id], newFile: null } }))
                                    }
                                    startContent={<Icon icon="mdi:close-circle-outline" width={16} />}
                                  >
                                    Quitar
                                  </Button>
                                </div>
                              )}

                              {/* Dropzone */}
                              <div
                                className="relative border-2 border-dashed border-[#7fb1c9] rounded-2xl p-8 text-center cursor-pointer hover:border-[#00689B] transition-colors"
                                onClick={() => document.getElementById(`admin-edit-input-${d.id}`)?.click()}
                              >
                                <input
                                  id={`admin-edit-input-${d.id}`}
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onChange={(e) => pickFile(d.id, e)}
                                />
                                <div className="flex flex-col items-center gap-2 text-default-500">
                                  <Icon icon="ep:upload-filled" width={40} color="#1b6b8a" />
                                  <p className="text-[14px] font-medium text-default-700">Arrastra o selecciona un archivo</p>
                                  <p className="text-[12px] text-default-400">Se admiten imágenes y archivos PDF (máx. 10 MB)</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Barra inferior: acciones globales (override) */}
          <div className="sticky bottom-0 z-20">
            <div className="mt-4 rounded-xl border border-default-200 bg-content1/90 backdrop-blur px-4 py-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                <div className="text-[13px] text-default-600">
                  <div className="font-medium">Acciones globales</div>
                  <div>Verifica toda la cuenta o reinicia la verificación para comenzar de nuevo</div>
                </div>
                <div className="flex gap-2 justify-start md:justify-end">
                  <Button
                    variant="flat"
                    onPress={() => setGlobal(true)}
                    isDisabled={busy.global}
                    startContent={<Icon icon="mdi:check-bold" width={18} />}
                  >
                    Verificar todo
                  </Button>
                  <Button
                    variant="flat"
                    color="secondary"
                    onPress={() => setGlobal(false)}
                    isDisabled={busy.global}
                    startContent={<Icon icon="mdi:restart" width={18} />}
                  >
                    Reiniciar verificación
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}