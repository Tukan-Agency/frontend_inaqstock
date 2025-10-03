import { useEffect, useMemo, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/react"; // toast
import { apiDataFetch } from "../../../../services/apiService.js"; // ajusta la ruta si tu estructura es distinta

// Fallback de países (puedes reemplazarlo por lo que traigas del backend)
const FALLBACK_COUNTRIES = [
  { name: "Afganistán" },
  { name: "Albania" },
  { name: "Argentina" },
  { name: "Bolivia" },
  { name: "Brasil" },
  { name: "Chile" },
  { name: "Colombia" },
  { name: "Costa Rica" },
  { name: "Cuba" },
  { name: "República Dominicana" },
  { name: "Ecuador" },
  { name: "España" },
  { name: "Guatemala" },
  { name: "Honduras" },
  { name: "México" },
  { name: "Nicaragua" },
  { name: "Panamá" },
  { name: "Perú" },
  { name: "Paraguay" },
  { name: "El Salvador" },
  { name: "Estados Unidos" },
  { name: "Uruguay" },
  { name: "Venezuela" },
];

function validateEmail(email) {
  if (!email) return "El correo es obligatorio";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? "" : "Correo inválido";
}

// Formatea ISO -> MM/DD/YYYY para mostrar
function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return iso;
  }
}

