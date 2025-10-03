import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/react"; // toast
import { useMemo, useState } from "react";
import { useSession } from "../../../../../hooks/use-session"; // ajusta esta ruta
import EditAccountModal from "./EditAccountModal.jsx";
import { updateMe, fetchSession } from "../../../../services/account"; // NUEVO import

export default function AccountInfo() {
  // Si tu hook expone refresh, lo usamos; si no, hacemos un fallback con fetchSession
  const { session, loading, refresh } = useSession?.() ?? {};

  const s = session?.user ?? {};
  const u = s?.user ?? {};

  const data = useMemo(() => {
    return {
      nombre: u?.name ?? s?.name ?? "",
      apellido: s?.apellido ?? "",
      paisActual: u?.country?.name ?? "",
      direccion: u?.address ?? "",
      correo: s?.email ?? "",
      compania: u?.company ?? "",
      celular: u?.contactNumber != null ? String(u.contactNumber) : "",
      whatsapp: u?.whatsapp != null ? String(u.whatsapp) : "",
      fechaNacimiento: u?.birthday ?? "", // ISO
      moneda: u?.currency?.name ?? "", // currency es objeto { name }
    };
  }, [s, u]);

  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const LabelValue = ({ label, value }) => (
    <div className="space-y-1">
      <p className="text-xs text-[#8D8D8D]">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );

  const GroupRow = ({ icon, children }) => (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
        <Icon icon={icon} width={22} color="#8D8D8D" />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const handleSubmitEdit = async (values) => {
    // Mapeo del formulario -> payload backend
    const payload = {
      name: values.nombre?.trim(),
      surname: values.apellido?.trim(),
      email: values.correo?.trim(),
      address: values.direccion?.trim(),
      contactNumber: values.celular ? Number(values.celular) : undefined,
      whatsapp: values.whatsapp ? Number(values.whatsapp) : undefined,
      ...(values.paisNuevo ? { country: { name: values.paisNuevo } } : {}),
      // Campos no editables (compañía, moneda, cumpleaños) NO se envían
    };

    // Limpieza: elimina keys vacías/undefined para no sobreescribir
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined || payload[k] === "") delete payload[k];
    });

    try {
      setSaving(true);
      await updateMe(payload);

      // Toast de éxito inmediato
      addToast({
        title: "Datos actualizados",
        description: "Tus cambios se han guardado correctamente.",
        color: "success",
        duration: 1600,
      });

      // Espera breve y luego refresca la sesión para actualizar la UI
      await delay(800);
      window.location.reload();
      if (typeof refresh === "function") {
        await refresh();
      } else {
        await fetchSession(); // fallback
        // window.location.reload(); // último recurso
      }

      setOpenEdit(false);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo actualizar el perfil";

      if (status === 409) {
        addToast({
          title: "Correo en uso",
          description: msg || "El correo ya está registrado por otro usuario.",
          color: "danger",
          duration: 2500,
        });
      } else {
        addToast({
          title: "Error al actualizar",
          description: msg,
          color: "danger",
          duration: 2500,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-foreground-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Grupo: Nombre / Apellido */}
      <GroupRow icon="mdi:user">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LabelValue label="Nombre:" value={data.nombre} />
          <LabelValue label="Apellido:" value={data.apellido} />
        </div>
      </GroupRow>

      {/* Grupo: País / Dirección */}
      <GroupRow icon="mdi:location">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LabelValue label="País:" value={data.paisActual} />
          <LabelValue label="Dirección:" value={data.direccion} />
        </div>
      </GroupRow>

      {/* Grupo: Correo */}
      <GroupRow icon="majesticons:mail">
        <div className="grid grid-cols-1">
          <LabelValue label="Correo" value={data.correo} />
        </div>
      </GroupRow>

      {/* Grupo: Compañía */}
      <GroupRow icon="duo-icons:building">
        <div className="grid grid-cols-1">
          <LabelValue label="Compañía:" value={data.compania} />
        </div>
      </GroupRow>

      {/* Grupo: Teléfono */}
      <GroupRow icon="ic:round-phone">
        <div className="grid grid-cols-1">
          <LabelValue label="Celular:" value={data.celular} />
          <LabelValue label="Whatsapp:" value={data.whatsapp} />
        </div>
      </GroupRow>

      {/* Botón Editar (abre modal) */}
      <div>
        <Button
          color="primary"
          variant="solid"
          startContent={<Icon icon="mdi:pencil" width={18} />}
          className="bg-[#00689B] text-white hover:opacity-90"
          onPress={() => setOpenEdit(true)}
          isDisabled={saving}
        >
          Editar
        </Button>
      </div>

      {/* Modal de edición */}
      <EditAccountModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSubmit={handleSubmitEdit}
        initialData={{
          nombre: data.nombre,
          apellido: data.apellido,
          fechaNacimiento: data.fechaNacimiento,
          correo: data.correo,
          direccion: data.direccion,
          celular: data.celular,
          whatsapp: data.whatsapp,
          paisNuevo: "",
          paisActual: data.paisActual,
          compania: data.compania,
          moneda: { name: data.moneda }, // tu modal lo lee como objeto.moneda.name
        }}
      />
    </div>
  );
}
