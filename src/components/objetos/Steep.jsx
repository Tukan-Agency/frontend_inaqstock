import StepWizard from "react-step-wizard";
import { Card, Button } from "@heroui/react";

function StepOne({ nextStep }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold">Paso 1</h2>
      <p>Bienvenido al paso 1 del wizard.</p>
      <Button onClick={nextStep}>Siguiente</Button>
    </div>
  );
}

function StepTwo({ nextStep, previousStep }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold">Paso 2</h2>
      <p>Estás en el paso 2.</p>
      <div className="flex gap-4">
        <Button onClick={previousStep}>Anterior</Button>
        <Button onClick={nextStep}>Siguiente</Button>
      </div>
    </div>
  );
}

function StepThree({ previousStep }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold">Paso 3</h2>
      <p>¡Este es el último paso!</p>
      <Button onClick={previousStep}>Anterior</Button>
    </div>
  );
}

export default function Steep() {
  return (
    <Card className="p-8 max-w-xl mx-auto mt-10">
      <StepWizard>
        <StepOne />
        <StepTwo />
        <StepThree />
      </StepWizard>
    </Card>
  );
}
