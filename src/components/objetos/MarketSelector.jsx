// src/components/MarketSelector.jsx
import { useState } from "react";
import { Listbox, ListboxItem, Badge } from "@heroui/react";

const markets = [
  { symbol: "EURUSD", diff: "−0.42%", color: "danger" },
  { symbol: "GBPUSD", diff: "−0.11%", color: "warning" },
  { symbol: "XAUUSD", diff: "−0.35%", color: "secondary" },
  { symbol: "XAGUSD", diff: "+0.05%", color: "success" },
];

export default function MarketSelector({ onSelect }) {
  const [selected, setSelected] = useState(markets[0]);
  return (
    <Listbox
      selectedKeys={[selected.symbol]}
      onSelectionChange={(keys) => {
        const sym = Array.from(keys)[0];
        const mkt = markets.find((m) => m.symbol === sym);
        setSelected(mkt);
        onSelect(sym);
      }}
      aria-label="Lista de mercados"
      className="w-full max-w-sm border rounded-lg"
    >
      {markets.map((mkt) => (
        <ListboxItem
          key={mkt.symbol}
          endContent={<Badge content={mkt.diff} color={mkt.color} size="sm" />}
        >
          {mkt.symbol}
        </ListboxItem>
      ))}
    </Listbox>
  );
}
