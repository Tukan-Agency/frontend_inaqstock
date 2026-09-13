import React, { useState, useEffect, useRef } from "react";
import { SettingsService } from "../../components/services/settingsService.js";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Spinner,
  Image,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSettings } from "../../context/SettingsContext.jsx";
import { fixAssetUrl, writeBrandingCache } from "../../utils/branding.js";

function SecretInput({ label, value, onChange, description }) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      label={label}
      value={value}
      onChange={onChange}
      variant="bordered"
      type={visible ? "text" : "password"}
      description={description}
      endContent={
        <button
          type="button"
          className="focus:outline-none"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar" : "Mostrar"}
        >
          <Icon
            icon={visible ? "solar:eye-closed-bold" : "solar:eye-bold"}
            width={20}
            className="text-default-400"
          />
        </button>
      }
    />
  );
}

export default function Settings() {
  const { refreshSettings, refreshBranding } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const lightInputRef = useRef(null);
  const darkInputRef = useRef(null);

  const [formData, setFormData] = useState({
    platformTitle: "",
    logoSize: "100",
    logoSizeUnit: "px",
    apiKeys: { resend: "", polygon: "", openRouter: "" },
    smtp: { host: "", port: "465", user: "", pass: "", from: "" },
  });

  const [logoLightUrl, setLogoLightUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState("");
  const [fileLight, setFileLight] = useState(null);
  const [fileDark, setFileDark] = useState(null);
  const [previewLight, setPreviewLight] = useState(null);
  const [previewDark, setPreviewDark] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await SettingsService.getSettings();
      if (res.ok && res.data) {
        setFormData({
          platformTitle: res.data.platformTitle || "",
          logoSize: String(res.data.logoSize || 100),
          logoSizeUnit: res.data.logoSizeUnit === "%" ? "%" : "px",
          apiKeys: {
            resend: res.data.resendApiKey || "",
            polygon: res.data.polygonApiKey || "",
            openRouter: res.data.openRouterApiKey || "",
          },
          smtp: {
            host: res.data.smtpHost || "",
            port: String(res.data.smtpPort || 465),
            user: res.data.smtpUser || "",
            pass: res.data.smtpPass || "",
            from: res.data.emailFrom || "",
          },
        });
        if (res.data.logoLight) setLogoLightUrl(fixAssetUrl(res.data.logoLight));
        if (res.data.logoDark) setLogoDarkUrl(fixAssetUrl(res.data.logoDark));
      }
    } catch (error) {
      console.error("Error cargando ajustes:", error);
      addToast({
        title: "Error",
        description: "No se pudieron cargar los ajustes",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setFormData((prev) => {
      if (section === "root") return { ...prev, [field]: value };
      return { ...prev, [section]: { ...prev[section], [field]: value } };
    });
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast({
        title: "Archivo muy grande",
        description: "El logo no debe pesar más de 2MB",
        color: "warning",
      });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    if (type === "light") {
      setFileLight(file);
      setPreviewLight(objectUrl);
    } else {
      setFileDark(file);
      setPreviewDark(objectUrl);
    }
  };

  const handleRemoveLocal = (type) => {
    if (type === "light") {
      setFileLight(null);
      setPreviewLight(null);
      setLogoLightUrl("");
    } else {
      setFileDark(null);
      setPreviewDark(null);
      setLogoDarkUrl("");
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const dataToSend = new FormData();
      dataToSend.append("platformTitle", formData.platformTitle);
      dataToSend.append("logoSize", formData.logoSize);
      dataToSend.append("logoSizeUnit", formData.logoSizeUnit);
      dataToSend.append("resendApiKey", formData.apiKeys.resend);
      dataToSend.append("polygonApiKey", formData.apiKeys.polygon);
      dataToSend.append("openRouterApiKey", formData.apiKeys.openRouter);
      dataToSend.append("smtpHost", formData.smtp.host);
      dataToSend.append("smtpPort", formData.smtp.port);
      dataToSend.append("smtpUser", formData.smtp.user);
      dataToSend.append("smtpPass", formData.smtp.pass);
      dataToSend.append("emailFrom", formData.smtp.from);
      if (fileLight) dataToSend.append("logoLight", fileLight);
      if (fileDark) dataToSend.append("logoDark", fileDark);

      const res = await SettingsService.updateSettings(dataToSend);
      if (res.ok) {
        addToast({
          title: "Guardado",
          description: "Ajustes actualizados correctamente",
          color: "success",
        });
        const light = res.data.logoLight ? fixAssetUrl(res.data.logoLight) : logoLightUrl;
        const dark = res.data.logoDark ? fixAssetUrl(res.data.logoDark) : logoDarkUrl;
        if (light) setLogoLightUrl(light);
        if (dark) setLogoDarkUrl(dark);
        setPreviewLight(null);
        setPreviewDark(null);
        setFileLight(null);
        setFileDark(null);
        writeBrandingCache({
          platformTitle: formData.platformTitle,
          logoLight: light,
          logoDark: dark,
          logoSize: Number(formData.logoSize) || 100,
          logoSizeUnit: formData.logoSizeUnit,
        });
        await Promise.all([refreshSettings?.(), refreshBranding?.()]);
      }
    } catch (error) {
      console.error("Error guardando ajustes:", error);
      addToast({
        title: "Error",
        description: "Error al guardar los cambios",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const previewSizeStyle =
    formData.logoSizeUnit === "%"
      ? { width: `${formData.logoSize}%`, height: "auto" }
      : { width: Number(formData.logoSize) || 100, height: "auto" };

  return (
    <div className="w-full p-4 md:p-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Icon icon="solar:settings-bold-duotone" width={28} />
        Ajustes de la Plataforma
      </h1>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="border border-default-200">
            <CardHeader className="pb-0 text-lg font-semibold">General</CardHeader>
            <CardBody className="gap-4">
              <Input
                label="Nombre de la Plataforma"
                value={formData.platformTitle}
                onChange={(e) => handleChange("root", "platformTitle", e.target.value)}
                placeholder="Ej: Nydaqstock"
                variant="bordered"
              />
            </CardBody>
          </Card>

          <Card className="border border-default-200">
            <CardHeader className="pb-0 text-lg font-semibold">Tamaño del logo</CardHeader>
            <CardBody className="gap-4">
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <Input
                  label="Tamaño"
                  type="number"
                  min={8}
                  max={formData.logoSizeUnit === "%" ? 100 : 1000}
                  value={formData.logoSize}
                  onChange={(e) => handleChange("root", "logoSize", e.target.value)}
                  variant="bordered"
                  description={formData.logoSizeUnit === "%" ? "Porcentaje del contenedor (8–100)" : "Píxeles (8–1000)"}
                />
                <Select
                  label="Unidad"
                  selectedKeys={[formData.logoSizeUnit]}
                  onSelectionChange={(keys) => {
                    const unit = Array.from(keys)[0] || "px";
                    handleChange("root", "logoSizeUnit", unit);
                  }}
                  variant="bordered"
                >
                  <SelectItem key="px">px</SelectItem>
                  <SelectItem key="%">%</SelectItem>
                </Select>
              </div>
              <div className="rounded-xl border border-dashed border-default-300 bg-default-50 p-4">
                <p className="mb-2 text-xs text-default-500">Vista previa del tamaño</p>
                <div className="flex h-24 items-center justify-center overflow-hidden">
                  {(previewLight || logoLightUrl || previewDark || logoDarkUrl) ? (
                    <img
                      src={previewLight || logoLightUrl || previewDark || logoDarkUrl}
                      alt="Preview tamaño"
                      style={previewSizeStyle}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-xs text-default-400">Sube un logo para previsualizar</span>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-default-200">
            <CardHeader className="pb-0 text-lg font-semibold">Logo modo claro</CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-default-300 bg-gray-100">
                  {previewLight || logoLightUrl ? (
                    <Image
                      src={previewLight || logoLightUrl}
                      alt="Logo Light"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <Icon icon="solar:gallery-wide-linear" className="text-default-400" width={32} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" color="primary" variant="flat" onPress={() => lightInputRef.current.click()}>
                    Subir logo light
                  </Button>
                  {(previewLight || logoLightUrl) && (
                    <Button size="sm" color="danger" variant="light" onPress={() => handleRemoveLocal("light")}>
                      Quitar
                    </Button>
                  )}
                  <input
                    type="file"
                    ref={lightInputRef}
                    className="hidden"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleFileSelect(e, "light")}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-default-200">
            <CardHeader className="pb-0 text-lg font-semibold">Logo modo oscuro</CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-default-300 bg-gray-900">
                  {previewDark || logoDarkUrl ? (
                    <Image
                      src={previewDark || logoDarkUrl}
                      alt="Logo Dark"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <Icon icon="solar:gallery-wide-linear" className="text-default-400" width={32} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" color="secondary" variant="flat" onPress={() => darkInputRef.current.click()}>
                    Subir logo dark
                  </Button>
                  {(previewDark || logoDarkUrl) && (
                    <Button size="sm" color="danger" variant="light" onPress={() => handleRemoveLocal("dark")}>
                      Quitar
                    </Button>
                  )}
                  <input
                    type="file"
                    ref={darkInputRef}
                    className="hidden"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handleFileSelect(e, "dark")}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border border-default-200">
            <CardHeader className="pb-0 text-lg font-semibold">APIs de mercado</CardHeader>
            <CardBody className="gap-5">
              <SecretInput
                label="Polygon / Massive API Key"
                value={formData.apiKeys.polygon}
                onChange={(e) => handleChange("apiKeys", "polygon", e.target.value)}
                description="Se usa para precios e historiales. Déjala con •••• si no quieres cambiarla."
              />
              <SecretInput
                label="OpenRouter API Key (opcional)"
                value={formData.apiKeys.openRouter}
                onChange={(e) => handleChange("apiKeys", "openRouter", e.target.value)}
              />
              <SecretInput
                label="Resend API Key (legado)"
                value={formData.apiKeys.resend}
                onChange={(e) => handleChange("apiKeys", "resend", e.target.value)}
              />
            </CardBody>
          </Card>

          <Card className="border border-default-200">
            <CardHeader className="pb-0 text-lg font-semibold">Correo SMTP</CardHeader>
            <CardBody className="gap-4">
              <Input
                label="Host SMTP"
                value={formData.smtp.host}
                onChange={(e) => handleChange("smtp", "host", e.target.value)}
                placeholder="mail.tudominio.com"
                variant="bordered"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Puerto"
                  value={formData.smtp.port}
                  onChange={(e) => handleChange("smtp", "port", e.target.value)}
                  variant="bordered"
                />
                <Input
                  label="Usuario"
                  value={formData.smtp.user}
                  onChange={(e) => handleChange("smtp", "user", e.target.value)}
                  variant="bordered"
                />
              </div>
              <SecretInput
                label="Contraseña SMTP"
                value={formData.smtp.pass}
                onChange={(e) => handleChange("smtp", "pass", e.target.value)}
                description="Déjala con •••• si no quieres rotarla."
              />
              <Input
                label="Remitente (From)"
                value={formData.smtp.from}
                onChange={(e) => handleChange("smtp", "from", e.target.value)}
                placeholder="Nydaqstock <noreply@tudominio.com>"
                variant="bordered"
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex justify-end pb-10">
        <Button
          color="primary"
          size="lg"
          className="px-8 font-semibold"
          isLoading={saving}
          onPress={handleSubmit}
          startContent={!saving && <Icon icon="solar:diskette-bold" />}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
