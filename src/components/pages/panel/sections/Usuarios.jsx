import React, { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  addToast,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import UserDetailsModal from "./UserDetaiIsModal .jsx";
import UserEditModal from "./UserEditModal.jsx";

// Datos ficticios extendidos (shape similar a DB real)
const MOCK_USERS = [
  {
    id: 10566,
    name: "Benett",
    surname: "Martínez",
    email: "luce_danae2009@hotmail.es",
    currency: { code: "USD", name: "Dólar estadounidense" },
    country: { name: "Ecuador", code: "EC", flag: "https://flagcdn.com/w20/ec.png" },
    address: "Cantón Zumba",
    contactNumber: "982689340",
    whatsapp: "982689340",
    birthday: "1990-01-04",
    company: "Ninguna",
  },
  {
    id: 10554,
    name: "Jorge",
    surname: "Sislema",
    email: "jorgechafla77@gmail.com",
    currency: { code: "USD", name: "Dólar estadounidense" },
    country: { name: "Ecuador", code: "EC", flag: "https://flagcdn.com/w20/ec.png" },
    address: "Quito",
    contactNumber: "987653788",
    whatsapp: "987653788",
    birthday: "1999-04-14",
    company: "Chronos",
  },
  {
    id: 10584,
    name: "Juan",
    surname: "Ortiz Quintero",
    email: "juanortizquintero23@gmail.com",
    currency: { code: "MXN", name: "Peso mexicano" },
    country: { name: "México", code: "MX", flag: "https://flagcdn.com/w20/mx.png" },
    address: "CDMX",
    contactNumber: "5544332211",
    whatsapp: "5544332211",
    birthday: "1992-10-09",
    company: "N/A",
  },
  {
    id: 10363,
    name: "Luis",
    surname: "Casa",
    email: "fernandocasa1970@gmail.com",
    currency: { code: "USD", name: "Dólar estadounidense" },
    country: { name: "Ecuador", code: "EC", flag: "https://flagcdn.com/w20/ec.png" },
    address: "Guayaquil",
    contactNumber: "0999999999",
    whatsapp: "0999999999",
    birthday: "1991-02-20",
    company: "N/A",
  },
  {
    id: 10013,
    name: "Kristopher",
    surname: "Guzman",
    email: "kristopher.guzman@chronoswinvestment.com",
    currency: { code: "USD", name: "Dólar estadounidense" },
    country: { name: "Estados Unidos", code: "US", flag: "https://flagcdn.com/w20/us.png" },
    address: "Miami",
    contactNumber: "3050000000",
    whatsapp: "3050000000",
    birthday: "1988-08-01",
    company: "Chronos",
  },
];

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function AdminUsuarios() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState(MOCK_USERS);
  const [selected, setSelected] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return users;
    return users.filter((u) => {
      const fields = [
        u.id,
        u.name,
        u.surname,
        u.email,
        u.currency?.code,
        u.currency?.name,
        u.country?.name,
        u.country?.code,
        u.address,
        u.company,
        u.contactNumber,
        u.whatsapp,
      ]
        .filter(Boolean)
        .map((v) => normalize(v));
      return fields.some((f) => f.includes(q));
    });
  }, [users, query]);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombres" },
    { key: "surname", label: "Apellidos" },
    { key: "email", label: "E-mail" },
    { key: "currency", label: "Moneda" },
    { key: "country", label: "País" },
    { key: "more", label: "Ver Más" },
    { key: "edit", label: "Editar" },
    { key: "orders", label: "Ver Órdenes" },
    { key: "pdf", label: "Descargar PDF" },
    { key: "delete", label: "Eliminar usuario" },
  ];

  const handleOpenDetails = (u) => {
    setSelected(u);
    setOpenDetails(true);
  };
  const handleOpenEdit = (u) => {
    setSelected(u);
    setOpenEdit(true);
  };

  const handleSaveEdit = (data) => {
    setUsers((prev) => prev.map((u) => (u.id === data.id ? { ...u, ...data } : u)));
    addToast({
      title: "Usuario actualizado",
      description: `Se guardaron los cambios de #${data.id}.`,
      color: "success",
      duration: 2000,
    });
  };

  const handleOrders = (u) => {
    navigate(`/panel/usuarios/${u.id}/ordenes`, { state: { user: u } });
  };

  const handlePDF = (u) =>
    addToast({
      title: "Pendiente",
      description: `Descargar PDF de #${u.id} (lo conectamos luego).`,
      color: "danger",
      duration: 1800,
    });

  const handleDelete = (u) => {
    const ok = window.confirm(`¿Eliminar al usuario #${u.id} (${u.name} ${u.surname})?`);
    if (!ok) return;
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    addToast({
      title: "Usuario eliminado",
      description: `Se eliminó #${u.id}.`,
      color: "secondary",
      duration: 1800,
    });
  };

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6 space-y-4">
          <div className="text-sm text-default-500 flex items-center gap-2">
            <Icon icon="mdi:home-outline" width={18} />
            <span>Administrador</span>
            <Icon icon="mdi:chevron-right" width={16} />
            <span className="text-default-700 font-medium">Lista de clientes</span>
          </div>

          <div className="max-w-md">
            <Input
              placeholder="Buscar"
              startContent={<Icon icon="mdi:magnify" width={18} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="bordered"
              radius="lg"
              size="md"
            />
          </div>

          <Table
            aria-label="Lista de usuarios"
            removeWrapper
            classNames={{
              table: "rounded-2xl",
              th: "text-[11px] font-semibold text-default-500 uppercase tracking-wide bg-transparent",
              tr: "hover:bg-default-50/60",
              td: "text-sm",
            }}
          >
            <TableHeader columns={columns}>
              {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
            </TableHeader>
            <TableBody emptyContent="No hay usuarios para mostrar">
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.surname}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon icon="majesticons:mail" width={16} className="text-default-400" />
                      <span>{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color="default" className="font-medium">
                      {u.currency?.code || "—"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {u.country?.flag ? (
                        <img
                          src={u.country.flag}
                          alt={u.country?.code || u.country?.name || "flag"}
                          width={20}
                          height={14}
                          className="rounded-sm border border-default-200"
                          loading="lazy"
                        />
                      ) : (
                        <Icon icon="mdi:flag-outline" width={18} className="text-default-400" />
                      )}
                      <span>{u.country?.name || "—"}</span>
                    </div>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <Button
                      isIconOnly
                      radius="full"
                      size="sm"
                      variant="flat"
                      color="success"
                      onPress={() => handleOpenDetails(u)}
                      aria-label="Ver más"
                    >
                      <Icon icon="mdi:eye-outline" width={18} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      radius="full"
                      size="sm"
                      variant="flat"
                      color="warning"
                      onPress={() => handleOpenEdit(u)}
                      aria-label="Editar"
                    >
                      <Icon icon="mdi:pencil" width={18} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      radius="full"
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => handleOrders(u)}
                      aria-label="Ver órdenes"
                    >
                      <Icon icon="mdi:file-document-outline" width={18} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      radius="full"
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => handlePDF(u)}
                      aria-label="Descargar PDF"
                    >
                      <Icon icon="mdi:file-pdf-box" width={18} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      radius="full"
                      size="sm"
                      variant="flat"
                      color="secondary"
                      onPress={() => handleDelete(u)}
                      aria-label="Eliminar usuario"
                    >
                      <Icon icon="mdi:close-circle-outline" width={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modales */}
      <UserDetailsModal open={openDetails} onClose={() => setOpenDetails(false)} user={selected} />
      <UserEditModal open={openEdit} onClose={() => setOpenEdit(false)} user={selected} onSave={handleSaveEdit} />
    </div>
  );
}