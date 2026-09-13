import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import Chart from "react-apexcharts";
import { dashboardService } from "../../../services/dashboard.service.js";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRequests: 0,
    totalMovements: 0,
    countries: [],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // FIX: mostrar todo el historial (no solo últimos 30 días)
        const data = await dashboardService.getOverview({ range: "all" });
        if (!cancelled) setStats(data);
      } catch (e) {
        console.error("[Dashboard] getOverview error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryColor = "#00689b";
  const countriesSorted = useMemo(
    () => [...(stats.countries || [])].sort((a, b) => b.users - a.users).slice(0, 10),
    [stats.countries]
  );

  const chartOptions = useMemo(
    () => ({
      chart: { type: "area", height: 360, toolbar: { show: false }, background: "transparent", zoom: { enabled: false } },
      dataLabels: {
        enabled: true,
        style: { fontSize: "11px", colors: [primaryColor], fontWeight: 300 },
        background: { enabled: true, foreColor: "#fff", borderRadius: 2, padding: 4, opacity: 0.9, borderWidth: 1, borderColor: primaryColor },
      },
      stroke: { curve: "smooth", width: 3, colors: [primaryColor] },
      markers: { size: 5, colors: [primaryColor], strokeColors: "#fff", strokeWidth: 2, hover: { size: 7 } },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 100],
          colorStops: [
            { offset: 0, color: primaryColor, opacity: 0.4 },
            { offset: 100, color: primaryColor, opacity: 0.1 },
          ],
        },
      },
      xaxis: {
        categories: countriesSorted.map((c) => c.name),
        labels: {
          style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px", fontFamily: "Inter, sans-serif" },
          rotate: -25,
          maxHeight: 60,
          trim: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: { show: false },
      },
      yaxis: {
        show: true,
        labels: {
          style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px", fontFamily: "Inter, sans-serif" },
          formatter: (val) => String(Math.round(val)),
        },
        title: { text: "Usuarios" },
      },
      grid: {
        show: true,
        borderColor: "var(--nextui-colors-default-200)",
        strokeDashArray: 0,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      tooltip: { shared: false, intersect: true, theme: "light", style: { fontSize: "12px", fontFamily: "Inter, sans-serif" }, y: { formatter: (val) => `${val} usuarios` } },
      legend: { show: false },
      colors: [primaryColor],
    }),
    [countriesSorted]
  );

  const chartSeries = useMemo(
    () => [{ name: "Usuarios", data: countriesSorted.map((c) => c.users) }],
    [countriesSorted]
  );

  if (loading) {
    return (
      <div className="p-6">
        <Card className="shadow-none rounded-3xl">
          <CardBody className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
            <Skeleton className="h-6 w-60 rounded-md" />
            <Skeleton className="h-[360px] w-full rounded-2xl" />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Panel de administración</h1>
            <p className="text-default-500">Resumen general del sistema</p>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Total de usuarios" value={stats.totalUsers} icon="mdi:account-group" color="text-blue-600" bg="bg-blue-500/10" />
            <MetricCard title="Total de solicitudes" value={stats.totalRequests} icon="mdi:clipboard-text" color="text-amber-600" bg="bg-amber-500/10" />
            <MetricCard title="Total movimientos" value={stats.totalMovements} icon="mdi:swap-horizontal" color="text-emerald-600" bg="bg-emerald-500/10" />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-default-700">Países con más usuarios</h3>
              <div className="hidden md:flex items-center gap-2">
                {countriesSorted.slice(0, 5).map((c) => (
                  <Chip
                    key={c.code || c.name}
                    size="sm"
                    variant="flat"
                    className="font-medium"
                    startContent={
                      <img
                        src={c.flag}
                        alt={c.code || c.name}
                        width={16}
                        height={12}
                        className="rounded-[2px] border border-default-200"
                        loading="lazy"
                      />
                    }
                  >
                    {c.name}: {c.users}
                  </Chip>
                ))}
              </div>
            </div>

            <Chart options={chartOptions} series={chartSeries} type="area" height={360} />
          </section>
        </CardBody>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon, color, bg }) {
  const formatted = useMemo(() => Number(value || 0).toLocaleString("es-EC"), [value]);

  return (
    <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100 rounded-2xl">
      <CardBody className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon icon={icon} className={`${color} w-5 h-5`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-default-600">{title}</p>
            <p className="text-xl font-semibold text-default-900">{formatted}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}