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

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      id: user.id,
      name: user.name || "",
      surname: user.surname || "",
      birthday: toISODate(user.birthday) || "",
      email: user.email || "",
      address: user.address || "",
      contactNumber: user.contactNumber || "",
      whatsapp: user.whatsapp || "",
      countryName: user.country?.name || "",
      company: user.company || "",
      currency: user.currency?.code || "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [open, user]);

  const isValid = useMemo(() => {
    if (!form.name.trim() || !form.surname.trim() || !form.email.trim()) return false;
    if (form.newPassword && form.newPassword.length < 6) return false;
    if (form.newPassword && form.newPassword !== form.confirmPassword) return false;
    return true;
  }, [form]);

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const countries = FALLBACK_COUNTRIES;

  const handleSave = () => {
    if (!isValid) {
      addToast({
        title: "Revisa los campos",
        description:
          form.newPassword && form.newPassword !== form.confirmPassword
            ? "Las contraseñas no coinciden."
            : "Completa los campos obligatorios.",
        color: "warning",
        duration: 2000,
      });
      return;
    }
    // Emitimos hacia el padre
    const pickedCountry =
      countries.find((c) => c.name === form.countryName) ||
      user?.country ||
      null;

    onSave?.({
      ...user,
      id: form.id,
      name: form.name.trim(),
      surname: form.surname.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      contactNumber: form.contactNumber.trim(),
      whatsapp: form.whatsapp.trim(),
      birthday: form.birthday || user?.birthday,
      company: form.company, // normalmente read-only
      currency: { code: form.currency || user?.currency?.code, name: user?.currency?.name },
      country: pickedCountry
        ? { name: pickedCountry.name, code: pickedCountry.code, flag: pickedCountry.flag }
        : user?.country,
      // newPassword: form.newPassword // cuando conectemos backend
    });

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
            />
            <Input
              size="sm"
              label="Dirección"
              value={form.address}
              onChange={handleChange("address")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:location" width={18} />}
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
                <SelectItem key={c.name} value={c.name} startContent={<img src={c.flag} alt={c.code} width={16} height={12} className="rounded-[2px]" />}>
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

            {/* Contraseña opcional */}
            <Input
              size="sm"
              type="password"
              label="Cambiar Contraseña"
              value={form.newPassword}
              onChange={handleChange("newPassword")}
              radius="sm"
              variant="bordered"
              startContent={<Icon icon="mdi:lock-outline" width={18} />}
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