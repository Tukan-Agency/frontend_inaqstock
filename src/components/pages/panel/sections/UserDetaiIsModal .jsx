import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-default-500">
        <Icon icon={icon} width={18} />
        <span>{label}</span>
      </div>
      <div className="text-default-900">{value || "—"}</div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function UserDetailsModal({ open, onClose, user }) {
  return (
    <Modal isOpen={open} onClose={onClose} size="xl" classNames={{ base: "rounded-2xl" }}>
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">Más Detalles</ModalHeader>
        <ModalBody>
          <Card className="bg-default-50 dark:bg-default-100 border border-default-200 rounded-xl">
            <CardBody className="divide-y divide-default-200">
              <Row icon="ic:round-phone" label="Celular" value={user?.contactNumber} />
              <Row icon="mdi:cake-variant-outline" label="Fecha de Nacimiento" value={formatDate(user?.birthday)} />
              <Row icon="mdi:location" label="Dirección" value={user?.address} />
              <Row icon="duo-icons:building" label="Compañía" value={user?.company} />
              <Row icon="mdi:whatsapp" label="Whatsapp" value={user?.whatsapp} />
            </CardBody>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}