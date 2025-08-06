import { useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function MarketTradePanel({ market }) {
  const [quantity, setQuantity] = useState(0.01);

  const handleQuantityChange = (increment) => {
    const newQuantity = Number((quantity + increment).toFixed(2));
    if (newQuantity >= 0.01) {
      setQuantity(newQuantity);
    }
  };

  const calculateUsdValue = () => {
    return (quantity * parseFloat(market.price)).toFixed(2);
  };

  const sellPrice = (parseFloat(market.price) - 0.41).toFixed(2);

  return (
    <div className="p-3 bg-default-50">
      {/* Botones de Compra/Venta */}
      <div className="flex gap-2 mb-4">
        
        <Button className="flex-1 bg-[#cb2e47] text-white hover:bg-[#cb2e47]/90 h-14">
          <span>
            <b>VENTA</b> <br />
            {sellPrice}
          </span>
        </Button>
        <Button className="flex-1 bg-[#06726b] text-white hover:bg-[#06726b]/90 h-14">
          <span>
            <b>COMPRA </b>
            <br />
            {market.price}
          </span>
        </Button>
      </div>

      {/* Control de cantidad */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          onClick={() => handleQuantityChange(-0.01)}
          className="bg-default-100 rounded-lg w-8 h-8 min-w-8"
        >
          <Icon icon="material-symbols:remove" />
        </Button>
        
        <div className="flex-1 text-center">
          <div className="text-lg font-medium">{quantity.toFixed(2)}</div>
          <div className="text-xs text-default-400">
            ≈ {calculateUsdValue()} USD
          </div>
        </div>

        <Button
          isIconOnly
          size="sm"
          variant="flat"
          onClick={() => handleQuantityChange(0.01)}
          className="bg-default-100 rounded-lg w-8 h-8 min-w-8"
        >
          <Icon icon="material-symbols:add" />
        </Button>
      </div>

      {/* Botón de orden avanzada */}
      <Button 
        size="sm"
        variant="light"
        className="w-full flex items-center gap-2 text-default-500 hover:text-default-700"
      >
        <Icon icon="material-symbols:settings-outline" />
        Orden avanzada
      </Button>
    </div>
  );
}