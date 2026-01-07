import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Chart from "react-apexcharts";
import { listUserOrders } from "../../../services/orders.service";
import { useSession } from "../../../../hooks/use-session";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAccountMode } from "../../../../context/AccountModeContext"; 
import { useBalance } from "../../../../context/BalanceContext"; 

export default function ListaOrdenes() {
  const { session } = useSession();
  const { mode } = useAccountMode(); 

  const clientId = useMemo(
    () =>
      session?.user?.clientId ||
      session?.user?.id ||
      session?.user?._id ||
      session?.user?.uid ||
      null,
    [session]
  );

  const clientIdQuery = useMemo(() => {
    return session?.user?.sequenceId ?? session?.user?.user?.sequenceId ?? "";
  }, [session]);

  const BASE_DELAY_MS = 150;
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLike, setOrdersLike] = useState([]);

  // Modal Detalles
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };
  const closeDetails = () => setIsDetailsOpen(false);

  // Constantes de tiempo
  const TRIMESTRES = [
    { key: "1", label: "1° Trimestre" },
    { key: "2", label: "2° Trimestre" },
    { key: "3", label: "3° Trimestre" },
    { key: "4", label: "4° Trimestre" },
  ];
  const SEMESTRES = [
    { key: "1", label: "1° Semestre" },
    { key: "2", label: "2° Semestre" },
  ];

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState("M");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedTrimestre, setSelectedTrimestre] = useState("1");
  const [selectedSemestre, setSelectedSemestre] = useState("1");

  const formatCurrency = (n) =>
    Number(n || 0)?.toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const sumActionsCapital = (ops = []) =>
    (ops || []).reduce(
      (acc, a) => acc + Number(a?.benefit || 0) * Number(a?.quantity || 0),
      0
    );

  // Carga de datos
  useEffect(() => {
    let cancelled = false;
    if (!clientId) {
      setIsLoading(false);
      setOrdersLike([]);
      return;
    }
    setIsLoading(true);

    async function load() {
      try {
        const minDelay = new Promise((r) => setTimeout(r, BASE_DELAY_MS));
        const [ordenes] = await Promise.all([
          listUserOrders({ clientId, mode }),
          minDelay,
        ]);

        const normalized = (ordenes || []).map((o, idx) => {
          // Intentamos recuperar símbolo si en algún futuro el backend lo manda
          // Actualmente tu JSON confirma que 'symbol' es undefined en este endpoint
          const foundSymbol = o.symbol || o._raw?.symbol || null;

          return {
            id: o._id || o.id || idx,
            code: `#${o.operationNumber ?? ""}`,
            operationNumber: o.operationNumber,
            operationDate: o.operationDate,
            operationValue: Number(o.operationValue || 0),
            status: o.operationStatus || o.status || "Finalizado",
            isCapital: Boolean(o.isCapital),
            isWithdrawl: Boolean(o.isWithdrawl || o.isWithdrawal),
            operationActions: Array.isArray(o.operationActions) ? o.operationActions : [],
            symbol: foundSymbol, 
            clientId: o.clientId,
            _raw: o,
          };
        });

        if (!cancelled) setOrdersLike(normalized);
      } catch (e) {
        console.error("Error cargando órdenes:", e);
        if (!cancelled) setOrdersLike([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId, mode]);

  // Lógica de Gráficos (se mantiene igual para no romper diseño)
  const getWeeklyDataForMonth = (year, month) => { 
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weekly = [];
    const getMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };
    let currentWeekStart = getMonday(firstDay);
    let weekNumber = 1;
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const total = ordersLike.reduce((acc, order) => {
        const d = new Date(order.operationDate);
        if (d >= currentWeekStart && d <= weekEnd && d.getFullYear() === year && d.getMonth() === month - 1) {
          const val = (!order.isCapital && !order.isWithdrawl) ? Number(order.operationValue || 0) : 0;
          return acc + val;
        }
        return acc;
      }, 0);
      weekly.push({ weekStart: new Date(currentWeekStart), weekEnd: new Date(weekEnd), weekNumber, total });
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }
    return weekly;
  };

  const calculateMonthlyTotals = () => {
    const monthly = { ene: { total: 0 }, feb: { total: 0 }, mar: { total: 0 }, abr: { total: 0 }, may: { total: 0 }, jun: { total: 0 }, jul: { total: 0 }, ago: { total: 0 }, sep: { total: 0 }, oct: { total: 0 }, nov: { total: 0 }, dic: { total: 0 } };
    ordersLike.forEach((order) => {
      const d = new Date(order.operationDate);
      if (d.getFullYear() === selectedYear) {
         if(!order.isCapital && !order.isWithdrawl){
            const key = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()];
            monthly[key].total += Number(order.operationValue || 0);
         }
      }
    });
    return monthly;
  };

  const [chartData, setChartData] = useState({ labels: [], totalValues: [] });
  useEffect(() => {
    const monthly = calculateMonthlyTotals();
    let labels = [];
    let totalValues = [];
    if (selectedPeriod === "M") {
      const weekly = getWeeklyDataForMonth(selectedYear, selectedMonth);
      labels = weekly.map((_, i) => `Semana ${i + 1}`);
      totalValues = weekly.map((w) => w.total);
      if (!totalValues.some((v) => v !== 0)) {
        const key = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][selectedMonth - 1];
        const monthTotal = monthly[key].total;
        labels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
        totalValues = [0.2, 0.35, 0.25, 0.2].map((p) => monthTotal * p);
      }
    } else if (selectedPeriod === "T") {
      const map = { 1: { labels: ["Enero", "Febrero", "Marzo"], keys: ["ene", "feb", "mar"] }, 2: { labels: ["Abril", "Mayo", "Junio"], keys: ["abr", "may", "jun"] }, 3: { labels: ["Julio", "Agosto", "Septiembre"], keys: ["jul", "ago", "sep"] }, 4: { labels: ["Octubre", "Noviembre", "Diciembre"], keys: ["oct", "nov", "dic"] } };
      const t = map[selectedTrimestre];
      labels = t.labels;
      totalValues = t.keys.map((k) => monthly[k].total);
    } else {
      if (selectedSemestre === "1") {
        labels = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"];
        const keys = ["ene", "feb", "mar", "abr", "may", "jun"];
        totalValues = keys.map((k) => monthly[k].total);
      } else {
        labels = ["Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const keys = ["jul", "ago", "sep", "oct", "nov", "dic"];
        totalValues = keys.map((k) => monthly[k].total);
      }
    }
    setChartData({ labels, totalValues });
  }, [selectedPeriod, selectedMonth, selectedTrimestre, selectedSemestre, selectedYear, ordersLike]);

  const columns = [
    { key: "operacion", label: "OPERACION" },
    { key: "fecha", label: "FECHA" },
    { key: "estado", label: "ESTADO" },
    { key: "capital", label: "CAPITAL" },
    { key: "ganancia", label: "GANANCIA" },
    { key: "perdida", label: "PERDIDA" },
    { key: "retiros", label: "RETIROS" },
    { key: "vermas", label: "VER MÁS" },
  ];

  const tableRows = useMemo(() => {
    return ordersLike
      .slice()
      .sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
      .map((o, idx) => {
        const actionsTotal = sumActionsCapital(o.operationActions);
        const hasActions = actionsTotal !== 0;
        let capital = 0; let retiros = 0; let ganancia = 0; let perdida = 0;

        if (o.isCapital && !o.isWithdrawl) {
            capital = hasActions ? actionsTotal : o.operationValue;
        } else if (o.isWithdrawl && hasActions) {
            retiros = actionsTotal;
        } else {
            const val = Number(o.operationValue);
            if (val >= 0) ganancia = val;
            else perdida = Math.abs(val);
        }

        return {
          id: o.id || idx,
          operacion: o.code || `#${idx + 1}`,
          fecha: new Date(o.operationDate).toLocaleDateString("es-EC"),
          estado: o.status || "Finalizado",
          capital,
          ganancia,
          perdida,
          retiros,
          symbol: o.symbol, 
          original: o,
        };
      });
  }, [ordersLike]);

  const totals = useMemo(() => {
    return {
      capital: tableRows.reduce((acc, r) => acc + Number(r.capital || 0), 0),
      ganancia: tableRows.reduce((acc, r) => acc + Number(r.ganancia || 0), 0),
      perdida: tableRows.reduce((acc, r) => acc + Number(r.perdida || 0), 0),
      retiros: tableRows.reduce((acc, r) => acc + Number(r.retiros || 0), 0),
    };
  }, [tableRows]);

  const { balances } = useBalance(); 
  const currentData = mode === "demo" ? balances?.demo || {} : balances?.real || {};
  const currentBalance = Number(currentData.balance || 0); 

  const roiData = useMemo(() => {
    const wins = tableRows.filter((r) => Number(r.ganancia) > 0);
    const losses = tableRows.filter((r) => Number(r.perdida) > 0);
    const sumWins = wins.reduce((a, r) => a + Number(r.ganancia), 0);
    const sumLosses = losses.reduce((a, r) => a + Number(r.perdida), 0);
    const avgWin = wins.length ? sumWins / wins.length : 0;
    const avgLoss = losses.length ? sumLosses / losses.length : 0;
    return { avgWin, avgLoss };
  }, [tableRows]);

  // PDF
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const pdfContentRef = useRef(null);
  const generateAuthCode = (length = 30) => { return Math.random().toString(36).substr(2, 10); };
  const exportPDF = async () => {
    setAuthCode(generateAuthCode(25));
    setIsPdfRendering(true);
    await new Promise((r) => setTimeout(r, 120));
    const content = pdfContentRef.current;
    if (!content) { setIsPdfRendering(false); return; }
    try {
      const canvas = await html2canvas(content, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let position = 0; let heightLeft = pdfHeight;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) { position = heightLeft - pdfHeight; pdf.addPage(); pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight); heightLeft -= pdf.internal.pageSize.getHeight(); }
      pdf.save(`reporte-${clientIdQuery}.pdf`);
    } finally { setIsPdfRendering(false); }
  };

  const primaryColor = "#00689b";
  const chartOptions = {
    chart: { type: "area", height: 400, toolbar: { show: false }, background: "transparent", zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2, colors: [primaryColor] },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 100], colorStops: [ { offset: 0, color: primaryColor, opacity: 0.4 }, { offset: 100, color: primaryColor, opacity: 0.1 } ] } },
    xaxis: { categories: chartData.labels, labels: { style: { colors: "var(--nextui-colors-default-500)", fontSize: "11px" } } },
    yaxis: { labels: { formatter: (val) => "$" + val.toFixed(0) } },
    colors: [primaryColor]
  };
  const chartSeries = [{ name: "Total", data: chartData.totalValues || [] }];

  if (isLoading || !clientId) {
    return <div className="p-6"><Skeleton className="h-[400px] w-full rounded-xl" /></div>;
  }

  // --- DATOS PARA EL MODAL ---
  const modalOrder = selectedOrder;
  const modalActions = modalOrder?.operationActions || [];
  const modalItemsTotal = sumActionsCapital(modalActions);
  const modalFinalTotal = modalOrder?.isCapital ? modalItemsTotal : Number(modalOrder?.operationValue || 0);
  
  // Como el símbolo es undefined en el JSON, mostramos texto alternativo si es trading
  const isTrading = !modalOrder?.isCapital && !modalOrder?.isWithdrawl;
  const displaySymbol = modalOrder?.symbol; 
  console.log(modalOrder);

  return (
    <div className="p-6">
      <Card className="shadow-none rounded-3xl">
        <CardBody className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-default-50 dark:bg-default-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Chip variant="flat" color="default" className="text-sm">Mi cuenta | ID: {clientIdQuery}</Chip>
              <div className="flex items-center gap-2"><span className="text-sm text-default-700">Año</span><Input size="sm" type="number" value={String(selectedYear)} onChange={(e) => setSelectedYear(parseInt(e.target.value || "0", 10))} className="w-24" /></div>
              <Tabs selectedKey={selectedPeriod} onSelectionChange={setSelectedPeriod} variant="underlined" size="sm" color="primary"><Tab key="M" title="Mes" /><Tab key="T" title="Trimestre" /><Tab key="S" title="Semestre" /></Tabs>
              {selectedPeriod === "M" && <Select size="sm" selectedKeys={[String(selectedMonth)]} onSelectionChange={(k) => setSelectedMonth(parseInt(Array.from(k)[0], 10))} className="w-32">{Array.from({ length: 12 }, (_, i) => (<SelectItem key={String(i + 1)}>{new Date(2025, i, 1).toLocaleDateString("es-ES", { month: "short" })}</SelectItem>))}</Select>}
              {selectedPeriod === "T" && <Select size="sm" selectedKeys={[selectedTrimestre]} onSelectionChange={(k) => setSelectedTrimestre(Array.from(k)[0])} className="w-36">{TRIMESTRES.map((t) => (<SelectItem key={t.key}>{t.label}</SelectItem>))}</Select>}
              {selectedPeriod === "S" && <Select size="sm" selectedKeys={[selectedSemestre]} onSelectionChange={(k) => setSelectedSemestre(Array.from(k)[0])} className="w-36">{SEMESTRES.map((s) => (<SelectItem key={s.key}>{s.label}</SelectItem>))}</Select>}
            </div>
            <Button variant="bordered" color="danger" startContent={<Icon icon="mdi:file-pdf-box" width={18} />} onPress={exportPDF}>Descargar pdf</Button>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-medium text-default-700 mb-3">Movimientos</h3>
            <div className="flex gap-6">
              <div className="flex-1"><Chart options={chartOptions} series={chartSeries} type="area" height={400} /></div>
              <div className="w-72 space-y-4">
                <h4 className="text-base font-medium text-default-700 mb-4">Rendimiento de trades</h4>
                <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100"><CardBody className="py-4 px-4"><div className="flex items-start gap-3"><div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center"><Icon icon="mdi:wallet" className="text-blue-600"/></div><div><p className="text-sm text-default-600 mb-1">Balance</p><p className="text-lg font-semibold">{formatCurrency(currentBalance)}</p></div></div></CardBody></Card>
                <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100"><CardBody className="py-4 px-4"><div className="flex items-start gap-3"><div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center"><Icon icon="mdi:trending-up" className="text-emerald-600"/></div><div><p className="text-sm text-default-600">Ganancia promedio</p><p className="text-lg font-semibold text-emerald-600">{formatCurrency(roiData.avgWin)}</p></div></div></CardBody></Card>
                <Card className="border-0 shadow-sm bg-default-50 dark:bg-default-100"><CardBody className="py-4 px-4"><div className="flex items-start gap-3"><div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center"><Icon icon="mdi:trending-down" className="text-red-600"/></div><div><p className="text-sm text-default-600">Pérdida promedio</p><p className="text-lg font-semibold text-red-600">{formatCurrency(roiData.avgLoss)}</p></div></div></CardBody></Card>
              </div>
            </div>
          </div>

          {/* PDF Hidden */}
          {isPdfRendering && <div ref={pdfContentRef} style={{position:"fixed",left:"-9999px",background:"#fff",padding:24,width:600}}><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",marginBottom:12}}><div>Mi Cuenta</div><div>ID: {clientIdQuery}</div><div>Balance: {formatCurrency(currentBalance)}</div></div><h2 style={{textAlign:"center"}}>REPORTE</h2><table style={{width:"100%"}}><thead><tr><th>Op</th><th>Fecha</th><th>Ganancia</th><th>Pérdida</th></tr></thead><tbody>{tableRows.map(r=>(<tr key={r.id}><td>{r.operacion}</td><td>{r.fecha}</td><td>{formatCurrency(r.ganancia)}</td><td>{formatCurrency(r.perdida)}</td></tr>))}</tbody></table></div>}

          <Card className="mt-6 border-0 shadow-md rounded-2xl">
            <CardBody className="p-0">
              <Table aria-label="Tabla de órdenes" removeWrapper classNames={{ table: "rounded-2xl", th: "text-[11px] font-semibold text-default-500 uppercase bg-transparent", tr: "hover:bg-default-50/60", td: "text-sm" }}>
                <TableHeader columns={columns}>{(c) => <TableColumn key={c.key} className={["capital","ganancia","perdida","retiros"].includes(c.key) ? "text-right" : ""}>{c.label}</TableColumn>}</TableHeader>
                <TableBody emptyContent="No hay órdenes">
                  {tableRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.operacion}</TableCell>
                      <TableCell>{row.fecha}</TableCell>
                      <TableCell><Chip size="sm" variant="flat" color={row.estado === "Finalizado" ? "success" : "default"}>{row.estado}</Chip></TableCell>
                      <TableCell className="text-right">{row.capital > 0 ? formatCurrency(row.capital) : "-"}</TableCell>
                      <TableCell className={`text-right ${row.ganancia > 0 ? "text-success-600 font-bold" : "text-default-900"}`}>{formatCurrency(row.ganancia)}</TableCell>
                      <TableCell className={`text-right ${row.perdida > 0 ? "text-danger-600 font-bold" : "text-default-900"}`}>{formatCurrency(row.perdida)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.retiros)}</TableCell>
                      <TableCell><Button isIconOnly variant="light" size="sm" onPress={() => openDetails(row.original)}><Icon icon="mdi:eye-outline" width={20} /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </CardBody>
      </Card>

      {/* --- MODAL DETALLES (TEXTO SOLAMENTE, SIN ICONOS) --- */}
      <Modal isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} size="xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Detalles de la orden</ModalHeader>
              <ModalBody>
                {modalOrder ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-default-50 rounded-xl border border-default-100">
                      <p className="text-sm text-default-600 leading-relaxed">
                        El movimiento <strong className="text-default-900">#{modalOrder.operationNumber ?? ""}</strong> se realizó el{" "}
                        <Chip size="sm" variant="flat" color="primary" className="mx-1">{formatDate(modalOrder.operationDate)}</Chip>
                        y está actualmente <Chip size="sm" variant="flat" color={modalOrder.status === "Finalizado" ? "success" : "default"} className="mx-1">{String(modalOrder.status).toUpperCase()}</Chip>.
                      </p>
                    </div>

                    <Table aria-label="Detalle" removeWrapper classNames={{ th: "bg-transparent text-[11px] uppercase", td: "py-3" }}>
                      <TableHeader>
                        <TableColumn>CONCEPTO</TableColumn>
                        <TableColumn className="text-right">VALOR</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {/* 1. MOSTRAR SÍMBOLO O TEXTO GENÉRICO SI ES TRADING */}
                        {isTrading && (
                          <TableRow key="trading-info">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-default-900">
                                  {displaySymbol ? `Símbolo: ${displaySymbol}` : "Operación de Mercado"}
                                </span>
                                <span className="text-xs text-default-500">
                                  {modalFinalTotal >= 0 ? "Ganancia registrada" : "Pérdida registrada"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={modalFinalTotal >= 0 ? "text-success-600 font-medium" : "text-danger-600 font-medium"}>
                                {formatCurrency(modalFinalTotal)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )}

                        {/* 2. MOSTRAR ACCIONES DESGLOSADAS SI EXISTEN */}
                        {modalActions.map((a, i) => (
                            <TableRow key={`${a._id || i}`}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-default-900">{a.name}</span>
                                  <span className="text-xs text-default-500">Cantidad: {a.quantity}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(a.benefit)*Number(a.quantity))}</TableCell>
                            </TableRow>
                        ))}

                        {/* 3. TOTAL */}
                        {(modalActions.length > 0) && (
                          <TableRow key="total-row" className="border-t border-default-200">
                            <TableCell>
                              <span className="font-bold text-default-800">TOTAL</span>
                            </TableCell>
                            <TableCell className={`text-right font-bold text-lg ${modalFinalTotal < 0 ? 'text-danger-600' : 'text-default-900'}`}>
                              {formatCurrency(modalFinalTotal)} USD
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-default-400">
                    <p>No se encontraron detalles para esta orden.</p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter><Button variant="flat" onPress={onClose}>Cerrar</Button></ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}