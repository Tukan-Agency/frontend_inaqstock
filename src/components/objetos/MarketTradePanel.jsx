import { useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TradingService } from "../services/tradingService";

export default function MarketTradePanel({ market }) {
  const [quantity, setQuantity] = useState(0.01);
  const [isLoading, setIsLoading] = useState(false);

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
  
  const executeTrade = async (type) => {
    setIsLoading(true);
    try {
      const tradeData = {
        symbol: market.symbol,
        volume: quantity,
        type: type,
        openPrice: type === 'Compra' ? parseFloat(market.price) : parseFloat(sellPrice),
        currentPrice: parseFloat(market.price),
        openTime: new Date().toISOString(),
        tp: '-',
        sl: '-',
        swap: 0.00,
        commission: 0.00
      };

      // Llamar directamente al servicio
      const savedPosition = await TradingService.savePosition(tradeData);
      
      // Emitir evento para actualizar las tablas
      const tradeEvent = new CustomEvent('trade-executed', {
        detail: savedPosition
      });
      window.dispatchEvent(tradeEvent);
      
      console.log('Posición guardada exitosamente:', savedPosition);
    } catch (error) {
      console.error('Error al ejecutar trade:', error);
      // Aquí puedes agregar una notificación de error si tienes un sistema de toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 bg-default-50">
      {/* Botones de Compra/Venta */}
      <div className="flex gap-2 mb-4">
        <Button 
          className="flex-1 bg-[#cb2e47] text-white hover:bg-[#cb2e47]/90 h-14"
          onClick={() => executeTrade('Venta')}
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          <span>
            <b>VENTA</b> <br />
            {sellPrice}
          </span>
        </Button>
        <Button 
          className="flex-1 bg-[#06726b] text-white hover:bg-[#06726b]/90 h-14"
          onClick={() => executeTrade('Compra')}
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          <span>
            <b>COMPRA</b> <br />
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
          isDisabled={isLoading}
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
          isDisabled={isLoading}
        >
          <Icon icon="material-symbols:add" />
        </Button>
      </div>
    </div>
  );
}