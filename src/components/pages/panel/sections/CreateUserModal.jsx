import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Switch,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import countries from "../../../objetos/RegisterForm/paises.json";
import { checkRegistrationEmail } from "../../../services/users.service.js";

const initialForm = {
  name: "",
  surname: "",
  birthday: "",
  email: "",
  password: "",
  confirmPassword: "",
  address: "",
  company: "",
  contactNumber: "",
  whatsapp: "",
  sameWhatsapp: true,
  countryCode: "",
  role: "2",
  sendCredentials: false,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "El nombre es obligatorio";
  if (!form.surname.trim()) errors.surname = "El apellido es obligatorio";
  if (!emailPattern.test(form.email.trim())) errors.email = "Ingresa un correo válido";
  if (!form.address.trim()) errors.address = "La dirección es obligatoria";
  if (!form.company.trim()) errors.company = "La compañía es obligatoria";
  if (!form.contactNumber.trim()) errors.contactNumber = "El celular es obligatorio";
  else if (!/^\d+$/.test(form.contactNumber)) errors.contactNumber = "Ingresa solo números";
  if (!form.sameWhatsapp && !form.whatsapp.trim()) {
    errors.whatsapp = "Ingresa el número de WhatsApp";
  } else if (!form.sameWhatsapp && !/^\d+$/.test(form.whatsapp)) {
    errors.whatsapp = "Ingresa solo números";
  }
  if (!form.countryCode) errors.countryCode = "Selecciona un país";

  const birthday = new Date(form.birthday);
  const age = (Date.now() - birthday.getTime()) / 31557600000;
  if (!form.birthday || !Number.isFinite(age) || age < 18 || age > 100) {
    errors.birthday = "La edad debe estar entre 18 y 100 años";
  }

  if (form.password.length < 8 || !/\d/.test(form.password)) {
    errors.password = "Mínimo 8 caracteres y al menos un número";
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden";
  }
  return errors;
}

