import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { IncidentsService } from "../../../services/settingsService.js";

function statusColor(status) {
  if (status === "ok") return "success";
  if (status === "unconfigured") return "warning";
  if (status === "degraded") return "warning";
  return "danger";
}

function severityColor(severity) {
  if (severity === "info") return "primary";
  if (severity === "warning") return "warning";
  if (severity === "critical") return "danger";
  return "danger";
}

export default function Incidentes() {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [openCount, setOpenCount] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [healthRes, listRes] = await Promise.all([
        IncidentsService.health(),
        IncidentsService.list({ limit: 100 }),
      ]);
      if (healthRes.ok) setHealth(healthRes.data);
      if (listRes.ok) {
        setIncidents(listRes.items || []);
        setOpenCount(listRes.openCount || 0);
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudieron cargar los incidentes",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runChecks = async () => {
    try {
      setChecking(true);
      const res = await IncidentsService.health();
      if (res.ok) {
        setHealth(res.data);
        addToast({
          title: "Verificación completada",
          description: res.data.ok ? "Polygon y SMTP OK" : "Hay servicios con fallos",
          color: res.data.ok ? "success" : "warning",
        });
      }
      const listRes = await IncidentsService.list({ limit: 100 });
      if (listRes.ok) {
        setIncidents(listRes.items || []);
        setOpenCount(listRes.openCount || 0);
      }
    } catch (error) {
      addToast({ title: "Error", description: "No se pudo verificar servicios", color: "danger" });
    } finally {
      setChecking(false);
    }
  };

  const resolve = async (id) => {
    try {
      await IncidentsService.resolve(id);
      addToast({ title: "Resuelto", description: "Incidente marcado como resuelto", color: "success" });
      load();
    } catch {
      addToast({ title: "Error", description: "No se pudo resolver", color: "danger" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Spinner size="lg" />
      </div>
    );
  }

  const polygon = health?.services?.polygon;
  const smtp = health?.services?.smtp;

  return (
    <div className="w-full space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Icon icon="solar:danger-triangle-bold-duotone" width={28} />
            Registros de incidentes
          </h1>
          <p className="mt-1 text-sm text-default-500">
            Estado de Polygon, SMTP y correos. Abiertos: {openCount}
          </p>
        </div>
        <Button
          color="primary"
          isLoading={checking}
          onPress={runChecks}
          startContent={!checking && <Icon icon="solar:refresh-bold" />}
        >
          Verificar ahora
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border border-default-200">
          <CardHeader className="flex items-center justify-between">
            <span className="font-semibold">Polygon / Massive</span>
            {polygon && <Chip color={statusColor(polygon.status)} variant="flat">{polygon.status}</Chip>}
          </CardHeader>
          <CardBody className="gap-2 text-sm">
            <p>{polygon?.message || "Sin datos"}</p>
            {polygon?.code && <p className="text-default-400">Código: {polygon.code}</p>}
            {polygon?.checkedAt && (
              <p className="text-xs text-default-400">
                {new Date(polygon.checkedAt).toLocaleString()}
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="border border-default-200">
          <CardHeader className="flex items-center justify-between">
            <span className="font-semibold">Correo SMTP</span>
            {smtp && <Chip color={statusColor(smtp.status)} variant="flat">{smtp.status}</Chip>}
          </CardHeader>
          <CardBody className="gap-2 text-sm">
            <p>{smtp?.message || "Sin datos"}</p>
            {smtp?.code && <p className="text-default-400">Código: {smtp.code}</p>}
            {smtp?.details?.host && (
              <p className="text-default-400">
                {smtp.details.host}:{smtp.details.port} · {smtp.details.user || "sin usuario"}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="border border-default-200">
        <CardHeader className="font-semibold">Historial</CardHeader>
        <CardBody>
          <Table aria-label="Incidentes" removeWrapper>
            <TableHeader>
              <TableColumn>Fecha</TableColumn>
              <TableColumn>Servicio</TableColumn>
              <TableColumn>Severidad</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn>Detalle</TableColumn>
              <TableColumn>Acción</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Sin incidentes registrados">
              {incidents.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="uppercase text-xs">{item.service}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={severityColor(item.severity)} variant="flat">
                      {item.severity}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={item.status === "open" ? "danger" : "success"} variant="flat">
                      {item.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-default-500">{item.message}</div>
                      {item.code ? <div className="text-xs text-default-400">{item.code}</div> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.status === "open" ? (
                      <Button size="sm" variant="flat" onPress={() => resolve(item._id)}>
                        Resolver
                      </Button>
                    ) : (
                      <span className="text-xs text-default-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
