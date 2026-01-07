import React, { useState, useEffect, useRef } from "react";
import { SettingsService } from "../../components/services/settingsService.js";
import { Card, CardBody, CardHeader, Input, Button, Divider, Spinner, Image, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSettings } from "../../context/SettingsContext.jsx";

export default function Settings() {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Referencias para los inputs de archivo
  const lightInputRef = useRef(null);
  const darkInputRef = useRef(null);

  // Estado del formulario de textos
  const [formData, setFormData] = useState({
    platformTitle: "",
    apiKeys: { resend: "", polygon: "", openRouter: "" }
  });
  
  // Estados para URLs (lo que viene del backend)
  const [logoLightUrl, setLogoLightUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState("");

  // Estados para archivos seleccionados (lo que vas a subir)
  const [fileLight, setFileLight] = useState(null);
  const [fileDark, setFileDark] = useState(null);
  
  // Estados para previews locales
  const [previewLight, setPreviewLight] = useState(null);
  const [previewDark, setPreviewDark] = useState(null);

  useEffect(() => { loadSettings(); }, []);

  const getFullUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${baseUrl.replace('/api', '')}${path}`;
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await SettingsService.getSettings();
      if (res.ok && res.data) {
        setFormData({
          platformTitle: res.data.platformTitle || "",
          apiKeys: {
            resend: res.data.resendApiKey || "",
            polygon: res.data.polygonApiKey || "",
            openRouter: res.data.openRouterApiKey || ""
          }
        });

        if (res.data.logoLight) setLogoLightUrl(getFullUrl(res.data.logoLight));
        if (res.data.logoDark) setLogoDarkUrl(getFullUrl(res.data.logoDark));
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

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      platformTitle: field === "platformTitle" ? value : prev.platformTitle,
      apiKeys: field !== "platformTitle" ? { ...prev.apiKeys, [field]: value } : prev.apiKeys
    }));
  };

  // Manejo genérico de selección de archivo
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        addToast({
          title: "Archivo muy grande",
          description: "El logo no debe pesar más de 2MB",
          color: "warning",
        });
        return;
      }

      const objectUrl = URL.createObjectURL(file);

      if (type === 'light') {
        setFileLight(file);
        setPreviewLight(objectUrl);
      } else {
        setFileDark(file);
        setPreviewDark(objectUrl);
      }
    }
  };

  const handleRemoveLocal = (type) => {
    if (type === 'light') {
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
      
      // Textos
      dataToSend.append("platformTitle", formData.platformTitle);
      dataToSend.append("resendApiKey", formData.apiKeys.resend);
      dataToSend.append("polygonApiKey", formData.apiKeys.polygon);
      dataToSend.append("openRouterApiKey", formData.apiKeys.openRouter);

      // Archivos (solo si existen)
      if (fileLight) dataToSend.append("logoLight", fileLight);
      if (fileDark) dataToSend.append("logoDark", fileDark);

      const res = await SettingsService.updateSettings(dataToSend);
      
      if (res.ok) {
        addToast({
          title: "Guardado",
          description: "Ajustes actualizados correctamente",
          color: "success",
        });

        // Actualizar estados locales con la respuesta del server
        if (res.data.logoLight) {
           setLogoLightUrl(getFullUrl(res.data.logoLight));
           setPreviewLight(null);
           setFileLight(null);
        }
        if (res.data.logoDark) {
           setLogoDarkUrl(getFullUrl(res.data.logoDark));
           setPreviewDark(null);
           setFileDark(null);
        }

        // Refrescar contexto global para que el Navbar se actualice solo
        refreshSettings();
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

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

  return (
    <div className="w-full p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Icon icon="solar:settings-bold-duotone" width={28} />
        Ajustes de la Plataforma
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* === COLUMNA IZQUIERDA: APARIENCIA === */}
        <div className="flex flex-col gap-6">
          <Card className="border border-default-200">
            <CardHeader className="font-semibold text-lg pb-0">General</CardHeader>
            <CardBody className="gap-4">
              <div>
                <label className="text-sm text-default-500 mb-1 block">Nombre de la Plataforma</label>
                <Input 
                  value={formData.platformTitle}
                  onChange={(e) => handleChange("platformTitle", e.target.value)}
                  placeholder="Ej: InaqStock Pro"
                  variant="bordered"
                />
              </div>
            </CardBody>
          </Card>

          {/* LOGO MODO CLARO */}
          <Card className="border border-default-200">
            <CardHeader className="font-semibold text-lg pb-0">Logo Modo Claro</CardHeader>
            <CardBody>
              <p className="text-xs text-default-400 mb-3">
                Este logo se mostrará cuando el usuario use el tema claro (fondo blanco).
              </p>
              <div className="flex items-center gap-4">
                {/* Fondo GRIS CLARO para simular el tema light */}
                <div className="relative w-24 h-24 rounded-xl border border-dashed border-default-300 flex items-center justify-center overflow-hidden bg-gray-100">
                  {previewLight || logoLightUrl ? (
                    <Image src={previewLight || logoLightUrl} alt="Logo Light" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Icon icon="solar:gallery-wide-linear" className="text-default-400" width={32} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" color="primary" variant="flat" onClick={() => lightInputRef.current.click()}>
                    Subir Logo Light
                  </Button>
                  {(previewLight || logoLightUrl) && (
                    <Button size="sm" color="danger" variant="light" onClick={() => handleRemoveLocal('light')}>
                      Eliminar
                    </Button>
                  )}
                  <input type="file" ref={lightInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'light')} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* LOGO MODO OSCURO */}
          <Card className="border border-default-200">
            <CardHeader className="font-semibold text-lg pb-0">Logo Modo Oscuro</CardHeader>
            <CardBody>
              <p className="text-xs text-default-400 mb-3">
                Este logo se mostrará cuando el usuario use el tema oscuro (fondo negro).
              </p>
              <div className="flex items-center gap-4">
                {/* Fondo NEGRO/OSCURO para simular el tema dark */}
                <div className="relative w-24 h-24 rounded-xl border border-dashed border-default-300 flex items-center justify-center overflow-hidden bg-gray-900">
                  {previewDark || logoDarkUrl ? (
                    <Image src={previewDark || logoDarkUrl} alt="Logo Dark" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Icon icon="solar:gallery-wide-linear" className="text-default-400" width={32} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" color="secondary" variant="flat" onClick={() => darkInputRef.current.click()}>
                    Subir Logo Dark
                  </Button>
                  {(previewDark || logoDarkUrl) && (
                    <Button size="sm" color="danger" variant="light" onClick={() => handleRemoveLocal('dark')}>
                      Eliminar
                    </Button>
                  )}
                  <input type="file" ref={darkInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'dark')} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* === COLUMNA DERECHA: API KEYS === */}
        <Card className="border border-default-200 h-fit">
          <CardHeader className="font-semibold text-lg pb-0">Configuración de APIs</CardHeader>
          <CardBody className="gap-5">
            <Input label="Resend API Key" value={formData.apiKeys.resend} onChange={(e) => handleChange("resend", e.target.value)} variant="bordered" type="password" />
            <Input label="Polygon.io API Key" value={formData.apiKeys.polygon} onChange={(e) => handleChange("polygon", e.target.value)} variant="bordered" type="password" />
            <Input label="OpenRouter API Key" value={formData.apiKeys.openRouter} onChange={(e) => handleChange("openRouter", e.target.value)} variant="bordered" type="password" />
          </CardBody>
        </Card>

      </div>

      <div className="mt-8 flex justify-end pb-10">
         <Button color="primary" size="lg" className="font-semibold px-8" isLoading={saving} onClick={handleSubmit} startContent={!saving && <Icon icon="solar:diskette-bold" />}>
           Guardar Cambios
         </Button>
      </div>
    </div>
  );
}