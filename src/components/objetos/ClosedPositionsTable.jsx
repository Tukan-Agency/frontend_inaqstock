import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  useDisclosure,
  Spinner,
  Pagination,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import FilterDialog from "./FilterDialog";

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

export default function ClosedPositionsTable({ positions = [], isLoading }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeFilters, setActiveFilters] = useState({
    dateFrom: "",
    dateTo: "",
    symbol: "",
    type: "all",
  });

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesSymbol =
        !activeFilters.symbol ||
        position.symbol.toLowerCase().includes(activeFilters.symbol.toLowerCase());

      const matchesType = activeFilters.type === "all" || position.type === activeFilters.type;

      const matchesDateRange =
        (!activeFilters.dateFrom ||
          new Date(position.closeTime) >= new Date(activeFilters.dateFrom)) &&
        (!activeFilters.dateTo || new Date(position.closeTime) <= new Date(activeFilters.dateTo));

      return matchesSymbol && matchesType && matchesDateRange;
    });
  }, [positions, activeFilters]);

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const pages = Math.max(1, Math.ceil(filteredPositions.length / rowsPerPage));

  useEffect(() => {
    if (page > pages) setPage(1);
  }, [activeFilters, filteredPositions, pages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredPositions.slice(start, end);
  }, [filteredPositions, page]);

  const handleDownload = () => {
    const headers = [
      "Símbolo",
      "Tipo",
      "Volumen",
      "Precio de apertura",
      "Precio de cierre",
      "TP/SL",
      "Hora de apertura",
      "Hora de cierre",
      "Swap",
      "Comisión",
      "Beneficio",
    ].join(",");

    const rows = filteredPositions.map((p) =>
      [
        p.symbol,
        p.type,
        p.volume,
        p.openPrice,
        p.closePrice,
        `${p.tp}/${p.sl}`,
        new Date(p.openTime).toLocaleString(),
        new Date(p.closeTime).toLocaleString(),
        p.swap,
        p.commission,
        p.profit,
      ].join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `posiciones_cerradas_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <Icon color="#3285ab" icon="zondicons:close-solid" width={80} />
        </div>
        <h2>No tienes posiciones cerradas.</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-default-600">{filteredPositions.length} posiciones encontradas</div>
        <div className="flex gap-2">
          <Button variant="flat" startContent={<Icon icon="material-symbols:filter-list" />} onClick={onOpen}>
            Filtrar
          </Button>
          <Button variant="flat" startContent={<Icon icon="material-symbols:download" />} onClick={handleDownload}>
            Descargar
          </Button>
        </div>
      </div>

      <Table
        aria-label="Posiciones cerradas"
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
          <TableColumn>Símbolo</TableColumn>
          <TableColumn>Volumen</TableColumn>
          <TableColumn>Precio apertura</TableColumn>
          <TableColumn>Precio cierre</TableColumn>
          <TableColumn>TP/SL</TableColumn>
          <TableColumn>Hora apertura</TableColumn>
          <TableColumn>Hora cierre</TableColumn>
          <TableColumn>Swap</TableColumn>
          <TableColumn>Comisión</TableColumn>
          <TableColumn>Beneficio</TableColumn>
        </TableHeader>
        <TableBody emptyContent="Sin datos">
          {pageItems.map((position) => {
            const sign = computeSign(position.profit, position.profitPercentage);
            const colorClass =
              sign > 0 ? "text-success-600" : sign < 0 ? "text-danger-600" : "text-default-600";
            const profitDisplay = formatWithSign(position.profit, sign);

            const pctNum = Number(position.profitPercentage);
            const pctSign =
              Number.isFinite(pctNum) && pctNum !== 0 ? (pctNum > 0 ? 1 : -1) : sign;
            const pctDisplay = Number.isFinite(pctNum)
              ? `${pctSign > 0 ? "+" : pctSign < 0 ? "-" : ""}${Math.abs(pctNum).toFixed(2)}%`
              : null;

            return (
              <TableRow key={position._id}>
                <TableCell>
                  <div className="flex items-center">
                    {position.symbol}
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
                </TableCell>
                <TableCell>{position.volume}</TableCell>
                <TableCell>{position.openPrice}</TableCell>
                <TableCell>{position.closePrice}</TableCell>
                <TableCell>{position.tp}/{position.sl}</TableCell>
                <TableCell>{new Date(position.openTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(position.closeTime).toLocaleString()}</TableCell>
                <TableCell>{position.swap}</TableCell>
                <TableCell>{position.commission}</TableCell>
                <TableCell>
                  <span className={colorClass}>
                    {profitDisplay}
                    {pctDisplay && <span className="text-xs ml-1">({pctDisplay})</span>}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <FilterDialog
        isOpen={isOpen}
        onClose={onClose}
        onApply={(filters) => {
          setActiveFilters(filters);
          setPage(1);
          onClose();
        }}
      />
    </div>
  );
}