export default function EditAccountModal({
  open,
  onClose,
  initialData,
  onSubmit,
  countries,
}) {
  const countryOptions = useMemo(
    () => (countries && countries.length ? countries : FALLBACK_COUNTRIES),
    [countries]
  );

  const [form, setForm] = useState(() => ({
    nombre: initialData?.nombre ?? "",
    apellido: initialData?.apellido ?? "",
    fechaNacimiento: initialData?.fechaNacimiento ?? "",
    correo: initialData?.correo ?? "",
    direccion: initialData?.direccion ?? "",
    celular: initialData?.celular ?? "",
    whatsapp: initialData?.whatsapp ?? "",
    paisNuevo: initialData?.paisNuevo ?? "",
    paisActual: initialData?.paisActual ?? "",
    compania: initialData?.compania ?? "",
    moneda: initialData?.moneda ?? "",
  }));

  // Estado para verificación de correo
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const lastCheckedEmail = useRef("");

  useEffect(() => {
    if (!open) return;
    setForm({
      nombre: initialData?.nombre ?? "",
      apellido: initialData?.apellido ?? "",
      fechaNacimiento: initialData?.fechaNacimiento ?? "",
      correo: initialData?.correo ?? "",
      direccion: initialData?.direccion ?? "",
      celular: initialData?.celular ?? "",
      whatsapp: initialData?.whatsapp ?? "",
      paisNuevo: initialData?.paisNuevo ?? "",
      paisActual: initialData?.paisActual ?? "",
      compania: initialData?.compania ?? "",
      moneda: initialData?.moneda?.name ?? initialData?.moneda ?? "",
    });
    setEmailTaken(false);
    setCheckingEmail(false);
    lastCheckedEmail.current = "";
  }, [open, initialData]);

  const [saving, setSaving] = useState(false);
  const emailError = validateEmail(form.correo);
  const nombreError = form.nombre.trim() ? "" : "El nombre es obligatorio";
  const apellidoError = form.apellido.trim() ? "" : "El apellido es obligatorio";
  const isValid = !emailError && !nombreError && !apellidoError && !emailTaken;

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "correo") {
      // Reinicia flag al cambiar correo
      setEmailTaken(false);
    }
  };

  const handleSelectCountry = (keys) => {
    const first = Array.from(keys)[0];
    setForm((prev) => ({ ...prev, paisNuevo: String(first ?? "") }));
  };

  // Verificador de correo (toast + validación inline)
  const handleEmailBlur = async () => {
    const raw = form.correo || "";
    const email = raw.trim().toLowerCase();
    if (!email || emailError) return;

    // Si es el mismo email actual, no marcamos como tomado
    const current = String(initialData?.correo || "").trim().toLowerCase();
    if (email === current) {
      setEmailTaken(false);
      // Evita spamear toasts si se repite el blur con el mismo valor
      if (lastCheckedEmail.current !== email) {
        addToast({
          title: "Correo actual",
          description: "Estás usando tu correo actual.",
          color: "Warning",
          duration: 2000,
        });
        lastCheckedEmail.current = email;
      }
      return;
    }

    try {
      setCheckingEmail(true);
      const resp = await apiDataFetch(import.meta.env.VITE_API_URL+ "/api/users/check-email", "POST", { email });
      // resp puede venir como { exists: boolean } o { exists, available }
      const exists = !!resp?.exists;
      setEmailTaken(exists);

      // Evita duplicar toasts si el usuario hace blur varias veces sin cambiar el valor
      if (lastCheckedEmail.current === email) return;
      lastCheckedEmail.current = email;

      if (exists) {
        addToast({
          title: "Correo no disponible",
          description: "Este correo ya está registrado.",
          color: "danger",
          duration: 2500,
        });
      } else {
        addToast({
          title: "Correo disponible",
          description: "Puedes usar este correo.",
          color: "success",
          duration: 1800,
        });
      }
    } catch (err) {
      setEmailTaken(false);
      addToast({
        title: "No se pudo verificar el correo",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Inténtalo nuevamente.",
        color: "warning",
        duration: 2500,
      });
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!isValid) {
      addToast({
        title: "Revisa los campos",
        description: emailTaken
          ? "El correo ingresado ya está en uso."
          : "Completa los campos obligatorios.",
        color: "warning",
        duration: 2200,
      });
      return;
    }
    try {
      setSaving(true);
      onSubmit?.(form);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      size="2xl"
      backdrop="opaque"
      classNames={{ base: "rounded-2xl" }}
      hideCloseButton
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-start gap-1">
          <h2 className="text-2xl font-semibold">Editar Cuenta</h2>
          <p className="text-sm text-foreground-500">
            Actualiza los campos para editar la información de la cuenta
          </p>
        </ModalHeader>

        <ModalBody>
          {/* Compacto: 2 columnas en md+, scroll interno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto pr-1">
            <Input
              size="sm"
              label="Nombre"
              value={form.nombre}
              onChange={handleChange("nombre")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:user" width={18} />}
              isInvalid={!!nombreError}
              errorMessage={nombreError}
              isRequired
            />

            <Input
              size="sm"
              label="Apellido"
              value={form.apellido}
              onChange={handleChange("apellido")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:user" width={18} />}
              isInvalid={!!apellidoError}
              errorMessage={apellidoError}
              isRequired
            />

            <Input
              size="sm"
              label="Fecha nacimiento"
              value={formatDate(form.fechaNacimiento) || ""}
              isReadOnly
              variant="bordered"
              radius="sm"
              startContent={<Icon icon="mdi:cake-variant-outline" width={18} />}
            />

            <Input
              size="sm"
              type="email"
              label="Correo electrónico"
              value={form.correo}
              onChange={handleChange("correo")}
              onBlur={handleEmailBlur}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="majesticons:mail" width={18} />}
              isInvalid={!!emailError || emailTaken}
              errorMessage={
                emailTaken ? "Este correo ya está en uso" : emailError
              }
              isRequired
              isDisabled={checkingEmail}
            />

            {/* Dirección a lo ancho */}
            <div className="md:col-span-2">
              <Input
                size="sm"
                label="Dirección"
                value={form.direccion ?? ""}
                onChange={handleChange("direccion")}
                radius="sm"
                variant="bordered"
                startContent={<Icon icon="mdi:location" width={18} />}
              />
            </div>

            <Input
              size="sm"
              type="tel"
              label="Celular"
              value={form.celular ?? ""}
              onChange={handleChange("celular")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="ic:round-phone" width={18} />}
            />

            <Input
              size="sm"
              type="tel"
              label="Whatsapp"
              value={form.whatsapp ?? ""}
              onChange={handleChange("whatsapp")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:whatsapp" width={18} color="#25D366" />}
            />

            <Select
              size="sm"
              label="País"
              variant="bordered"
              radius="sm"
              selectedKeys={new Set(form.paisNuevo ? [form.paisNuevo] : [])}
              onSelectionChange={(keys) => handleSelectCountry(keys)}
              startContent={<Icon icon="mdi:flag-outline" width={18} />}
              selectorIcon={<Icon icon="mdi:chevron-down" width={18} />}
              placeholder="Selecciona un país (opcional)"
            >
              {countryOptions.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </Select>

            <Input
              size="sm"
              label="País actual"
              value={form.paisActual ?? ""}
              isReadOnly
              variant="bordered"
              radius="sm"
              startContent={<Icon icon="mdi:map-marker" width={18} />}
            />

            {/* Compañía a lo ancho (suele ser larga) */}
            <div className="md:col-span-2">
              <Input
                size="sm"
                label="Compañía"
                value={form.compania ?? ""}
                isReadOnly
                variant="bordered"
                radius="sm"
                startContent={<Icon icon="duo-icons:building" width={18} />}
              />
            </div>

            <Input
              size="sm"
              label="Moneda"
              value={form.moneda ?? ""}
              isReadOnly
              variant="bordered"
              radius="sm"
              startContent={<Icon icon="mdi:currency-usd" width={18} />}
            />

            {/* Espaciador para alinear última fila cuando hay 2 columnas */}
            <div className="hidden md:block" />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="flat"
            onPress={handleClose}
            className="text-foreground-600"
            isDisabled={saving}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            className="bg-[#00689B] text-white hover:opacity-95"
            onPress={handleSubmit}
            isLoading={saving}
            isDisabled={!isValid}
            startContent={<Icon icon="mdi:content-save" width={18} />}
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}