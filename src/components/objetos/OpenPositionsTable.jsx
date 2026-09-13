import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Spinner,
  Pagination,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { formatMarketPrice } from "../../utils/marketPrice.js";

function computeSign(profitStr, pctStr) {
  const pct = Number(pctStr);
  if (Number.isFinite(pct) && pct !== 0) return pct > 0 ? 1 : -1;
  const prof = Number(profitStr);
  if (prof > 0) return 1;
  if (prof < 0) return -1;
  return 0;
}

function formatWithSign(value, sign) {
  const raw = String(value ?? "");
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  // Conserva decimales ya calculados (p. ej. 0.0001).
  const abs = raw.replace(/^[+-]/, "") || Math.abs(num).toFixed(2);
  if (sign > 0) return `+${abs}`;
  if (sign < 0) return `-${abs}`;
  return abs.startsWith("-") ? abs.slice(1) : abs;
}

function isPnLPending(position) {
  if (position?.pnlReady === false || position?.profitLoading === true) return true;
  if (position?.profit === undefined || position?.profit === null) return true;
  if (position?.profitPercentage === undefined || position?.profitPercentage === null) return true;
  return false;
}

function ProfitSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-label="Calculando beneficio">
      <Skeleton className="h-4 w-14 rounded-md" />
      <Skeleton className="h-3 w-10 rounded-md" />
    </div>
  );
}

export default function OpenPositionsTable({ positions = [], onClosePosition, isLoading }) {
  const columns = [
    { key: "symbol", label: "Símbolo" },
    { key: "volume", label: "Volumen" },
    { key: "openPrice", label: "Precio de apertura" },
    { key: "currentPrice", label: "Precio actual" },
    { key: "tp_sl", label: "TP/SL" },
    { key: "openTime", label: "Hora de apertura" },
    { key: "swap", label: "Swap" },
    { key: "commission", label: "Comisión" },
    { key: "profit", label: "Beneficio" },
    { key: "actions", label: "Acciones" },
  ];

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const pages = Math.max(1, Math.ceil(positions.length / rowsPerPage));

  useEffect(() => {
    if (page > pages) setPage(1);
  }, [positions, pages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return positions.slice(start, start + rowsPerPage);
  }, [positions, page]);

  const renderCell = (position, columnKey) => {
    switch (columnKey) {
      case "symbol":
        return (
          <div className="flex items-center gap-2">
            <span>{position.symbol}</span>
            <span
              className={`ml-2 rounded-full px-2 py-1 text-xs ${
                position.type === "Compra"
                  ? "bg-success-100 text-success-600"
                  : "bg-danger-100 text-danger-600"
              }`}
            >
              {position.type}
            </span>
          </div>
        );

      case "openPrice":
        return formatMarketPrice(position.openPrice, position.symbol);

      case "currentPrice":
        if (position.currentPrice == null || !Number.isFinite(Number(position.currentPrice))) {
          return <Skeleton className="h-4 w-16 rounded-md" />;
        }
        return formatMarketPrice(position.currentPrice, position.symbol);

      case "profit": {
        if (isPnLPending(position)) return <ProfitSkeleton />;

        const profitSafe = position.profit ?? "0.00";
        const pctSafe = position.profitPercentage ?? "0.00";
        const sign = computeSign(profitSafe, pctSafe);
        const colorClass =
          sign > 0 ? "text-success-600" : sign < 0 ? "text-danger-600" : "text-default-600";
        const profitDisplay = formatWithSign(profitSafe, sign);
        const pctNum = Number(pctSafe);
        const pctSign = Number.isFinite(pctNum) && pctNum !== 0 ? (pctNum > 0 ? 1 : -1) : sign;
        const pctAbs = String(pctSafe).replace(/^[+-]/, "");
        const pctDisplay = Number.isFinite(pctNum)
          ? `${pctSign > 0 ? "+" : pctSign < 0 ? "-" : ""}${pctAbs}%`
          : null;

        const isStock =
          position.symbol && !String(position.symbol).includes(":");
        const flat = sign === 0;

        return (
          <div className="flex flex-col items-start gap-1">
            <span className={colorClass}>
              {profitDisplay}
              {pctDisplay && <span className="ml-1 text-xs">({pctDisplay})</span>}
            </span>
            {isStock && flat && (
              <Tooltip content="Las acciones no tienen tick a tick con el plan actual. Se usa el último trade/cierre de Polygon y se refresca cada ~15s en horario de mercado.">
                <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-default-100 px-2 py-0.5 text-[10px] font-medium text-default-500">
                  <Icon icon="material-symbols:info-outline" width={12} />
                  Último precio
                </span>
              </Tooltip>
            )}
          </div>
        );
      }

      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Tooltip content={`ID: ${position._id}`}>
              <Button isIconOnly size="sm" variant="light">
                <Icon icon="material-symbols:info-outline" width={20} />
              </Button>
            </Tooltip>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-danger-600"
              onClick={() => onClosePosition(position)}
            >
              <Icon icon="material-symbols:close" width={20} />
            </Button>
          </div>
        );

      case "openTime":
        return position.openTime ? new Date(position.openTime).toLocaleString() : "-";

      case "tp_sl":
        return `${position.tp ?? "--"} / ${position.sl ?? "--"}`;

      default:
        return position[columnKey];
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="m-auto flex min-h-[200px] flex-col items-center justify-center">
        <div
          style={{
            background: "#18A77724",
            padding: "26px",
            borderRadius: "73px",
            marginBottom: "13px",
          }}
        >
          <Icon color="#18A777" icon="famicons:book" width={80} />
        </div>
        <h2>No tienes posiciones abiertas.</h2>
        <p className="text-default-500">Comienza a operar y aquí verás tus posiciones abiertas.</p>
      </div>
    );
  }

  return (
    <Table
      aria-label="Posiciones abiertas"
      className="min-h-[200px]"
      selectionMode="none"
      bottomContent={
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={pages}
            onChange={setPage}
          />
        </div>
      }
      classNames={{ wrapper: "min-h-[240px]" }}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn key={column.key}>{column.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent="Sin datos">
        {pageItems.map((position) => (
          <TableRow key={position._id}>
            {columns.map((column) => (
              <TableCell key={`${position._id}-${column.key}`}>
                {renderCell(position, column.key)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
