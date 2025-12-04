import { useMemo, useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/react";

const FALLBACK_COUNTRIES = [
  { name: "Afganistán", code: "AF", flag: "https://flagcdn.com/w20/af.png" },
  { name: "Argentina", code: "AR", flag: "https://flagcdn.com/w20/ar.png" },
  { name: "Chile", code: "CL", flag: "https://flagcdn.com/w20/cl.png" },
  { name: "Colombia", code: "CO", flag: "https://flagcdn.com/w20/co.png" },
  { name: "Ecuador", code: "EC", flag: "https://flagcdn.com/w20/ec.png" },
  { name: "El Salvador", code: "SV", flag: "https://flagcdn.com/w20/sv.png" },
  { name: "Estados Unidos", code: "US", flag: "https://flagcdn.com/w20/us.png" },
  { name: "México", code: "MX", flag: "https://flagcdn.com/w20/mx.png" },
  { name: "Perú", code: "PE", flag: "https://flagcdn.com/w20/pe.png" },
];

function toISODate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function UserEditModal({ open, onClose, user, onSave }) {
  const [form, setForm] = useState({
    id: "",
    name: "",
    surname: "",
    birthday: "",
    email: "",
    address: "",
    contactNumber: "",
    whatsapp: "",
    countryName: "",
    company: "",
    currency: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Reset controlado cada vez que abres el modal (evita arrastre y autofill)
  useEffect(() => {
    if (!open || !user) return;
    setForm({
      id: user.id,
      name: user.name || "",
      surname: user.surname || "",
      birthday: toISODate(user.birthday) || "",
      email: user.email || "",
      address: user.address || "",
      contactNumber: String(user.contactNumber ?? ""),
      whatsapp: String(user.whatsapp ?? ""),
      countryName: user.country?.name || "",
      company: user.company || "",
      currency: user.currency?.code || user.currency?.name || "",
      newPassword: "",        // vacío siempre al abrir
      confirmPassword: "",    // vacío siempre al abrir
    });
  }, [open, user]);

  // Validación: solo pide password si intentas cambiarla.
  const isValid = useMemo(() => {
    const hasBasics =
      form.name.trim().length > 0 &&
      form.surname.trim().length > 0 &&
      form.email.trim().length > 0;

    if (!hasBasics) return false;

    const wantsPwd =
      (form.newPassword && form.newPassword.trim().length > 0) ||
      (form.confirmPassword && form.confirmPassword.trim().length > 0);

    if (!wantsPwd) return true; // ambos vacíos: permitir guardar

    // Si vas a cambiar contraseña:
    if (!form.newPassword || !form.confirmPassword) return false;
    if (form.newPassword.length < 8) return false;
    if (form.newPassword !== form.confirmPassword) return false;

    return true;
  }, [form.name, form.surname, form.email, form.newPassword, form.confirmPassword]);

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const countries = FALLBACK_COUNTRIES;

  const handleSave = () => {
    if (!isValid) {
      addToast({
        title: "Revisa los campos",
        description:
          form.newPassword || form.confirmPassword
            ? "Si cambias la contraseña: ambos campos, mínimo 8 caracteres y que coincidan."
            : "Nombre, Apellido y Correo son obligatorios.",
        color: "warning",
        duration: 2200,
      });
      return;
    }

    const pickedCountry =
      countries.find((c) => c.name === form.countryName) || user?.country || null;

    // Sólo enviamos newPassword si se ingresó algo
    const payload = {
      ...user,
      id: form.id,
      name: form.name.trim(),
      surname: form.surname.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      contactNumber: String(form.contactNumber || "").trim(),
      whatsapp: String(form.whatsapp || "").trim(),
      birthday: form.birthday || user?.birthday,
      company: form.company,
      currency: { code: form.currency || user?.currency?.code, name: user?.currency?.name },
      country: pickedCountry
        ? { name: pickedCountry.name, code: pickedCountry.code, flag: pickedCountry.flag }
        : user?.country,
    };
    if (form.newPassword && form.newPassword.trim().length > 0) {
      payload.newPassword = form.newPassword.trim();
    }

    onSave?.(payload);
    onClose?.();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="2xl"
      backdrop="opaque"
      classNames={{ base: "rounded-2xl" }}
      hideCloseButton
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-start gap-1">
          <h2 className="text-2xl font-semibold">Editar Cliente</h2>
        </ModalHeader>
        <ModalBody>
          {/* Anti-autofill hack (ayuda a Chrome a no autocompletar) */}
          <input type="text" name="fake-user" autoComplete="username" style={{ display: "none" }} />
          <input type="password" name="fake-pass" autoComplete="new-password" style={{ display: "none" }} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto pr-1">
            <Input
              size="sm"
              label="Nombre"
              value={form.name}
              onChange={handleChange("name")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:user" width={18} />}
              isRequired
              autoComplete="off"
              spellCheck={false}
            />
            <Input
              size="sm"
              label="Apellido"
              value={form.surname}
              onChange={handleChange("surname")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:user" width={18} />}
              isRequired
              autoComplete="off"
              spellCheck={false}
            />

            <Input
              size="sm"
              type="date"
              label="Fecha nacimiento"
              value={form.birthday}
              onChange={handleChange("birthday")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:cake-variant-outline" width={18} />}
            />
            <Input
              size="sm"
              label="Fecha Actual"
              value={toISODate(new Date())}
              isReadOnly
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:calendar-today" width={18} />}
            />

            <Input
              size="sm"
              type="email"
              label="Correo electrónico"
              value={form.email}
              onChange={handleChange("email")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="majesticons:mail" width={18} />}
              isRequired
              autoComplete="off"
              spellCheck={false}
            />
            <Input
              size="sm"
              label="Dirección"
              value={form.address}
              onChange={handleChange("address")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:location" width={18} />}
              autoComplete="off"
              spellCheck={false}
            />

            <Input
              size="sm"
              type="tel"
              label="Celular"
              value={form.contactNumber}
              onChange={handleChange("contactNumber")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="ic:round-phone" width={18} />}
              autoComplete="off"
              spellCheck={false}
            />
            <Input
              size="sm"
              type="tel"
              label="Whatsapp"
              value={form.whatsapp}
              onChange={handleChange("whatsapp")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:whatsapp" width={18} color="#25D366" />}
              autoComplete="off"
              spellCheck={false}
            />

            <Select
              size="sm"
              label="País"
              variant="bordered"
              radius="sm"
              selectedKeys={new Set(form.countryName ? [form.countryName] : [])}
              onSelectionChange={(keys) => {
                const first = Array.from(keys)[0];
                setForm((f) => ({ ...f, countryName: String(first ?? "") }));
              }}
              startContent={<Icon icon="mdi:flag-outline" width={18} />}
              selectorIcon={<Icon icon="mdi:chevron-down" width={18} />}
              placeholder="Selecciona un país"
            >
              {countries.map((c) => (
                <SelectItem
                  key={c.name}
                  value={c.name}
                  startContent={
                    <img
                      src={c.flag}
                      alt={c.code}
                      width={16}
                      height={12}
                      className="rounded-[2px]"
                      loading="lazy"
                      decoding="async"
                    />
                  }
                >
                  {c.name}
                </SelectItem>
              ))}
            </Select>

            <Input
              size="sm"
              label="País Actual"
              value={user?.country?.name || ""}
              isReadOnly
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:map-marker" width={18} />}
            />

            <Input
              size="sm"
              label="Compañía"
              value={form.company}
              onChange={handleChange("company")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="duo-icons:building" width={18} />}
              autoComplete="off"
              spellCheck={false}
            />
            <Input
              size="sm"
              label="Moneda"
              value={form.currency}
              isReadOnly
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:currency-usd" width={18} />}
            />

            {/* Contraseña opcional (sin autofill) */}
            <Input
              size="sm"
              type="password"
              label="Cambiar Contraseña"
              value={form.newPassword}
              onChange={handleChange("newPassword")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:lock-outline" width={18} />}
              autoComplete="new-password"
              name="new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <Input
              size="sm"
              type="password"
              label="Confirmar Contraseña"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:lock-check-outline" width={18} />}
              autoComplete="new-password"
              name="confirm-new-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} className="text-foreground-600">
            Cancelar
          </Button>
          <Button
            color="primary"
            className="bg-[#00689B] text-white hover:opacity-95"
            onPress={handleSave}
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