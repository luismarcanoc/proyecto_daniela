export type ProductKey =
  | "hamburguesa_tradicional"
  | "hamburguesa_brioche"
  | "burger_shack"
  | "mini_40"
  | "deli"
  | "perro_caliente"
  | "pan_cuadrado";

export type RecipeKey = "premezcla_4" | "premezcla_6" | "premezcla_8";

export type WaterMode = "agua" | "hielo";

export type ProcessInput = {
  fecha: string;
  lote: string;
  producto: ProductKey;
  amasadora: "1" | "2" | "3";
  temperaturaArea: number;
  humedadRelativa: number;
  horaInicioAmasado: string;
  receta: RecipeKey;
  pesoPremezcla: number;
  tiempoMezclado: number;
  agregado: WaterMode;
  temperaturaMasa: number;
  tiempoPicado: number;
  tiempoPorcionado: number;
  tiempoBoleado: number;
  tiempoFermentacion: number;
  tiempoHorno: number;
  temperaturaHorno: number;
  tiempoTraslado: number;
  operariosBoleado: number;
};

export type StageResult = {
  id: string;
  name: string;
  value: number;
  min?: number;
  max?: number;
  target: number;
  unit: string;
  pressure: number;
  status: "ok" | "warning" | "critical";
  note: string;
};

export type AnalysisResult = {
  bottleneck: StageResult;
  stages: StageResult[];
  alerts: string[];
  suggestions: string[];
  monteCarlo: {
    iterations: number;
    p50: number;
    p90: number;
    delayProbability: number;
    bottleneckFrequency: Array<{ stage: string; probability: number }>;
  };
};

export const products: Record<ProductKey, string> = {
  hamburguesa_tradicional: "Pan de hamburguesa tradicional",
  hamburguesa_brioche: "Pan de hamburguesa brioche",
  burger_shack: "Pan de hamburguesa burger shack",
  mini_40: "Pan de hamburguesa mini 40",
  deli: "Pan deli",
  perro_caliente: "Pan de perro caliente",
  pan_cuadrado: "Pan cuadrado (sandwich)",
};

export const recipes: Record<RecipeKey, string> = {
  premezcla_4: "Pre-mezcla de 4",
  premezcla_6: "Pre-mezcla de 6",
  premezcla_8: "Pre-mezcla de 8",
};

const premixRanges: Record<RecipeKey, { min: number; max: number }> = {
  premezcla_4: { min: 762, max: 767 },
  premezcla_6: { min: 1140, max: 1145 },
  premezcla_8: { min: 1515, max: 1520 },
};

const fermentationRanges: Record<ProductKey, { min: number; max: number }> = {
  hamburguesa_tradicional: { min: 150, max: 150 },
  hamburguesa_brioche: { min: 90, max: 90 },
  burger_shack: { min: 150, max: 150 },
  mini_40: { min: 150, max: 150 },
  deli: { min: 150, max: 150 },
  perro_caliente: { min: 150, max: 150 },
  pan_cuadrado: { min: 210, max: 240 },
};

const ovenTimeRanges: Record<ProductKey, { min: number; max: number }> = {
  hamburguesa_tradicional: { min: 15, max: 15 },
  hamburguesa_brioche: { min: 13, max: 14 },
  burger_shack: { min: 15, max: 15 },
  mini_40: { min: 15, max: 15 },
  deli: { min: 15, max: 15 },
  perro_caliente: { min: 15, max: 15 },
  pan_cuadrado: { min: 30, max: 33 },
};

function ovenTemperatureRange(product: ProductKey, oven: ProcessInput["amasadora"]) {
  if (product === "hamburguesa_brioche") return { min: 165, max: 170 };
  if (product === "pan_cuadrado") {
    if (oven === "1") return { min: 160, max: 160 };
    if (oven === "2") return { min: 170, max: 170 };
    return { min: 175, max: 175 };
  }
  return { min: 160, max: 160 };
}

