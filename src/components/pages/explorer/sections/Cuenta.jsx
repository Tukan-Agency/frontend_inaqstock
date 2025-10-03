import { Card, CardBody } from "@heroui/card";
import AccountInfo from "../sections/components/Accountlnfo.jsx";
import ChangePasswordForm from "./components/ChangePasswordCard.jsx";
import { changeMyPassword } from "../../../services/account.js"; // NUEVO import
// Si tu ruta real difiere, ajústala

export default function Cuenta() {
  const handleChangePassword = async (pwd) => {
    if (!pwd) return;
    try {
      await changeMyPassword(pwd);
      // TODO: toast.success("Contraseña actualizada");
      console.log("Contraseña actualizada");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo actualizar la contraseña";
      // TODO: toast.error(msg);
      console.error("changeMyPassword error:", msg);
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de la cuenta (2/3) */}
        <section className="lg:col-span-2">
          <Card className="border border-solid border-black/10">
            <CardBody className="p-6">
              <header className="mb-4">
                <h2 className="text-xl font-semibold">Información de la cuenta</h2>
                <p className="text-foreground/60">
                  Actualiza aquí tu información personal
                </p>
              </header>
              <AccountInfo />
            </CardBody>
          </Card>
        </section>

        {/* Cambiar contraseña (1/3) */}
        <section>
          <Card className="border border-solid border-black/10">
            <CardBody className="p-6">
              <header className="mb-4">
                <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
                <p className="text-foreground/60">
                  Actualiza aquí tu contraseña de acceso
                </p>
              </header>
              <ChangePasswordForm onSubmit={handleChangePassword} />
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}