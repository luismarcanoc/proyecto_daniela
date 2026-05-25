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
export type NumberField = number | null;

export type EquipmentKey =
  | "amasadora_1"
  | "amasadora_2"
  | "amasadora_3"
  | "porcionadores"
  | "laminadoras"
  | "sobadoras"
  | "horno_1"
  | "horno_2"
  | "horno_3";

export type ProcessInput = {
  fecha: string;
  lote: string;
  producto: ProductKey;
  amasadora: "1" | "2" | "3";
  horno: "1" | "2" | "3";
  temperaturaArea: NumberField;
  humedadRelativa: NumberField;
  horaInicioAmasado: string;
  receta: RecipeKey;
  pesoPremezcla: NumberField;
  tiempoMezclado: NumberField;
  agregado: WaterMode;
  temperaturaMasa: NumberField;
  tiempoPicado: NumberField;
  tiempoPorcionado: NumberField;
  tiempoBoleado: NumberField;
  tiempoFermentacion: NumberField;
  tiempoHorno: NumberField;
  temperaturaHorno: NumberField;
  tiempoTraslado: NumberField;
  operariosBoleado: NumberField;
  carritos: NumberField;
  equiposDanados: EquipmentKey[];
};

export type StageResult = {
  id: string;
  name: string;
  value: NumberField;
  min?: number;
  max?: number;
  target: number;
  unit: string;
  pressure: number;
  status: "ok" | "warning" | "critical";
  note: string;
};

export type MonteCarloVariable = {
  name: string;
  variation: string;
};

export type MonteCarloResult = {
  iterations: number;
  p50: number;
  p90: number;
  delayProbability: number;
  bottleneckFrequency: Array<{ stage: string; probability: number }>;
  variables: MonteCarloVariable[];
};

export type AnalysisResult = {
  bottleneck: StageResult;
  stages: StageResult[];
  alerts: string[];
  suggestions: string[];
  totalTime: number | null;
  monteCarlo: MonteCarloResult;
};