function mixingRange(recipe: RecipeKey) {
  if (recipe === "premezcla_8") return { min: 20, max: 45 };
  if (recipe === "premezcla_6") return { min: 20, max: 40 };
  return { min: 15, max: 35 };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stage(
  id: string,
  name: string,
  value: number,
  range: { min?: number; max?: number },
  unit = "min",
  note = "",
): StageResult {
  const target = range.max ?? range.min ?? value;
  const upperPressure = range.max ? value / range.max : 1;
  const lowerPressure = range.min && value < range.min ? range.min / Math.max(value, 0.1) : 1;
  const pressure = Math.max(upperPressure, lowerPressure);
  const outBy = Math.abs(pressure - 1);
  const status = outBy > 0.15 ? "critical" : outBy > 0.03 ? "warning" : "ok";

  return {
    id,
    name,
    value,
    min: range.min,
    max: range.max,
    target,
    unit,
    pressure,
    status,
    note,
  };
}

function percentile(values: number[], ratio: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * ratio);
  return sorted[index] ?? 0;
}

function randomAround(value: number, spread: number) {
  const a = 1 - spread;
  const b = 1 + spread;
  return value * (a + Math.random() * (b - a));
}

function runMonteCarlo(stages: StageResult[]) {
  const iterations = 1200;
  const totals: number[] = [];
  const delayed: boolean[] = [];
  const frequency = new Map<string, number>();

  for (let index = 0; index < iterations; index += 1) {
    const simulated = stages.map((item) => {
      const spread = item.id === "traslado" ? 0.2 : item.id === "fermentacion" ? 0.06 : 0.11;
      const value = randomAround(item.value, spread);
      const pressure = Math.max(
        item.max ? value / item.max : 1,
        item.min && value < item.min ? item.min / Math.max(value, 0.1) : 1,
      );
      return { ...item, simulatedValue: value, simulatedPressure: pressure };
    });

    const bottleneck = simulated.reduce((winner, item) =>
      item.simulatedPressure > winner.simulatedPressure ? item : winner,
    );
    frequency.set(bottleneck.name, (frequency.get(bottleneck.name) ?? 0) + 1);
    totals.push(simulated.reduce((sum, item) => sum + item.simulatedValue, 0));
    delayed.push(simulated.some((item) => item.max !== undefined && item.simulatedValue > item.max));
  }

  return {
    iterations,
    p50: Math.round(percentile(totals, 0.5)),
    p90: Math.round(percentile(totals, 0.9)),
    delayProbability: Math.round((delayed.filter(Boolean).length / iterations) * 100),
    bottleneckFrequency: [...frequency.entries()]
      .map(([stageName, count]) => ({
        stage: stageName,
        probability: Math.round((count / iterations) * 100),
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5),
  };
}

export function analyzeProcess(input: ProcessInput): AnalysisResult {
  const alerts: string[] = [];
  const suggestions: string[] = [];
  const productName = products[input.producto];
  const premix = premixRanges[input.receta];
  const ovenTemp = ovenTemperatureRange(input.producto, input.amasadora);

  if (input.temperaturaArea < 22) {
    alerts.push("La temperatura del área está por debajo de 22 °C; puede retrasar fermentación y manejo de masa.");
  }
  if (input.temperaturaArea > 35) {
    alerts.push("La temperatura del área supera 35 °C; revise enfriamiento, hidratación y velocidad de fermentación.");
  }
  if (input.humedadRelativa > 65) {
    alerts.push("Humedad inválida: supera 65 %. El lote debe revisarse antes de aceptar el resultado.");
  } else if (input.humedadRelativa < 45 || input.humedadRelativa > 55) {
    alerts.push("La humedad relativa está fuera del rango ideal de 45 % a 55 %.");
  }
  if (input.temperaturaMasa > 32) {
    alerts.push("La masa sale del amasado por encima de 32 °C; hay riesgo de acelerar fermentación y perder control.");
  }
  if (input.pesoPremezcla < premix.min || input.pesoPremezcla > premix.max) {
    alerts.push(`El peso de ${recipes[input.receta]} debe estar entre ${premix.min} g y ${premix.max} g.`);
  }

  const stages = [
    stage("mezclado", "Mezclado", input.tiempoMezclado, mixingRange(input.receta), "min", "Amasado y desarrollo inicial."),
    stage("picado", "Picado con reposo", input.tiempoPicado, { min: 8, max: 10 }, "min", "Incluye reposo de masa."),
    stage("porcionado", "Porcionado", input.tiempoPorcionado, { max: 10 }, "min", "Punto sensible de flujo entre picado y formado."),
    stage(
      "boleado",
      "Boleado",
      input.tiempoBoleado,
      { max: 15 },
      "min",
      `${input.operariosBoleado} operarios reportados.`,
    ),
    stage("fermentacion", "Fermentación", input.tiempoFermentacion, fermentationRanges[input.producto], "min", productName),
    stage("horno", "Horno", input.tiempoHorno, ovenTimeRanges[input.producto], "min", "Cocción por producto."),
    stage("traslado", "Traslado a empaquetado", input.tiempoTraslado, { max: 5 }, "min", "Movimiento posterior al horno."),
  ];

  const temperatureStage = stage("temperatura_horno", "Temperatura de horno", input.temperaturaHorno, ovenTemp, "°C");
  if (temperatureStage.status !== "ok") {
    alerts.push(`La temperatura de horno para ${productName} debe estar entre ${ovenTemp.min} °C y ${ovenTemp.max} °C.`);
  }

  const bottleneck = stages.reduce((winner, item) => (item.pressure > winner.pressure ? item : winner));

  if (bottleneck.id === "boleado") {
    suggestions.push("Mueva temporalmente 1 o 2 operarios desde amasado auxiliar o apoyo de hornos hacia boleado hasta volver a menos de 15 min.");
  }
  if (bottleneck.id === "porcionado") {
    suggestions.push("Refuerce porcionado con el operario que alterna entre amasadoras y otras áreas para evitar acumulación antes del boleado.");
  }
  if (bottleneck.id === "mezclado") {
    suggestions.push("Ajuste el tiempo de mezclado dentro del rango de la receta y revise carga de amasadora antes de iniciar el siguiente lote.");
  }
  if (bottleneck.id === "fermentacion") {
    suggestions.push("Secuencie el siguiente lote para que no compita por fermentadora y revise temperatura/humedad antes de cambiar personal.");
  }
  if (bottleneck.id === "horno") {
    suggestions.push("Priorice disponibilidad de horneros y carritos; el cuello está en cocción, no en formado.");
  }
  if (bottleneck.id === "traslado") {
    suggestions.push("Asigne un hornero a traslado inmediato al cierre de horno para mantener el movimiento a empaquetado por debajo de 5 min.");
  }
  if (input.operariosBoleado < 8) {
    suggestions.push("El boleado está por debajo del personal recomendado: use entre 8 y 10 operarios cuando el lote llegue a formado.");
  }
  if (input.operariosBoleado > 10) {
    suggestions.push("Hay más de 10 operarios en boleado; si el tiempo ya está controlado, reasigne excedente a porcionado o traslado.");
  }
  if (input.agregado === "hielo" && input.temperaturaMasa <= 28) {
    suggestions.push("El hielo está manteniendo la masa fría; confirme que no esté alargando fermentación más de lo esperado.");
  }
  if (suggestions.length === 0) {
    suggestions.push("El flujo luce estable. Mantenga la secuencia y vigile el traslado a empaquetado, que suele degradarse rápido por coordinación.");
  }

  return {
    bottleneck,
    stages: [...stages, temperatureStage],
    alerts,
    suggestions,
    monteCarlo: runMonteCarlo(stages),
  };
}

export function defaultInput(): ProcessInput {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    lote: "L-001",
    producto: "hamburguesa_tradicional",
    amasadora: "1",
    temperaturaArea: 26,
    humedadRelativa: 50,
    horaInicioAmasado: "07:00",
    receta: "premezcla_6",
    pesoPremezcla: 1142,
    tiempoMezclado: 25,
    agregado: "agua",
    temperaturaMasa: 30,
    tiempoPicado: 9,
    tiempoPorcionado: 9,
    tiempoBoleado: 14,
    tiempoFermentacion: 150,
    tiempoHorno: 15,
    temperaturaHorno: 160,
    tiempoTraslado: 4,
    operariosBoleado: 8,
  };
}

export function scoreStage(stageResult: StageResult) {
  return clamp(Math.round(stageResult.pressure * 100), 0, 180);
}
