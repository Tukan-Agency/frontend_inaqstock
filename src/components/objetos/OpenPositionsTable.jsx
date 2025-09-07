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
} from "@heroui/react";
import { Icon } from "@iconify/react";

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
        const value = Number(position.profit);
        const isProfit = !isNaN(value) && value >= 0;
        return (
          <span className={isProfit ? "text-success-600" : "text-danger-600"}>
            {isProfit ? "+" : ""}
            {position.profit}
            {position.profitPercentage !== undefined && (
              <span className="text-xs ml-1">({position.profitPercentage}%)</span>
            )}
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
        return new Date(position.openTime).toLocaleString();
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
