import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem 
} from "@heroui/react";
import { useState } from "react";

export default function FilterDialog({ isOpen, onClose, onApply }) {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    symbol: "",
    type: "all" // "all", "Compra", "Venta"
  });

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onClose}
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Filtrar posiciones
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="Desde"
                placeholder="Fecha inicio"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
              <Input
                type="datetime-local"
                label="Hasta"
                placeholder="Fecha fin"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>
            <Input
              label="Símbolo"
              placeholder="Ej: BTCUSD"
              value={filters.symbol}
              onChange={(e) => setFilters({...filters, symbol: e.target.value})}
            />
            <Select
              label="Tipo de operación"
              selectedKeys={[filters.type]}
              onSelectionChange={(keys) => setFilters({...filters, type: Array.from(keys)[0]})}
            >
              <SelectItem key="all">Todas</SelectItem>
              <SelectItem key="Compra">Compra</SelectItem>
              <SelectItem key="Venta">Venta</SelectItem>
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleApply}>
            Aplicar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}