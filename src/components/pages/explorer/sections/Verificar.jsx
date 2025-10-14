import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Chip, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSession } from "../../../../hooks/use-session.jsx";
import { uploadMyDocument, getMyVerification } from "../../../services/verificationservice.js";

// Estados posibles por documento
const DOC_STATUS = {
  NONE: "none",
  PENDING: "pending",
  VERIFIED: "verified",
};

// Definición de los 4 documentos (orden como en tu mockup)
const DOCS_DEF = [
  { id: "banco", label: "Cuenta bancaria", icon: "duo-icons:bank" },
  { id: "domicilio", label: "Comprobante de domicilio", icon: "majesticons:home" },
  { id: "id", label: "Pasaporte ID", icon: "teenyicons:id-solid" },
  { id: "otros", label: "Otros", icon: "f7:doc-text-fill" },
];

// Máximo 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Verificar() {
  const { session } = useSession();
  const API_URL = import.meta.env.VITE_API_URL;

  // docs[docId] = { file (local), status, serverUrl, serverName }
  const [docs, setDocs] = useState(() =>
    DOCS_DEF.reduce((acc, d) => {
      acc[d.id] = { file: null, status: DOC_STATUS.NONE, serverUrl: null, serverName: null };
      return acc;
    }, {})
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({}); // busy por docId

  // Cargar estado desde el backend
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const uv = await getMyVerification();
        if (uv?.documents) {
          setDocs((prev) => {
            const next = { ...prev };
            for (const d of DOCS_DEF) {
              const slot = uv.documents[d.id] || {};
              next[d.id] = {
                file: null,
                status: slot.status || DOC_STATUS.NONE,
                serverUrl: slot.fileUrl ? `${API_URL}${slot.fileUrl}` : null,
                serverName: slot.fileName || null,
              };
            }
            return next;
          });
        }
      } catch (err) {
        addToast({
          title: "Error",
          description: err?.message || "No se pudo cargar la verificación.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL]);

  const globalVerified = useMemo(
    () => DOCS_DEF.every((d) => docs[d.id].status === DOC_STATUS.VERIFIED),
    [docs]
  );

  // Utilidades
  const isImage = (file) => !!file && /^image\//i.test(file.type);
  const isPdf = (file) => !!file && file.type === "application/pdf";

  const fileIconFor = (fileOrName) => {
    if (!fileOrName) return "mdi:file-outline";
    if (typeof fileOrName !== "string") {
      if (isPdf(fileOrName)) return "mdi:file-pdf-box";
      if (isImage(fileOrName)) return "mdi:image";
      return "mdi:file-outline";
    }
    // Si es nombre/URL, solo devolvemos un icono genérico
    const lower = fileOrName.toLowerCase();
    if (lower.endsWith(".pdf")) return "mdi:file-pdf-box";
    if (lower.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "mdi:image";
    return "mdi:file-outline";
  };

  const openLocalPreview = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openServerPreview = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const setDocFile = (docId, file) => {
    setDocs((prev) => {
      const prevState = prev[docId]?.status || DOC_STATUS.NONE;
      // Si estaba VERIFIED y el usuario sube un nuevo archivo, pasa a PENDING (en UI)
      const nextStatus = prevState === DOC_STATUS.VERIFIED ? DOC_STATUS.PENDING : prevState;
      return {
        ...prev,
        [docId]: { ...prev[docId], file, status: nextStatus },
      };
    });
  };

  // Handlers
  const onPickFile = (docId, e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      addToast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 10 MB.",
        color: "danger",
        duration: 3000,
      });
      e.target.value = null;
      return;
    }

    setDocFile(docId, f);

    const wasPending = docs[docId].status === DOC_STATUS.PENDING;
    const wasVerified = docs[docId].status === DOC_STATUS.VERIFIED;

    addToast({
      title: wasVerified ? "Documento actualizado" : wasPending ? "Archivo reemplazado" : "Archivo seleccionado",
      description:
        wasVerified
          ? "Documento pasó a Pendiente para nueva verificación."
          : wasPending
          ? "Pulsa Reenviar para mandar el nuevo archivo."
          : f.name,
      color: wasVerified ? "warning" : "secondary",
      duration: 2500,
    });
  };

  const triggerInput = (docId) => {
    const input = document.getElementById(`file-input-${docId}`);
    if (input) input.click();
  };

  // Acciones contra backend
  const sendDocument = async (docId) => {
    const current = docs[docId];
    if (!current?.file) {
      addToast({
        title: "Selecciona un archivo",
        description: "Debes adjuntar un archivo antes de verificar.",
        color: "warning",
        duration: 2500,
      });
      return;
    }
    try {
      setBusy((b) => ({ ...b, [docId]: true }));
      const uv = await uploadMyDocument(docId, current.file);
      // Actualizar estado según respuesta del backend
      if (uv?.documents) {
        const slot = uv.documents[docId] || {};
        setDocs((prev) => ({
          ...prev,
          [docId]: {
            file: null, // ya enviado, limpiamos selección local
            status: slot.status || DOC_STATUS.PENDING,
            serverUrl: slot.fileUrl ? `${API_URL}${slot.fileUrl}` : prev[docId].serverUrl,
            serverName: slot.fileName || prev[docId].serverName,
          },
        }));
      } else {
        // fallback: marcar pending
        setDocs((prev) => ({
          ...prev,
          [docId]: { ...prev[docId], status: DOC_STATUS.PENDING, file: null },
        }));
      }
      addToast({
        title: "Documento enviado",
        description: "Tu archivo está en proceso de verificación.",
        color: "success",
        duration: 2500,
      });
    } catch (err) {
      addToast({
        title: "Error",
        description: err?.message || "No se pudo subir el documento.",
        color: "danger",
        duration: 2500,
      });
    } finally {
      setBusy((b) => ({ ...b, [docId]: false }));
    }
  };

  const resendDocument = (docId) => sendDocument(docId);

  const cancelPending = (docId) => {
    // Solo limpia la selección local; no borra en el servidor (flujo usuario)
    setDocs((prev) => ({
      ...prev,
      [docId]: { ...prev[docId], file: null, status: prev[docId].serverUrl ? prev[docId].status : DOC_STATUS.NONE },
    }));
    addToast({
      title: "Acción cancelada",
      description: "Puedes seleccionar otro archivo o cerrar el editor.",
      color: "secondary",
      duration: 2200,
    });
  };

  // Render del control de estado por documento (columna derecha)
  const StatusControl = ({ docId, state, hasLocalFile, disabled }) => {
    if (state === DOC_STATUS.NONE) {
      return (
        <Button
          className="bg-[#00689B] text-white"
          size="md"
          onPress={() => sendDocument(docId)}
          isDisabled={!hasLocalFile || disabled}
          isLoading={disabled}
        >
          verificar
        </Button>
      );
    }
    if (state === DOC_STATUS.PENDING) {
      return (
        <div className="flex flex-col gap-2 items-stretch md:items-center">
          <Chip size="md" variant="flat" className="font-medium bg-default-200 text-default-700">
            En proceso
          </Chip>
          <div className="flex gap-2">
            <Button
              className="text-white"
              size="sm"
              color="primary"
              variant="solid"
              onPress={() => resendDocument(docId)}
              isDisabled={!hasLocalFile || disabled}
              isLoading={disabled}
            >
              Reenviar
            </Button>
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              onPress={() => cancelPending(docId)}
              isDisabled={disabled}
            >
              Cancelar
            </Button>
          </div>
        </div>
      );
    }
    return (
      <Chip size="md" variant="flat" className="font-medium bg-green-100 text-emerald-700">
        Verificado
      </Chip>
    );
  };

  // Fila de documento
  const DocumentRow = ({ doc }) => {
    const d = docs[doc.id];
    const hasLocalFile = !!d.file;
    const hasServerFile = !!d.serverUrl;

    return (
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_220px] gap-4 items-center">
        {/* Columna izquierda: etiqueta + icono */}
        <button
          type="button"
          className="w-full md:w-[260px] text-left flex items-center gap-3 rounded-xl border border-[#cfe0e8] bg-[#e9f3f8] px-4 py-4 hover:opacity-95"
        >
          <span className="inline-flex w-9 h-9 rounded-md items-center justify-center bg-[#d6ebf4]">
            <Icon icon={doc.icon} width={22} color="#1b6b8a" />
          </span>
          <span className="text-[15px] font-semibold text-[#1b6b8a]">{doc.label}</span>
        </button>

        {/* Columna central: dropzone + info de archivo */}
        <div
          className={[
            "relative border-2 border-dashed rounded-2xl px-6 py-8 min-h-[110px]",
            "border-[#7fb1c9] hover:border-[#00689B] transition-colors cursor-pointer",
          ].join(" ")}
          onClick={() => triggerInput(doc.id)}
        >
          <input
            id={`file-input-${doc.id}`}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onPickFile(doc.id, e)}
          />
          <div className="flex flex-col items-center gap-2 text-default-500">
            <Icon icon="ep:upload-filled" width={40} color="#1b6b8a" />
            {!hasLocalFile && !hasServerFile ? (
              <>
                <p className="text-[14px] font-medium text-default-700">
                  Arrastra o selecciona un archivo
                </p>
                <p className="text-[12px] text-default-400">
                  Se admiten imágenes y archivos PDF (máx. 10 MB)
                </p>
              </>
            ) : (
              <div
                className="flex flex-col items-center gap-2 text-[14px] font-medium text-default-700 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 max-w-full">
                  <Icon
                    icon={hasLocalFile ? fileIconFor(d.file) : fileIconFor(d.serverName || d.serverUrl)}
                    width={20}
                    className="text-default-600"
                  />
                  <span className="truncate">
                    {hasLocalFile ? d.file.name : d.serverName || d.serverUrl}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hasLocalFile && (
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => openLocalPreview(d.file)}
                      startContent={<Icon icon="mdi:eye-outline" width={18} />}
                    >
                      Ver documento
                    </Button>
                  )}
                  {!hasLocalFile && hasServerFile && (
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => openServerPreview(d.serverUrl)}
                      startContent={<Icon icon="mdi:eye-outline" width={18} />}
                    >
                      Ver documento
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => triggerInput(doc.id)}
                    startContent={<Icon icon="mdi:pencil" width={18} />}
                  >
                    Cambiar archivo
                  </Button>
                  {d.status === DOC_STATUS.PENDING && hasLocalFile && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      onPress={() => cancelPending(doc.id)}
                      startContent={<Icon icon="mdi:close-circle-outline" width={18} />}
                    >
                      Quitar archivo
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: estado/acción */}
        <div className="flex justify-start md:justify-center">
          <StatusControl
            docId={doc.id}
            state={d.status}
            hasLocalFile={hasLocalFile}
            disabled={!!busy[doc.id]}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <span className="text-default-500">Cargando…</span>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center">
      <Card className="shadow-none rounded-3xl w-full">
        <CardBody className="px-6 py-6 space-y-6">
          {/* Header con título y estado global a la derecha */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-wide">VERIFICACIÓN DE CUENTA</h1>
              <p className="mt-1 text-[15px] max-w-2xl">
                Verifica tu cuenta, Adjunte los documentos solicitados para verificar su cuenta y poder operar.
              </p>
            </div>
            <div className="self-start">
              {globalVerified ? (
                <span className="inline-flex items-center rounded-full border border-emerald-600/60 text-emerald-700 px-4 py-2 text-sm bg-emerald-50">
                  Documentacion completada
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-rose-600/60 text-rose-700 px-4 py-2 text-sm bg-rose-50">
                  Documentación incompleta
                </span>
              )}
            </div>
          </div>

          {/* Filas de documentos */}
          <div className="space-y-5">
            {DOCS_DEF.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} />
            ))}
          </div>

          {/* Nota inferior */}
          <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-800">
            Una vez el usuario haya adjuntado todos los documentos necesarios, y el administrador haya aprobado los documentos, automáticamente, la cuenta será verificada globalmente.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}