export type GroupAnalysisResult = {
  lotCount: number;
  alerts: string[];
  topBottlenecks: Array<{ stage: string; lots: number }>;
  maxConcurrentCarts: number;
  lotsOutsideIdealZone: number;
  lotTotals: Array<{ lote: string; totalTime: number | null; carritos: number }>;
  monteCarlo: MonteCarloResult;
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

export const equipmentOptions: Record<EquipmentKey, string> = {
  amasadora_1: "Amasadora 1",
  amasadora_2: "Amasadora 2",
  amasadora_3: "Amasadora 3",
  porcionadores: "Porcionadores",
  laminadoras: "Laminadoras",
  sobadoras: "Sobadoras",
  horno_1: "Horno 1",
  horno_2: "Horno 2",
  horno_3: "Horno 3",
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

const monteCarloVariables: MonteCarloVariable[] = [
  { name: "Tiempo de mezclado", variation: "variación operativa de ±11 %" },
  { name: "Tiempo de picado con reposo", variation: "variación operativa de ±11 %" },
  { name: "Tiempo de porcionado", variation: "variación operativa de ±11 %" },
  { name: "Tiempo de boleado", variation: "variación operativa de ±11 %" },
  { name: "Tiempo de fermentación", variation: "variación térmica de ±6 %" },
  { name: "Tiempo de horno", variation: "variación operativa de ±11 %" },
  { name: "Traslado a empaquetado", variation: "variación logística de ±20 %" },
  { name: "Carritos en fermentadora", variation: "capacidad compartida: 18 puestos, solo 3 en zona ideal" },
  { name: "Zona no ideal de fermentación", variation: "demora adicional simulada de 10 % a 25 %" },
  { name: "Equipos dañados", variation: "incrementan presión de la etapa afectada" },
];

function isNumber(value: NumberField | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function mixingRange(recipe: RecipeKey) {
  if (recipe === "premezcla_8") return { min: 20, max: 45 };
  if (recipe === "premezcla_6") return { min: 20, max: 40 };
  return { min: 15, max: 35 };
}

function ovenTemperatureRange(product: ProductKey, oven: ProcessInput["horno"]) {
  if (product === "hamburguesa_brioche") return { min: 165, max: 170 };
  if (product === "pan_cuadrado") {
    if (oven === "1") return { min: 160, max: 160 };
    if (oven === "2") return { min: 170, max: 170 };
    return { min: 175, max: 175 };
  }
  return { min: 160, max: 160 };
}

function ovenTimeRange(input: ProcessInput) {
  if (input.receta === "premezcla_4") return { min: 14, max: 16 };
  return ovenTimeRanges[input.producto];
}

function temperatureRule(range: { min: number; max: number }) {
  if (range.min === range.max) return `exactamente ${range.min} °C`;
  return `entre ${range.min} °C y ${range.max} °C`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pushUnique(list: string[], message: string) {
  if (!list.includes(message)) list.push(message);
}

function equipmentPressure(input: ProcessInput, id: string) {
  if (id === "mezclado" && input.equiposDanados.includes(`amasadora_${input.amasadora}`)) return 1.5;
  if (id === "mezclado" && input.equiposDanados.some((item) => item.startsWith("amasadora_"))) return 1.2;
  if (id === "porcionado" && input.equiposDanados.includes("porcionadores")) return 1.45;
  if (id === "porcionado" && input.equiposDanados.includes("sobadoras")) return 1.18;
  if (id === "boleado" && input.equiposDanados.includes("laminadoras")) return 1.15;
  if (id === "horno" && input.equiposDanados.includes(`horno_${input.horno}`)) return 1.5;
  if (id === "horno" && input.equiposDanados.some((item) => item.startsWith("horno_"))) return 1.2;
  return 1;
}

function stage(
  id: string,
  name: string,
  value: NumberField,
  range: { min?: number; max?: number },
  unit = "min",
  note = "",
  pressureFactor = 1,
): StageResult {
  const target = range.max ?? range.min ?? (isNumber(value) ? value : 0);

  if (!isNumber(value)) {
    return {
      id,
      name,
      value,
      min: range.min,
      max: range.max,
      target,
      unit,
      pressure: 0,
      status: "warning",
      note: `${note} Dato pendiente.`,
    };
  }

  const upperPressure = range.max ? value / range.max : 1;
  const lowerPressure = range.min && value < range.min ? range.min / Math.max(value, 0.1) : 1;
  const pressure = Math.max(upperPressure, lowerPressure) * pressureFactor;
  const outBy = Math.abs(pressure - 1);

  return {
    id,
    name,
    value,
    min: range.min,
    max: range.max,
    target,
    unit,
    pressure,
    status: outBy > 0.15 ? "critical" : outBy > 0.03 ? "warning" : "ok",
    note,
  };
}

function pendingStage(): StageResult {
  return {
    id: "pendiente",
    name: "Datos pendientes",
    value: null,
    target: 0,
    unit: "",
    pressure: 0,
    status: "warning",
    note: "Ingrese los tiempos para detectar el cuello de botella.",
  };
}

function percentile(values: number[], ratio: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * ratio);
  return sorted[index] ?? 0;
}

function spreadForStage(id: string) {
  if (id === "traslado") return 0.2;
  if (id === "fermentacion") return 0.06;
  return 0.11;
}

function randomAround(value: number, spread: number) {
  const low = 1 - spread;
  const high = 1 + spread;
  return value * (low + Math.random() * (high - low));
}

function measuredStages(stages: StageResult[]): Array<StageResult & { value: number }> {
  return stages.filter((item): item is StageResult & { value: number } => isNumber(item.value));
}

function totalProcessTime(stages: StageResult[]) {
  const processStages = stages.filter((item) => item.id !== "temperatura_horno");
  if (processStages.some((item) => !isNumber(item.value))) return null;
  return processStages.reduce((sum, item) => sum + (item.value ?? 0), 0);
}

function simulateStages(stages: StageResult[]) {
  return measuredStages(stages).map((item) => {
    const simulatedValue = randomAround(item.value, spreadForStage(item.id));
    const simulatedPressure = Math.max(
      item.max ? simulatedValue / item.max : 1,
      item.min && simulatedValue < item.min ? item.min / Math.max(simulatedValue, 0.1) : 1,
    );
    return { ...item, simulatedValue, simulatedPressure };
  });
}

function runMonteCarlo(stages: StageResult[]): MonteCarloResult {
  const iterations = 1200;
  const totals: number[] = [];
  const delayed: boolean[] = [];
  const frequency = new Map<string, number>();

  for (let index = 0; index < iterations; index += 1) {
    const simulated = simulateStages(stages);
    if (simulated.length === 0) {
      totals.push(0);
      delayed.push(false);
      continue;
    }

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
      .map(([stageName, count]) => ({ stage: stageName, probability: Math.round((count / iterations) * 100) }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5),
    variables: monteCarloVariables,
  };
}

function missingAlerts(input: ProcessInput, alerts: string[]) {
  const labels: Array<[keyof ProcessInput, string]> = [
    ["temperaturaArea", "temperatura del área"],
    ["humedadRelativa", "humedad relativa"],
    ["pesoPremezcla", "peso de pre-mezcla"],
    ["operariosBoleado", "cantidad de operarios boleando"],
    ["temperaturaMasa", "temperatura de masa"],
    ["tiempoMezclado", "tiempo de mezclado"],
    ["tiempoPicado", "tiempo de picado"],
    ["tiempoPorcionado", "tiempo de porcionado"],
    ["tiempoBoleado", "tiempo de boleado"],
    ["tiempoFermentacion", "tiempo de fermentación"],
    ["tiempoHorno", "tiempo de horno"],
    ["temperaturaHorno", "temperatura de horno"],
    ["tiempoTraslado", "tiempo de traslado"],
    ["carritos", "cantidad de carritos del lote"],
  ];

  labels.forEach(([key, label]) => {
    if (!isNumber(input[key] as NumberField)) pushUnique(alerts, `Falta ingresar ${label}.`);
  });
}

function addEquipmentAlerts(input: ProcessInput, alerts: string[], suggestions: string[]) {
  const damaged = input.equiposDanados;
  if (damaged.length === 0) return;

  pushUnique(alerts, `Equipos no disponibles: ${damaged.map((item) => equipmentOptions[item]).join(", ")}.`);

  if (damaged.includes(`amasadora_${input.amasadora}`)) {
    pushUnique(alerts, `La amasadora ${input.amasadora} seleccionada no está funcionando.`);
    pushUnique(suggestions, "Cambie el lote a una amasadora disponible antes de ajustar el tiempo de mezclado.");
  } else if (damaged.some((item) => item.startsWith("amasadora_"))) {
    pushUnique(suggestions, "Hay menos capacidad de amasado disponible; escalone los inicios de lote para evitar espera en mezclado.");
  }

  if (damaged.includes("porcionadores")) {
    pushUnique(alerts, "La ausencia de porcionadores puede acumular masa antes del formado.");
    pushUnique(suggestions, "Planifique apoyo manual o reasigne personal de formado para sostener porcionado mientras el equipo se recupera.");
  }
  if (damaged.includes("laminadoras")) {
    pushUnique(alerts, "La laminadora no disponible reduce la capacidad de formado cuando el producto la requiere.");
    pushUnique(suggestions, "Antes de liberar más lotes hacia formado, confirme una ruta alternativa para laminado o cambie la secuencia de producto.");
  }
  if (damaged.includes("sobadoras")) {
    pushUnique(alerts, "La sobadora no disponible puede retrasar la transición entre porcionado y formado.");
    pushUnique(suggestions, "Reordene los lotes que dependan de sobado y use el personal compartido en el punto de espera.");
  }
  if (damaged.includes(`horno_${input.horno}`)) {
    pushUnique(alerts, `El horno ${input.horno} seleccionado no está funcionando.`);
    pushUnique(suggestions, "Cambie el lote a un horno disponible y revise la temperatura objetivo antes de cocción.");
  } else if (damaged.some((item) => item.startsWith("horno_"))) {
    pushUnique(suggestions, "Con menos hornos disponibles, proteja la cola de fermentación y programe la entrada a cocción por prioridad de lote.");
  }
}

export function analyzeProcess(input: ProcessInput): AnalysisResult {
  const alerts: string[] = [];
  const suggestions: string[] = [];
  const productName = products[input.producto];
  const premix = premixRanges[input.receta];
  const ovenTemp = ovenTemperatureRange(input.producto, input.horno);

  missingAlerts(input, alerts);
  addEquipmentAlerts(input, alerts, suggestions);

  if (isNumber(input.temperaturaArea) && input.temperaturaArea < 22) {
    pushUnique(alerts, "La temperatura del área está por debajo de 22 °C; puede retrasar el manejo y la fermentación.");
    pushUnique(suggestions, "Revise la condición térmica del área antes de alargar tiempos de proceso.");
  }
  if (isNumber(input.temperaturaArea) && input.temperaturaArea > 35) {
    pushUnique(alerts, "La temperatura del área supera 35 °C; puede acelerar la masa fuera del flujo previsto.");
    pushUnique(suggestions, "Controle enfriamiento e hidratación antes de adelantar lotes hacia fermentación.");
  }
  if (isNumber(input.humedadRelativa) && input.humedadRelativa > 65) {
    pushUnique(alerts, "Humedad inválida: supera 65 %. Revise el dato y la condición ambiental del lote.");
  } else if (isNumber(input.humedadRelativa) && (input.humedadRelativa < 45 || input.humedadRelativa > 55)) {
    pushUnique(alerts, "La humedad relativa está fuera del rango ideal de 45 % a 55 %.");
    pushUnique(suggestions, "Considere el efecto de la humedad antes de modificar el reposo o la secuencia de formado.");
  }
  if (isNumber(input.temperaturaMasa) && (input.temperaturaMasa < 28 || input.temperaturaMasa > 31)) {
    pushUnique(alerts, "La temperatura de masa debe estar entre 28 °C y 31 °C; fuera de ese rango puede afectar la formación del pan y la calidad del producto.");
    pushUnique(suggestions, "Ajuste agua o hielo y revise el amasado para devolver la masa al rango de formación.");
  }
  if (isNumber(input.pesoPremezcla) && (input.pesoPremezcla < premix.min || input.pesoPremezcla > premix.max)) {
    pushUnique(alerts, `El peso de ${recipes[input.receta]} debe estar entre ${premix.min} g y ${premix.max} g.`);
    pushUnique(suggestions, "Corrija el peso de pre-mezcla antes de atribuir el desvío a la operación del personal.");
  }
  if (isNumber(input.carritos) && input.carritos > 18) {
    pushUnique(alerts, "Un lote no puede ocupar más de 18 carritos simultáneamente en la fermentadora.");
    pushUnique(suggestions, "Divida la entrada del lote a fermentación o reprográmela para respetar la capacidad de 18 carritos.");
  }
  if (input.carritos === 0) {
    pushUnique(alerts, "Indique al menos 1 carrito para evaluar la ocupación real de la fermentadora.");
  }
  if (isNumber(input.carritos) && input.carritos > 3) {
    pushUnique(alerts, "Solo 3 carritos pueden permanecer simultáneamente en la zona ideal de fermentación; parte del lote puede tardar más.");
  }

  const stages = [
    stage(
      "mezclado",
      "Mezclado",
      input.tiempoMezclado,
      mixingRange(input.receta),
      "min",
      `Amasadora ${input.amasadora}; inicio ${input.horaInicioAmasado || "pendiente"}.`,
      equipmentPressure(input, "mezclado"),
    ),
    stage("picado", "Picado con reposo", input.tiempoPicado, { min: 8, max: 10 }, "min", "Incluye reposo de masa."),
    stage(
      "porcionado",
      "Porcionado",
      input.tiempoPorcionado,
      { max: 10 },
      "min",
      "Transición hacia formado.",
      equipmentPressure(input, "porcionado"),
    ),
    stage(
      "boleado",
      "Boleado",
      input.tiempoBoleado,
      { max: 15 },
      "min",
      `${isNumber(input.operariosBoleado) ? input.operariosBoleado : "Sin dato de"} operarios reportados.`,
      equipmentPressure(input, "boleado"),
    ),
    stage("fermentacion", "Fermentación", input.tiempoFermentacion, fermentationRanges[input.producto], "min", productName),
    stage(
      "horno",
      "Horno",
      input.tiempoHorno,
      ovenTimeRange(input),
      "min",
      `Horno ${input.horno}; cocción por producto y receta.`,
      equipmentPressure(input, "horno"),
    ),
    stage("traslado", "Traslado a empaquetado", input.tiempoTraslado, { max: 5 }, "min", "Movimiento posterior al horno."),
  ];

  const temperatureStage = stage("temperatura_horno", "Temperatura de horno", input.temperaturaHorno, ovenTemp, "°C");
  if (temperatureStage.status !== "ok" && isNumber(input.temperaturaHorno)) {
    pushUnique(alerts, `La temperatura de horno para ${productName} debe ser ${temperatureRule(ovenTemp)}.`);
  }
  if (input.receta === "premezcla_4" && isNumber(input.tiempoHorno) && (input.tiempoHorno < 14 || input.tiempoHorno > 16)) {
    pushUnique(alerts, "Para la pre-mezcla de 4, el tiempo de horno debe estar entre 14 y 16 min.");
    pushUnique(suggestions, "Ajuste la cocción de la pre-mezcla de 4 dentro de 14 a 16 min antes de cambiar el flujo del lote.");
  }
  if (isNumber(input.tiempoPicado) && input.tiempoPicado < 8) {
    pushUnique(
      alerts,
      "El picado con reposo es menor a 8 min; la masa no reposa lo suficiente para adquirir las cualidades necesarias de formado y fermentación.",
    );
  }

  stages.forEach((item) => {
    if (item.status === "ok" || !isNumber(item.value)) return;
    if (item.id === "mezclado") pushUnique(suggestions, "Revise la carga y el tiempo de mezclado de la amasadora seleccionada antes de iniciar el siguiente lote.");
    if (item.id === "picado") pushUnique(suggestions, "Mantenga picado con reposo entre 8 y 10 min para no empujar variación hacia formado.");
    if (item.id === "porcionado") pushUnique(suggestions, "Refuerce porcionado con personal compartido si se acerca o supera 10 min.");
    if (item.id === "boleado") pushUnique(suggestions, "Reasigne apoyo a boleado hasta recuperar un tiempo menor o igual a 15 min.");
    if (item.id === "fermentacion") pushUnique(suggestions, "Ajuste la secuencia del lote alrededor de fermentación; mover personal no corrige por sí solo ese tiempo.");
    if (item.id === "horno") pushUnique(suggestions, "Proteja la disponibilidad del horno seleccionado y evite que fermentación libere más producto del que puede cocerse.");
    if (item.id === "traslado") pushUnique(suggestions, "Coordine el traslado al salir del horno para no superar 5 min hacia empaquetado.");
  });

  if (isNumber(input.operariosBoleado) && input.operariosBoleado < 8) {
    pushUnique(alerts, "El boleado tiene menos de 8 operarios reportados.");
    pushUnique(suggestions, "Use entre 8 y 10 operarios en boleado cuando el lote llegue a formado.");
  }
  if (isNumber(input.operariosBoleado) && input.operariosBoleado > 10) {
    pushUnique(alerts, "El boleado tiene más de 10 operarios reportados.");
    pushUnique(suggestions, "Si boleado ya está dentro de tiempo, mueva el excedente hacia porcionado o traslado.");
  }
  if (input.agregado === "hielo" && isNumber(input.temperaturaMasa) && input.temperaturaMasa < 28) {
    pushUnique(suggestions, "Revise la cantidad de hielo; una masa fría puede alargar formación y fermentación.");
  }

  const validStages = measuredStages(stages);
  const bottleneck =
    validStages.length > 0
      ? validStages.reduce((winner, item) => (item.pressure > winner.pressure ? item : winner))
      : pendingStage();

  if (suggestions.length === 0) {
    suggestions.push("El flujo medido está dentro de los rangos evaluados. Mantenga la secuencia y vigile esperas entre fermentación, horno y traslado.");
  }

  return {
    bottleneck,
    stages: [...stages, temperatureStage],
    alerts,
    suggestions,
    totalTime: totalProcessTime(stages),
    monteCarlo: runMonteCarlo(stages),
  };
}

function startMinute(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : 0;
}

function cartCount(input: ProcessInput) {
  if (!isNumber(input.carritos) || input.carritos < 1) return 1;
  return Math.min(18, Math.ceil(input.carritos));
}

function stageValue(stages: StageResult[], id: string) {
  const value = stages.find((item) => item.id === id)?.value;
  return isNumber(value) ? value : null;
}

function lotParts(stages: StageResult[]) {
  const beforeIds = ["mezclado", "picado", "porcionado", "boleado"];
  const afterIds = ["horno", "traslado"];
  const beforeValues = beforeIds.map((id) => stageValue(stages, id));
  const afterValues = afterIds.map((id) => stageValue(stages, id));
  const fermentation = stageValue(stages, "fermentacion");
  if (beforeValues.includes(null) || afterValues.includes(null) || fermentation === null) return null;

  return {
    before: beforeValues.reduce<number>((sum, value) => sum + (value ?? 0), 0),
    fermentation,
    after: afterValues.reduce<number>((sum, value) => sum + (value ?? 0), 0),
  };
}

function fermentationSchedule(
  lots: Array<{ input: ProcessInput; parts: { before: number; fermentation: number; after: number } }>,
  randomize = false,
) {
  const slotAvailability = Array.from({ length: 18 }, () => 0);
  const intervals: Array<{ start: number; end: number }> = [];
  let lotsOutsideIdealZone = 0;
  let waitingOccurred = false;
  let latestCompletion = 0;
  const earliestStart = Math.min(...lots.map(({ input }) => startMinute(input.horaInicioAmasado)));

  [...lots]
    .sort((a, b) => startMinute(a.input.horaInicioAmasado) - startMinute(b.input.horaInicioAmasado))
    .forEach(({ input, parts }) => {
      const arrival = startMinute(input.horaInicioAmasado) + parts.before;
      const carts = cartCount(input);
      let usedNonIdeal = false;
      let lotLeavesFermenter = arrival;

      for (let cart = 0; cart < carts; cart += 1) {
        const availableSlot = slotAvailability.findIndex((availableAt) => availableAt <= arrival);
        const firstFree = Math.min(...slotAvailability);
        const slot = availableSlot >= 0 ? availableSlot : slotAvailability.indexOf(firstFree);
        const enters = Math.max(arrival, firstFree);
        const outsideIdeal = slot >= 3;
        const delayFactor = outsideIdeal ? (randomize ? 1.1 + Math.random() * 0.15 : 1.175) : 1;
        const leaves = enters + parts.fermentation * delayFactor;
        if (enters > arrival) waitingOccurred = true;
        if (outsideIdeal) usedNonIdeal = true;
        intervals.push({ start: enters, end: leaves });
        slotAvailability[slot] = leaves;
        lotLeavesFermenter = Math.max(lotLeavesFermenter, leaves);
      }

      if (usedNonIdeal) lotsOutsideIdealZone += 1;
      latestCompletion = Math.max(latestCompletion, lotLeavesFermenter + parts.after);
    });

  const events = intervals
    .flatMap((item) => [
      { time: item.start, delta: 1 },
      { time: item.end, delta: -1 },
    ])
    .sort((a, b) => a.time - b.time || a.delta - b.delta);
  let active = 0;
  let maxConcurrentCarts = 0;
  events.forEach((event) => {
    active += event.delta;
    maxConcurrentCarts = Math.max(maxConcurrentCarts, active);
  });

  return {
    cycleTime: Math.max(0, latestCompletion - earliestStart),
    maxConcurrentCarts,
    lotsOutsideIdealZone,
    waitingOccurred,
  };
}

export function analyzeGroup(inputs: ProcessInput[]): GroupAnalysisResult {
  const selected = inputs.slice(0, 30);
  const analyses = selected.map((item) => analyzeProcess(item));
  const bottleneckCounts = new Map<string, number>();
  const alerts: string[] = [];

  analyses.forEach((item) => {
    bottleneckCounts.set(item.bottleneck.name, (bottleneckCounts.get(item.bottleneck.name) ?? 0) + 1);
    item.alerts.forEach((alert) => pushUnique(alerts, alert));
  });

  const schedulableLots = selected.flatMap((input, index) => {
    const parts = lotParts(analyses[index].stages);
    return parts ? [{ input, parts }] : [];
  });
  const nominalSchedule =
    schedulableLots.length > 0
      ? fermentationSchedule(schedulableLots)
      : { cycleTime: 0, maxConcurrentCarts: 0, lotsOutsideIdealZone: 0, waitingOccurred: false };

  if (nominalSchedule.lotsOutsideIdealZone > 0) {
    pushUnique(
      alerts,
      `${nominalSchedule.lotsOutsideIdealZone} lote(s) usan posiciones fuera de la zona ideal de fermentación; el modelo aplica retraso adicional.`,
    );
  }
  if (nominalSchedule.waitingOccurred) {
    pushUnique(alerts, "La cola de fermentadora obliga a uno o más carritos a esperar por disponibilidad.");
  }

  const iterations = 1200;
  const totals: number[] = [];
  const delays: boolean[] = [];
  const simulatedBottlenecks = new Map<string, number>();

  for (let index = 0; index < iterations; index += 1) {
    const simulatedLots = selected.flatMap((input, lotIndex) => {
      const simulated = simulateStages(analyses[lotIndex].stages);
      const parts = lotParts(
        simulated.map((item) => ({
          ...item,
          value: item.simulatedValue,
        })),
      );
      return parts ? [{ input, parts }] : [];
    });
    const schedule =
      simulatedLots.length > 0
        ? fermentationSchedule(simulatedLots, true)
        : { cycleTime: 0, maxConcurrentCarts: 0, lotsOutsideIdealZone: 0, waitingOccurred: false };

    totals.push(schedule.cycleTime);
    const hasFermentationDelay = schedule.lotsOutsideIdealZone > 0 || schedule.waitingOccurred;
    delays.push(hasFermentationDelay);
    if (hasFermentationDelay) {
      simulatedBottlenecks.set("Fermentación compartida", (simulatedBottlenecks.get("Fermentación compartida") ?? 0) + 1);
    } else {
      const principal = analyses.reduce((winner, analysis) =>
        analysis.bottleneck.pressure > winner.bottleneck.pressure ? analysis : winner,
      );
      simulatedBottlenecks.set(principal.bottleneck.name, (simulatedBottlenecks.get(principal.bottleneck.name) ?? 0) + 1);
    }
  }

  return {
    lotCount: selected.length,
    alerts,
    maxConcurrentCarts: nominalSchedule.maxConcurrentCarts,
    lotsOutsideIdealZone: nominalSchedule.lotsOutsideIdealZone,
    lotTotals: selected.map((input, index) => ({
      lote: input.lote,
      totalTime: analyses[index].totalTime,
      carritos: cartCount(input),
    })),
    topBottlenecks: [...bottleneckCounts.entries()]
      .map(([stageName, lots]) => ({ stage: stageName, lots }))
      .sort((a, b) => b.lots - a.lots),
    monteCarlo: {
      iterations,
      p50: Math.round(percentile(totals, 0.5)),
      p90: Math.round(percentile(totals, 0.9)),
      delayProbability: Math.round((delays.filter(Boolean).length / iterations) * 100),
      bottleneckFrequency: [...simulatedBottlenecks.entries()]
        .map(([stageName, count]) => ({
          stage: stageName,
          probability: Math.round((count / Math.max(iterations, 1)) * 100),
        }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5),
      variables: monteCarloVariables,
    },
  };
}

export function defaultInput(): ProcessInput {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    lote: "L-001",
    producto: "hamburguesa_tradicional",
    amasadora: "1",
    horno: "1",
    temperaturaArea: null,
    humedadRelativa: null,
    horaInicioAmasado: "07:00",
    receta: "premezcla_6",
    pesoPremezcla: null,
    tiempoMezclado: null,
    agregado: "agua",
    temperaturaMasa: null,
    tiempoPicado: null,
    tiempoPorcionado: null,
    tiempoBoleado: null,
    tiempoFermentacion: null,
    tiempoHorno: null,
    temperaturaHorno: null,
    tiempoTraslado: null,
    operariosBoleado: null,
    carritos: null,
    equiposDanados: [],
  };
}

export function normalizeInput(input: Partial<ProcessInput>): ProcessInput {
  const fallback = defaultInput();
  return {
    ...fallback,
    ...input,
    horno: input.horno ?? fallback.horno,
    equiposDanados: input.equiposDanados ?? [],
  };
}

export function scoreStage(stageResult: StageResult) {
  return clamp(Math.round(stageResult.pressure * 100), 0, 180);
}
