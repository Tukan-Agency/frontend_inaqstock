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

function computeSign(profitStr, pctStr) {
  const pct = Number(pctStr);
  if (Number.isFinite(pct) && pct !== 0) return pct > 0 ? 1 : -1;
  const prof = Number(profitStr);
  if (prof > 0) return 1;
  if (prof < 0) return -1;
  return 0;
}

function formatWithSign(value, sign) {
  const num = Number(value);
  const abs = Math.abs(Number.isFinite(num) ? num : 0).toFixed(2);
  if (sign > 0) return `+${abs}`;
  if (sign < 0) return `-${abs}`;
  return abs;
}

/**
 * IMPORTANTE:
 * Antes se ocultaba el PnL (Skeleton) cuando:
 *  - profitLoading=true o pnlReady=false
 *  - o cuando open==current y recent<20s
 *
 * Pero para STOCKS es normal que open==current (precio puede no moverse rápido),
 * y aun así queremos mostrar 0.00 en vez de skeleton.
 *
 * Ahora: solo mostramos Skeleton si explícitamente profitLoading===true
 * o pnlReady===false. (Sin heurística open==current).
 */
function isPnLPending(position) {
  if (position?.pnlReady === false || position?.profitLoading === true) return true;

  // Si no existe profit aún (null/undefined), también pending
  if (position?.profit === undefined || position?.profit === null) return true;

  // Si no existe profitPercentage aún, también pending
  if (position?.profitPercentage === undefined || position?.profitPercentage === null) return true;

  return false;
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
    const end = start + rowsPerPage;
    return positions.slice(start, end);
  }, [positions, page]);

  const renderCell = (position, columnKey) => {
    switch (columnKey) {
      case "symbol":
        return (
          <div className="flex items-center gap-2">
            <span>{position.symbol}</span>
            <span
              className={`ml-2 px-2 py-1 text-xs rounded-full ${
                position.type === "Compra"
                  ? "bg-success-100 text-success-600"
                  : "bg-danger-100 text-danger-600"
              }`}
            >
              {position.type}
            </span>
          </div>
        );

      case "profit": {
        // Mostrar Skeleton mientras el PnL aún no está listo
        if (isPnLPending(position)) {
          return (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-14 rounded-md" />
              <Skeleton className="h-3 w-10 rounded-md" />
            </div>
          );
        }

        const profitSafe = position.profit ?? "0.00";
        const pctSafe = position.profitPercentage ?? "0.00";

        const sign = computeSign(profitSafe, pctSafe);
        const colorClass =
          sign > 0 ? "text-success-600" : sign < 0 ? "text-danger-600" : "text-default-600";

        const profitDisplay = formatWithSign(profitSafe, sign);

        const pctNum = Number(pctSafe);
        const pctSign =
          Number.isFinite(pctNum) && pctNum !== 0 ? (pctNum > 0 ? 1 : -1) : sign;
        const pctDisplay = Number.isFinite(pctNum)
          ? `${pctSign > 0 ? "+" : pctSign < 0 ? "-" : ""}${Math.abs(pctNum).toFixed(2)}%`
          : null;

        return (
          <span className={colorClass}>
            {profitDisplay}
            {pctDisplay && <span className="text-xs ml-1">({pctDisplay})</span>}
          </span>
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
        return `${position.tp}/${position.sl}`;

      default:
        return position[columnKey];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center flex-col min-h-[200px] m-auto">
        <div
          style={{
            background: "#00689824",
            padding: "26px",
            borderRadius: "73px",
            marginBottom: "13px",
          }}
        >
          <Icon color="#3285ab" icon="famicons:book" width={80} />
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