export default function CreateUserModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailState, setEmailState] = useState({ status: "idle", message: "" });

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setSubmitted(false);
      setEmailState({ status: "idle", message: "" });
    }
  }, [open]);

  const errors = useMemo(() => validate(form), [form]);
  const selectedCountry = countries.find((country) => country.code === form.countryCode);
  const setValue = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "contactNumber" && current.sameWhatsapp ? { whatsapp: value } : {}),
    }));
    if (key === "email") setEmailState({ status: "idle", message: "" });
  };

  const checkEmail = async () => {
    const email = form.email.trim().toLowerCase();
    if (!emailPattern.test(email)) return false;
    try {
      setEmailState({ status: "checking", message: "Verificando correo..." });
      const result = await checkRegistrationEmail(email);
      if (result.exists) {
        setEmailState({ status: "taken", message: "Este correo ya está registrado" });
        return false;
      }
      setEmailState({ status: "available", message: "Correo disponible" });
      return true;
    } catch {
      setEmailState({
        status: "error",
        message: "No se pudo verificar el correo. Intenta nuevamente.",
      });
      return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    const emailAvailable =
      emailState.status === "available" ? true : await checkEmail();
    if (!emailAvailable) return;

    try {
      setLoading(true);
      await onCreate({
        name: form.name.trim(),
        surname: form.surname.trim(),
        birthday: form.birthday,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        address: form.address.trim(),
        company: form.company.trim(),
        contactNumber: form.contactNumber.trim(),
        whatsapp: form.whatsapp.trim(),
        country: {
          name: selectedCountry.name,
          code: selectedCountry.ext,
          flag: `https://flagcdn.com/${selectedCountry.code.toLowerCase()}.svg`,
        },
        currency: { name: selectedCountry.currency },
        role: Number(form.role),
        sendCredentials: form.sendCredentials,
      });
      onClose();
    } catch {
      // El contenedor muestra el mensaje específico de la API.
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (key) => (submitted ? errors[key] : undefined);
  const today = new Date();
  const maxBirthday = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);
  const minBirthday = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);
  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", valid: form.password.length >= 8 },
    { label: "Al menos un número", valid: /\d/.test(form.password) },
  ];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      backdrop="opaque"
      classNames={{ base: "rounded-2xl", body: "py-5" }}
      isDismissable={!loading}
      hideCloseButton={loading}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-default-200">
          <h2 className="text-2xl font-semibold">Nuevo usuario</h2>
          <p className="text-sm font-normal text-default-500">
            Crea la cuenta y define sus datos iniciales de acceso.
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={setValue("name")} variant="bordered" isRequired isInvalid={Boolean(fieldError("name"))} errorMessage={fieldError("name")} startContent={<Icon icon="mdi:account-outline" width={18} />} />
            <Input label="Apellido" value={form.surname} onChange={setValue("surname")} variant="bordered" isRequired isInvalid={Boolean(fieldError("surname"))} errorMessage={fieldError("surname")} startContent={<Icon icon="mdi:account-outline" width={18} />} />
            <Input type="date" label="Fecha de nacimiento" value={form.birthday} onChange={setValue("birthday")} min={minBirthday} max={maxBirthday} variant="bordered" isRequired isInvalid={Boolean(fieldError("birthday"))} errorMessage={fieldError("birthday")} startContent={<Icon icon="mdi:cake-variant-outline" width={18} />} />
            <Input
              type="email"
              label="Correo electrónico"
              value={form.email}
              onChange={setValue("email")}
              onBlur={checkEmail}
              variant="bordered"
              isRequired
              isInvalid={Boolean(fieldError("email")) || emailState.status === "taken" || emailState.status === "error"}
              errorMessage={fieldError("email") || (["taken", "error"].includes(emailState.status) ? emailState.message : "")}
              description={emailState.status === "available" ? emailState.message : undefined}
              color={emailState.status === "available" ? "success" : "default"}
              startContent={<Icon icon="majesticons:mail" width={18} />}
              endContent={emailState.status === "checking" ? <Spinner size="sm" /> : null}
            />
            <Input label="Dirección" value={form.address} onChange={setValue("address")} variant="bordered" isRequired isInvalid={Boolean(fieldError("address"))} errorMessage={fieldError("address")} startContent={<Icon icon="mdi:map-marker-outline" width={18} />} />
            <Input label="Compañía" value={form.company} onChange={setValue("company")} variant="bordered" isRequired isInvalid={Boolean(fieldError("company"))} errorMessage={fieldError("company")} startContent={<Icon icon="mdi:office-building-outline" width={18} />} />
            <div className="md:col-span-2 rounded-xl border border-default-200 bg-default-50 p-3">
              <Switch
                isSelected={form.sameWhatsapp}
                onValueChange={(sameWhatsapp) =>
                  setForm((current) => ({
                    ...current,
                    sameWhatsapp,
                    whatsapp: sameWhatsapp ? current.contactNumber : "",
                  }))
                }
                size="sm"
              >
                El número de teléfono es igual al WhatsApp
              </Switch>
            </div>
            <Input type="tel" label="Celular" value={form.contactNumber} onChange={setValue("contactNumber")} variant="bordered" isRequired isInvalid={Boolean(fieldError("contactNumber"))} errorMessage={fieldError("contactNumber")} startContent={<Icon icon="mdi:phone-outline" width={18} />} />
            <Input type="tel" label="WhatsApp" value={form.whatsapp} onChange={setValue("whatsapp")} variant="bordered" isRequired={!form.sameWhatsapp} isDisabled={form.sameWhatsapp} isInvalid={Boolean(fieldError("whatsapp"))} errorMessage={fieldError("whatsapp")} description={form.sameWhatsapp ? "Se utilizará el mismo número de teléfono" : undefined} startContent={<Icon icon="mdi:whatsapp" width={18} />} />
            <Select label="País" variant="bordered" selectedKeys={form.countryCode ? new Set([form.countryCode]) : new Set()} onSelectionChange={(keys) => setForm((current) => ({ ...current, countryCode: String(Array.from(keys)[0] || "") }))} isRequired isInvalid={Boolean(fieldError("countryCode"))} errorMessage={fieldError("countryCode")} startContent={<Icon icon="mdi:flag-outline" width={18} />}>
              {countries.map((country) => <SelectItem key={country.code}>{country.name}</SelectItem>)}
            </Select>
            <Input label="Prefijo telefónico" value={selectedCountry?.ext || ""} isReadOnly variant="bordered" startContent={<Icon icon="mdi:phone-plus-outline" width={18} />} />
            <Input label="Moneda" value={selectedCountry?.currency || ""} isReadOnly variant="bordered" startContent={<Icon icon="mdi:cash" width={18} />} />
            <Select label="Rol" variant="bordered" selectedKeys={new Set([form.role])} onSelectionChange={(keys) => setForm((current) => ({ ...current, role: String(Array.from(keys)[0] || "2") }))} startContent={<Icon icon="mdi:shield-account-outline" width={18} />}>
              <SelectItem key="2">user</SelectItem>
              <SelectItem key="1">admin</SelectItem>
            </Select>
            <Input type="password" label="Contraseña temporal" value={form.password} onChange={setValue("password")} variant="bordered" isRequired isInvalid={Boolean(fieldError("password"))} errorMessage={fieldError("password")} autoComplete="new-password" startContent={<Icon icon="mdi:lock-outline" width={18} />} />
            <Input type="password" label="Confirmar contraseña" value={form.confirmPassword} onChange={setValue("confirmPassword")} variant="bordered" isRequired isInvalid={Boolean(fieldError("confirmPassword"))} errorMessage={fieldError("confirmPassword")} autoComplete="new-password" startContent={<Icon icon="mdi:lock-check-outline" width={18} />} />
          </div>

          <div className="rounded-xl border border-default-200 p-4 text-sm">
            <p className="mb-2 font-medium">La contraseña debe tener:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {passwordRequirements.map((requirement) => (
                <div key={requirement.label} className={`flex items-center gap-2 ${requirement.valid ? "text-success-600" : "text-danger-500"}`}>
                  <Icon icon={requirement.valid ? "mdi:check-circle" : "mdi:close-circle"} width={18} />
                  <span>{requirement.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 rounded-xl border border-default-200 bg-default-50 p-4">
            <Checkbox isSelected={form.sendCredentials} onValueChange={(sendCredentials) => setForm((current) => ({ ...current, sendCredentials }))}>
              Enviar por correo el enlace/credenciales de acceso al usuario
            </Checkbox>
            <p className="mt-2 ml-7 text-xs text-default-500">
              En el primer ingreso deberá establecer una contraseña nueva.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-default-200">
          <Button variant="flat" onPress={onClose} isDisabled={loading}>Cancelar</Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading || emailState.status === "checking"} isDisabled={emailState.status === "taken"} startContent={!loading && emailState.status !== "checking" && <Icon icon="mdi:account-plus-outline" width={18} />}>
            Crear usuario
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
