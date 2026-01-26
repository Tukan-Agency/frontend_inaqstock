import React, { useEffect, useState } from "react";
import { 
  Skeleton, 
  Card, 
  CardBody, 
  Input,
  Select,
  SelectItem,
  Button,
  Divider
} from "@heroui/react";
import Chart from "react-apexcharts";
import { useSession } from "../../hooks/use-session.jsx";
import Nav from "../navbar.jsx";
import { useNavigate } from "react-router-dom";

export default function Calculadora() {
  const { session } = useSession();
  const navigate = useNavigate();
  
  const [calculatorLoaded, setCalculatorLoaded] = useState(false);

  // Estados para la calculadora
  const [formData, setFormData] = useState({
    principal: 1000,
    contribution: 100,
    contributionFrequency: 12,
    interestRate: 5,
    compoundingFrequency: 12,
    years: 10
  });

  const [result, setResult] = useState(0);
  const [chartData, setChartData] = useState({
    series: [],
    options: {}
  });

  useEffect(() => {
    if (session.status === "unauthenticated") navigate("/", { replace: true });
  }, [session.status, navigate]);

  // Calcular interés compuesto al cargar o cambiar datos
  useEffect(() => {
    calculateCompoundInterest();
    setCalculatorLoaded(true);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const calculateCompoundInterest = () => {
    const {
      principal,
      contribution,
      contributionFrequency,
      interestRate,
      compoundingFrequency,
      years
    } = formData;

    // Validación básica
    if (principal < 0 || contribution < 0 || interestRate < 0 || years < 0) {
      return;
    }

    const annualRate = interestRate / 100;
    let currentBalance = principal;
    const dataPoints = [parseFloat(principal.toFixed(2))];
    const labels = ["0"];
    const numContributionPeriods = contributionFrequency;

    for (let year = 1; year <= years; year++) {
      // Aplicar capitalización anual ANTES de añadir las contribuciones del año
      if (compoundingFrequency === 0) {
        currentBalance = currentBalance * Math.exp(annualRate);
      } else {
        currentBalance = currentBalance * (1 + annualRate);
      }

      // Añadir contribuciones
      for (let period = 0; period < numContributionPeriods; period++) {
        currentBalance += contribution;
      }

      dataPoints.push(parseFloat(currentBalance.toFixed(2)));
      labels.push(year.toString());
    }

    const futureValue = currentBalance.toFixed(2);
    setResult(futureValue);
    updateChart(dataPoints, labels);
  };

  const updateChart = (dataPoints, labels) => {
    const options = {
      chart: {
        type: 'line',
        height: 250,
        zoom: {
          enabled: false
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        }
      },
      colors: ['#0072F5'],
      stroke: {
        width: 3,
        curve: 'smooth'
      },
      markers: {
        size: 5,
        colors: ['#0072F5'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 7
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      },
      xaxis: {
        categories: labels,
        title: {
          text: 'Años',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333'
          }
        },
        labels: {
          style: {
            fontSize: '10px',
            colors: '#666'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Valor ($)',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333'
          }
        },
        labels: {
          formatter: function(value) {
            if (value >= 1000000) {
              return `$${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `$${(value / 1000).toFixed(1)}K`;
            }
            return `$${value.toLocaleString('es-ES', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}`;
          },
          style: {
            fontSize: '10px',
            colors: '#666'
          }
        }
      },
      tooltip: {
        y: {
          formatter: function(value) {
            return `$${value.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          }
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        fontFamily: 'inherit',
        fontWeight: 600
      }
    };

    const series = [{
      name: 'Crecimiento de la Inversión',
      data: dataPoints
    }];

    setChartData({ series, options });
  };

  if (session.status === "unauthenticated") return null;

  const contributionFrequencies = [
    { key: "1", label: "Anual" },
    { key: "2", label: "Semi-Anual" },
    { key: "4", label: "Trimestral" },
    { key: "12", label: "Mensual" },
    { key: "52", label: "Semanal" },
    { key: "365", label: "Diario" }
  ];

  const compoundingFrequencies = [
    { key: "1", label: "Anualmente" },
    { key: "2", label: "Semi-Anualmente" },
    { key: "4", label: "Trimestralmente" },
    { key: "12", label: "Mensualmente" },
    { key: "365", label: "Diariamente" },
    { key: "0", label: "Continuamente" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Nav />

        <div className="w-full mx-auto" style={{ width: "100%", maxWidth: "1400px", margin: "auto" }}>
          <Card className="border border-default-200 shadow-lg">
            <CardBody className="p-4 md:p-8">
              <Skeleton
                isLoaded={calculatorLoaded}
                classNames={{
                  base: "w-full rounded-xl",
                  content: "w-full"
                }}
              >
                {/* Título */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Calculadora de Interés Compuesto
                  </h1>
                  <p className="text-default-500 mt-2">
                    Calcula el crecimiento de tu inversión con contribuciones periódicas
                  </p>
                </div>

                <Divider className="my-6" />

                {/* Layout de dos columnas */}
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Columna izquierda - Formulario */}
                  <div className="lg:w-1/2">
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-foreground">
                        Configuración de la Inversión
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Cantidad Principal ($)"
                          type="number"
                          name="principal"
                          value={formData.principal}
                          onChange={handleInputChange}
                          min="0"
                          startContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">$</span>
                            </div>
                          }
                          classNames={{
                            input: "text-right"
                          }}
                        />

                        <Input
                          label="Contribución Mensual ($)"
                          type="number"
                          name="contribution"
                          value={formData.contribution}
                          onChange={handleInputChange}
                          min="0"
                          startContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">$</span>
                            </div>
                          }
                          classNames={{
                            input: "text-right"
                          }}
                        />

                        <div className="md:col-span-2">
                          <Select
                            label="Frecuencia de Contribución"
                            selectedKeys={[formData.contributionFrequency.toString()]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              contributionFrequency: parseFloat(e.target.value)
                            }))}
                            className="w-full"
                          >
                            {contributionFrequencies.map((item) => (
                              <SelectItem key={item.key}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <Input
                          label="Tasa de Interés Anual (%)"
                          type="number"
                          name="interestRate"
                          value={formData.interestRate}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.01"
                          endContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">%</span>
                            </div>
                          }
                          classNames={{
                            input: "text-right"
                          }}
                        />

                        <div className="md:col-span-2">
                          <Select
                            label="Frecuencia de Capitalización"
                            selectedKeys={[formData.compoundingFrequency.toString()]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              compoundingFrequency: parseFloat(e.target.value)
                            }))}
                            className="w-full"
                          >
                            {compoundingFrequencies.map((item) => (
                              <SelectItem key={item.key}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <Input
                          label="Período (Años)"
                          type="number"
                          name="years"
                          value={formData.years}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          endContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">años</span>
                            </div>
                          }
                          classNames={{
                            input: "text-right"
                          }}
                        />
                      </div>

                      {/* Botón calcular */}
                      <div className="pt-4">
                        <Button
                          style={{ color: "#fff" }}
                          color="primary"
                          size="lg"
                          onPress={calculateCompoundInterest}
                          className="w-full"
                        >
                          Calcular Interés Compuesto
                        </Button>
                      </div>

                      {/* Información adicional */}
                      <div className="bg-default-50 dark:bg-default-100 rounded-xl p-4 mt-6">
                        <p className="text-sm text-default-600">
                          <strong>Nota:</strong> Esta calculadora proporciona una estimación. 
                          Los resultados pueden variar según las condiciones del mercado y las tasas de interés reales.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Línea divisoria vertical en desktop */}
                  <div className="hidden lg:block">
                    <Divider orientation="vertical" className="h-full" />
                  </div>

                  {/* Columna derecha - Resultados y Gráfico */}
                  <div className="lg:w-1/2">
                    <div className="space-y-8">
                      {/* Resultado */}
                      <div className="text-center space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">
                          Resultado del Cálculo
                        </h2>
                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800">
                          <p className="text-sm text-default-500 mb-2">
                            Valor Futuro Estimado
                          </p>
                          <p className="text-3xl md:text-4xl font-bold text-primary">
                            ${parseFloat(result).toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </p>
                          <p className="text-default-500 text-sm mt-2">
                            Después de {formData.years} años con una tasa del {formData.interestRate}%
                          </p>
                          
                          {/* Estadísticas adicionales */}
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="text-center">
                              <p className="text-xs text-default-500">Inversión Total</p>
                              <p className="text-lg font-semibold text-foreground">
                                ${(formData.principal + (formData.contribution * formData.contributionFrequency * formData.years)).toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-default-500">Interés Ganado</p>
                              <p className="text-lg font-semibold text-success">
                                ${(parseFloat(result) - (formData.principal + (formData.contribution * formData.contributionFrequency * formData.years))).toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gráfico */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Proyección del Crecimiento
                        </h3>
                        <Card className="border border-default-200">
                          <CardBody className="p-0">
                            {chartData.series.length > 0 && (
                              <div className="p-4">
                                <Chart
                                  options={chartData.options}
                                  series={chartData.series}
                                  type="line"
                                  height={300}
                                />
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      </div>

                      {/* Resumen anual */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Resumen por Años Clave
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[5, 10, 15, 20].map(year => (
                            year <= formData.years && (
                              <div key={year} className="bg-default-50 dark:bg-default-100 rounded-lg p-3 text-center">
                                <p className="text-xs text-default-500">Año {year}</p>
                                <p className="font-semibold text-foreground">
                                  ${calculateYearlyValue(year).toLocaleString('es-ES', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  })}
                                </p>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Skeleton>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );

  // Función auxiliar para calcular el valor por año
  function calculateYearlyValue(targetYear) {
    const {
      principal,
      contribution,
      contributionFrequency,
      interestRate,
      compoundingFrequency,
      years
    } = formData;

    if (targetYear > years) return 0;

    const annualRate = interestRate / 100;
    let currentBalance = principal;
    const numContributionPeriods = contributionFrequency;

    for (let year = 1; year <= targetYear; year++) {
      if (compoundingFrequency === 0) {
        currentBalance = currentBalance * Math.exp(annualRate);
      } else {
        currentBalance = currentBalance * (1 + annualRate);
      }

      for (let period = 0; period < numContributionPeriods; period++) {
        currentBalance += contribution;
      }
    }

    return parseFloat(currentBalance.toFixed(2));
  }
}