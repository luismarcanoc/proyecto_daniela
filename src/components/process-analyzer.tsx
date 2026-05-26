"use client";

import { useEffect, useMemo, useState } from "react";
import {
  analyzeGroup,
  analyzeProcess,
  defaultInput,
  equipmentOptions,
  isProcessComplete,
  normalizeInput,
  products,
  recipes,
  scoreStage,
  type AnalysisResult,
  type EquipmentKey,
  type NumberField,
  type OptionalProcessTime,
  type ProcessInput,
  type ProductKey,
  type RecipeKey,
  type StageResult,
} from "@/lib/process-analysis";

type WasteReasonKey =
  | "adherido_bandeja"
  | "adherido_silpad"
  | "burbuja_mancha_corona"
  | "alveolado_cavidad"
  | "crudo"
  | "quemado"
  | "color"
  | "fermentado"
  | "pan_pequeno"
  | "pan_grande"
  | "mal_formado"
  | "deformado_horno"
  | "mal_corte"
  | "manchado"
  | "aplastado_maltratado_roto"
  | "sobrante_buen_estado"
  | "caido_piso"
  | "materia_extrana"
  | "defecto_mezcla";

type SavedAnalysis = {
  id: string;
  input: ProcessInput;
  result: AnalysisResult;
  createdAt: string;
  wasteReported: boolean;
  wasteReasons: WasteReasonKey[];
};

const storageKey = "proyecto-daniela-analisis";
const wasteReasons: Record<WasteReasonKey, { label: string; description: string }> = {
  adherido_bandeja: {
    label: "Adherido a Bandeja/Molde/Aro",
    description: "Engrasado insuficiente o mal ejecutado en bandeja, aro o molde.",
  },
  adherido_silpad: {
    label: "Adherido al Silpad",
    description: "Secado inadecuado del Silpad de horneado.",
  },
  burbuja_mancha_corona: {
    label: "Burbuja/Mancha en la Corona",
    description: "Fermentación excesiva o exceso de humedad en fermentadora.",
  },
  alveolado_cavidad: {
    label: "Alveolado/Cavidad",
    description: "Formado o fermentación inadecuada.",
  },
  crudo: {
    label: "Crudo",
    description: "Cocción insuficiente; temperatura interna menor a 92 °C.",
  },
  quemado: {
    label: "Quemado",
    description: "Horneado excesivo con olor o sabor a quemado.",
  },
  color: {
    label: "Color",
    description: "Color por debajo o por encima del estándar aunque la cocción sea suficiente.",
  },
  fermentado: {
    label: "Fermentado",
    description: "Exceso de fermentación, acidez o poco volumen tras hornear.",
  },
  pan_pequeno: {
    label: "Pan pequeño",
    description: "No alcanza tamaño mínimo por fermentación o ingredientes/fórmula.",
  },
  pan_grande: {
    label: "Pan Grande",
    description: "Tamaño por encima del estándar por levado excesivo.",
  },
  mal_formado: {
    label: "Mal Formado",
    description: "Boleado, formado o colocación en bandeja inadecuado.",
  },
  deformado_horno: {
    label: "Deformado (Horno)",
    description: "Deformación durante traslado o introducción al horno.",
  },
  mal_corte: {
    label: "Mal corte",
    description: "Daño durante el corte o rebanado.",
  },
  manchado: {
    label: "Manchado",
    description: "Grasa, carbón u otra sustancia durante fermentación, horneado o traslado.",
  },
  aplastado_maltratado_roto: {
    label: "Aplastado/Maltratado/Roto",
    description: "Daño por manipulación durante desmoldeado o empacado.",
  },
  sobrante_buen_estado: {
    label: "Sobrante en buen estado",
    description: "No completa un paquete aunque está en buen estado.",
  },
  caido_piso: {
    label: "Caído al piso",
    description: "Producto caído al piso.",
  },
  materia_extrana: {
    label: "Materia Extraña",
    description: "Metal, plástico u otra materia contaminante.",
  },
  defecto_mezcla: {
    label: "Defecto de Mezcla",
    description: "Sabor, textura o apariencia no conforme por mezclado o fórmula.",
  },
};
const pieColors = ["#1c7c65", "#bd7b18", "#b73535", "#3179a8", "#70529b", "#489870", "#c05d43", "#67736e"];
const numberFields = [
  ["tiempoMezclado", "Mezclado"],
  ["tiempoPicado", "Picado"],
  ["tiempoPorcionado", "Porcionado"],
  ["tiempoBoleado", "Boleado"],
  ["tiempoFermentacion", "Fermentación"],
  ["tiempoHorno", "Horno"],
  ["tiempoTraslado", "Traslado"],
] as const;

function numberValue(value: string): NumberField {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function excelText(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function exportExcel(history: SavedAnalysis[]) {
  const columns = [
    "Fecha lote",
    "Lote",
    "Producto",
    "Receta",
    "Agregado (agua/hielo)",
    "Amasadora",
    "Inicio amasado",
    "Horno",
    "Temperatura área",
    "Humedad relativa",
    "Peso pre-mezcla",
    "Operarios boleando",
    "Temperatura masa",
    "Tiempo mezclado",
    "Tiempo picado",
    "Tiempo sobadora",
    "Tiempo porcionado",
    "Tiempo laminadora",
    "Tiempo boleado",
    "Tiempo fermentación",
    "Tiempo horno",
    "Temperatura horno",
    "Tiempo traslado",
    "Equipos dañados",
    "Cuello individual",
    "Tiempo total",
    "P50 Monte Carlo",
    "P90 Monte Carlo",
    "Riesgo atraso",
    "Alertas",
    "Sugerencias",
    "Tuvo merma",
    "Motivos de merma",
  ];

  const rows = history.map((item) => [
    item.input.fecha,
    item.input.lote,
    products[item.input.producto],
    recipes[item.input.receta],
    item.input.agregado === "agua" ? "Agua" : "Hielo",
    item.input.amasadora,
    item.input.horaInicioAmasado,
    item.input.horno,
    item.input.temperaturaArea,
    item.input.humedadRelativa,
    item.input.pesoPremezcla,
    item.input.operariosBoleado,
    item.input.temperaturaMasa,
    item.input.tiempoMezclado,
    item.input.tiempoPicado,
    item.input.tiempoSobadora === "no_aplica" ? "No aplica" : item.input.tiempoSobadora,
    item.input.tiempoPorcionado,
    item.input.tiempoLaminadora === "no_aplica" ? "No aplica" : item.input.tiempoLaminadora,
    item.input.tiempoBoleado,
    item.input.tiempoFermentacion,
    item.input.tiempoHorno,
    item.input.temperaturaHorno,
    item.input.tiempoTraslado,
    item.input.equiposDanados.map((key) => equipmentOptions[key]).join(", "),
    item.result.bottleneck.name,
    item.result.totalTime,
    item.result.monteCarlo.p50,
    item.result.monteCarlo.p90,
    `${item.result.monteCarlo.delayProbability}%`,
    item.result.alerts.join(" | "),
    item.result.suggestions.join(" | "),
    item.wasteReported ? "Sí" : "No",
    item.wasteReasons.map((key) => wasteReasons[key].label).join(", "),
  ]);

  const sheetRows = [columns, ...rows]
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${excelText(cell)}</Data></Cell>`)
          .join("")}</Row>`,
    )
    .join("");
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Analisis">
  <Table>${sheetRows}</Table>
 </Worksheet>
</Workbook>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "base-analisis-lotes.xls";
  anchor.click();
  URL.revokeObjectURL(url);
  window.alert("La exportación del archivo de Excel con lotes fue exitosa.");
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 1000,
  integer = false,
}: {
  value: NumberField;
  onChange: (value: NumberField) => void;
  min?: number;
  max?: number | null;
  integer?: boolean;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max ?? undefined}
      step={integer ? 1 : "any"}
      value={value ?? ""}
      onChange={(event) => {
        const parsed = numberValue(event.target.value);
        if (parsed !== null && ((max !== null && parsed > max) || (integer && !Number.isInteger(parsed)))) {
          onChange(null);
          return;
        }
        onChange(parsed);
      }}
    />
  );
}

function OptionalTimeInput({
  value,
  onChange,
}: {
  value: OptionalProcessTime;
  onChange: (value: OptionalProcessTime) => void;
}) {
  const mode = value === "no_aplica" ? "no_aplica" : "tiempo";

  return (
    <div className="optional-time">
      <select
        value={mode}
        onChange={(event) => onChange(event.target.value === "no_aplica" ? "no_aplica" : null)}
      >
        <option value="tiempo">Registrar minutos</option>
        <option value="no_aplica">No aplica</option>
      </select>
      {mode === "tiempo" ? (
        <NumberInput value={value as NumberField} onChange={onChange} />
      ) : (
        <span className="na-value">No aplica</span>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: "ok" | "warning" | "critical" }) {
  return <span className={`status-dot ${status}`} aria-hidden="true" />;
}

function stageRangeLabel(item: StageResult) {
  if (item.value === "no_aplica") return "";
  if (item.min === undefined && item.max === undefined) return "";
  if (item.min !== undefined && item.min === item.max) return ` · valor exacto ${item.min} ${item.unit}`;
  return ` · rango ${item.min ?? "0"}-${item.max ?? "sin límite"} ${item.unit}`;
}

function stageValueLabel(value: StageResult["value"]) {
  return value === "no_aplica" ? "No aplica" : value ?? "Pendiente";
}

function wasteBreakdown(items: SavedAnalysis[]) {
  const count = new Map<WasteReasonKey, number>();
  items
    .filter((item) => item.wasteReported && isProcessComplete(item.input))
    .forEach((item) => item.wasteReasons.forEach((reason) => count.set(reason, (count.get(reason) ?? 0) + 1)));

  return [...count.entries()].map(([reason, value]) => ({
    label: wasteReasons[reason].label,
    value,
  }));
}

function isWasteReasonKey(value: unknown): value is WasteReasonKey {
  return typeof value === "string" && value in wasteReasons;
}

function PieChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: Array<{ label: string; value: number }>;
}) {
  const totalProblems = data.reduce((sum, item) => sum + item.value, 0);
  const totalCauses = data.length;
  let angle = 0;
  const gradient =
    totalProblems === 0
      ? "#ebe2d6"
      : `conic-gradient(${data
          .map((item, index) => {
            const start = angle;
            angle += (item.value / totalProblems) * 360;
            return `${pieColors[index % pieColors.length]} ${start}deg ${angle}deg`;
          })
          .join(", ")})`;

  return (
    <article className="waste-chart">
      <div className="section-title compact">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="pie-layout">
        <div
          className="pie-chart"
          style={{ background: gradient }}
          role="img"
          aria-label={`${title}: ${totalCauses} causas distintas y ${totalProblems} problemas registrados`}
        >
          <strong>{totalCauses}</strong>
          <span>causas</span>
        </div>
        {totalProblems === 0 ? (
          <p className="empty">No hay motivos de merma registrados para esta selección.</p>
        ) : (
          <div className="pie-legend">
            {data.map((item, index) => (
              <div key={item.label}>
                <span style={{ background: pieColors[index % pieColors.length] }} />
                <p>{item.label}</p>
                <strong>
                  {item.value} {item.value === 1 ? "problema" : "problemas"} · {Math.round((item.value / totalProblems) * 100)}%
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProcessAnalyzer() {
  const [input, setInput] = useState<ProcessInput>(() => defaultInput());
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wasteLotId, setWasteLotId] = useState("");
  const result = useMemo(() => analyzeProcess(input), [input]);
  const selectedAnalyses = useMemo(
    () => history.filter((item) => selectedIds.includes(item.id)).slice(0, 30),
    [history, selectedIds],
  );
  const groupResult = useMemo(
    () => (selectedAnalyses.length > 0 ? analyzeGroup(selectedAnalyses.map((item) => item.input)) : null),
    [selectedAnalyses],
  );
  const wasteLot = history.find((item) => item.id === wasteLotId) ?? null;
  const wasteLotIsComplete = wasteLot ? isProcessComplete(wasteLot.input) : false;
  const individualWasteData = wasteLot ? wasteBreakdown([wasteLot]) : [];
  const groupWasteData = wasteBreakdown(selectedAnalyses);
  const groupWasteCount = selectedAnalyses.filter((item) => item.wasteReported && isProcessComplete(item.input)).length;

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    const saved = JSON.parse(raw) as Array<Partial<SavedAnalysis>>;
    setHistory(
      saved.map((item) => {
        const normalized = normalizeInput(item.input ?? {});
        return {
          id: item.id ?? crypto.randomUUID(),
          input: normalized,
          result: analyzeProcess(normalized),
          createdAt: item.createdAt ?? new Date().toISOString(),
          wasteReported: item.wasteReported ?? false,
          wasteReasons: Array.isArray(item.wasteReasons) ? item.wasteReasons.filter(isWasteReasonKey) : [],
        };
      }),
    );
  }, []);

  useEffect(() => {
    if (history.length > 0 && !history.some((item) => item.id === wasteLotId)) {
      setWasteLotId(history[0].id);
    }
    if (history.length === 0) setWasteLotId("");
  }, [history, wasteLotId]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history]);

  function update<K extends keyof ProcessInput>(key: K, value: ProcessInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function toggleEquipment(key: EquipmentKey) {
    setInput((current) => ({
      ...current,
      equiposDanados: current.equiposDanados.includes(key)
        ? current.equiposDanados.filter((item) => item !== key)
        : [...current.equiposDanados, key],
    }));
  }

  function toggleLot(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 30) return current;
      return [...current, id];
    });
  }

  function clearGroup() {
    setSelectedIds([]);
  }

  function deleteSelectedLots() {
    if (selectedIds.length === 0) return;
    const shouldDelete = window.confirm(
      `Se eliminarán ${selectedIds.length} lote(s) del registro. Esta acción también los quita del análisis grupal.`,
    );
    if (!shouldDelete) return;

    setHistory((current) => current.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  }

  function saveAnalysis() {
    const item: SavedAnalysis = {
      id: crypto.randomUUID(),
      input,
      result,
      createdAt: new Date().toISOString(),
      wasteReported: false,
      wasteReasons: [],
    };
    setHistory((current) => [item, ...current].slice(0, 100));
    setWasteLotId(item.id);
  }

  function loadAnalysis(item: SavedAnalysis) {
    setInput(item.input);
  }

  function updateWaste(reported: boolean) {
    if (!wasteLot) return;
    if (reported && !wasteLotIsComplete) {
      window.alert("No se puede registrar merma: el lote tiene datos de proceso incompletos.");
      return;
    }
    setHistory((current) =>
      current.map((item) =>
        item.id === wasteLot.id
          ? {
              ...item,
              wasteReported: reported,
              wasteReasons: reported ? item.wasteReasons : [],
            }
          : item,
      ),
    );
  }

  function toggleWasteReason(reason: WasteReasonKey) {
    if (!wasteLot) return;
    if (!wasteLotIsComplete) {
      window.alert("No se puede registrar merma: complete primero todos los datos del lote.");
      return;
    }
    setHistory((current) =>
      current.map((item) => {
        if (item.id !== wasteLot.id) return item;
        const selected = item.wasteReasons.includes(reason)
          ? item.wasteReasons.filter((itemReason) => itemReason !== reason)
          : [...item.wasteReasons, reason];
        return { ...item, wasteReported: selected.length > 0 || item.wasteReported, wasteReasons: selected };
      }),
    );
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Control de producción</p>
          <h1>Analizador de cuellos de botella</h1>
        </div>
        <div className="action-row">
          <button className="secondary-action" type="button" disabled={history.length === 0} onClick={() => exportExcel(history)}>
            Exportar Excel
          </button>
          <button className="primary-action" type="button" onClick={saveAnalysis}>
            Guardar análisis
          </button>
        </div>
      </section>

      <section className="workspace">
        <form className="panel form-panel">
          <div className="section-title">
            <h2>Datos del lote</h2>
            <p>Los valores numéricos se ingresan manualmente para cada análisis.</p>
          </div>

          <div className="form-grid">
            <Field label="Fecha">
              <input type="date" value={input.fecha} onChange={(event) => update("fecha", event.target.value)} />
            </Field>
            <Field label="Lote">
              <input value={input.lote} onChange={(event) => update("lote", event.target.value)} />
            </Field>
            <Field label="Tipo de pan">
              <select value={input.producto} onChange={(event) => update("producto", event.target.value as ProductKey)}>
                {Object.entries(products).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Receta">
              <select value={input.receta} onChange={(event) => update("receta", event.target.value as RecipeKey)}>
                {Object.entries(recipes).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amasadora">
              <select value={input.amasadora} onChange={(event) => update("amasadora", event.target.value as ProcessInput["amasadora"])}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </Field>
            <Field label="Inicio de amasado">
              <input type="time" value={input.horaInicioAmasado} onChange={(event) => update("horaInicioAmasado", event.target.value)} />
            </Field>
            <Field label="Horno">
              <select value={input.horno} onChange={(event) => update("horno", event.target.value as ProcessInput["horno"])}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </Field>
            <Field label="Agregado">
              <select value={input.agregado} onChange={(event) => update("agregado", event.target.value as ProcessInput["agregado"])}>
                <option value="agua">Agua</option>
                <option value="hielo">Hielo</option>
              </select>
            </Field>
            <Field label="Temperatura del área (°C)">
              <NumberInput value={input.temperaturaArea} onChange={(value) => update("temperaturaArea", value)} />
            </Field>
            <Field label="Humedad relativa (%)">
              <NumberInput value={input.humedadRelativa} onChange={(value) => update("humedadRelativa", value)} />
            </Field>
            <Field label="Peso pre-mezcla (g)">
              <NumberInput max={null} value={input.pesoPremezcla} onChange={(value) => update("pesoPremezcla", value)} />
            </Field>
            <Field label="Operarios boleando">
              <NumberInput integer value={input.operariosBoleado} onChange={(value) => update("operariosBoleado", value)} />
            </Field>
            <Field label="Temperatura de masa (°C)">
              <NumberInput value={input.temperaturaMasa} onChange={(value) => update("temperaturaMasa", value)} />
            </Field>
            <Field label="Temperatura horno (°C)">
              <NumberInput value={input.temperaturaHorno} onChange={(value) => update("temperaturaHorno", value)} />
            </Field>
          </div>

          <div className="section-title compact">
            <h2>¿Hay algún equipo dañado?</h2>
            <p>Seleccione los equipos que no están funcionando.</p>
          </div>
          <div className="equipment-grid">
            {Object.entries(equipmentOptions).map(([key, label]) => (
              <label className="check-option" key={key}>
                <input
                  type="checkbox"
                  checked={input.equiposDanados.includes(key as EquipmentKey)}
                  onChange={() => toggleEquipment(key as EquipmentKey)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="section-title compact">
            <h2>Tiempos del proceso</h2>
          </div>
          <div className="form-grid times">
            {numberFields.slice(0, 2).map(([key, label]) => (
              <Field key={key} label={`${label} (min)`}>
                <NumberInput value={input[key]} onChange={(value) => update(key, value)} />
              </Field>
            ))}
            <Field label="Sobadora (min)">
              <OptionalTimeInput value={input.tiempoSobadora} onChange={(value) => update("tiempoSobadora", value)} />
            </Field>
            <Field label="Porcionado (min)">
              <NumberInput value={input.tiempoPorcionado} onChange={(value) => update("tiempoPorcionado", value)} />
            </Field>
            <Field label="Laminadora (min)">
              <OptionalTimeInput value={input.tiempoLaminadora} onChange={(value) => update("tiempoLaminadora", value)} />
            </Field>
            {numberFields.slice(3).map(([key, label]) => (
              <Field key={key} label={`${label} (min)`}>
                <NumberInput value={input[key]} onChange={(value) => update(key, value)} />
              </Field>
            ))}
          </div>
        </form>

        <aside className="results-column">
          <section className="panel result-hero">
            <p className="eyebrow">Cuello de botella principal</p>
            <h2>{result.bottleneck.name}</h2>
            <div className="metric-row">
              <span>
                {result.bottleneck.value ?? "Pendiente"} {result.bottleneck.unit}
              </span>
              <strong>{scoreStage(result.bottleneck)}%</strong>
            </div>
            <div className="total-time">
              <span>Tiempo total del lote</span>
              <strong>{result.totalTime === null ? "Pendiente" : `${result.totalTime} min`}</strong>
            </div>
            <p>{result.bottleneck.note}</p>
          </section>

          <section className="panel">
            <div className="section-title compact">
              <h2>Alertas</h2>
            </div>
            {result.alerts.length > 0 ? (
              <ul className="message-list alert-list">
                {result.alerts.map((alert) => (
                  <li key={alert}>{alert}</li>
                ))}
              </ul>
            ) : (
              <p className="empty">No hay alertas con los valores actuales.</p>
            )}
          </section>

          <section className="panel">
            <div className="section-title compact">
              <h2>Sugerencias</h2>
            </div>
            <ul className="message-list">
              {result.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>

      <section className="lower-grid">
        <div className="panel">
          <div className="section-title compact">
            <h2>Análisis de etapas</h2>
          </div>
          <div className="stage-list">
            {result.stages.map((item) => (
              <article className="stage-row" key={item.id}>
                <div>
                  <div className="stage-name">
                    <StatusDot status={item.status} />
                    <strong>{item.name}</strong>
                  </div>
                  <span>
                    {stageValueLabel(item.value)} {item.value === "no_aplica" ? "" : item.unit}
                    {stageRangeLabel(item)}
                  </span>
                </div>
                <div className="bar" aria-label={`Presión ${scoreStage(item)}%`}>
                  <span style={{ width: `${Math.min(scoreStage(item), 100)}%` }} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel monte-panel">
          <div className="section-title compact">
            <h2>Monte Carlo individual</h2>
          </div>
          <div className="mc-grid">
            <div>
              <span>P50 ciclo</span>
              <strong>{result.monteCarlo.p50} min</strong>
            </div>
            <div>
              <span>P90 ciclo</span>
              <strong>{result.monteCarlo.p90} min</strong>
            </div>
            <div>
              <span>Riesgo de atraso</span>
              <strong>{result.monteCarlo.delayProbability}%</strong>
            </div>
          </div>
          <div className="frequency-list">
            {result.monteCarlo.bottleneckFrequency.map((item) => (
              <div key={item.stage}>
                <span>{item.stage}</span>
                <strong>{item.probability}%</strong>
              </div>
            ))}
          </div>
          <div className="variable-list">
            {result.monteCarlo.variables.map((item) => (
              <p key={item.name}>
                <strong>{item.name}:</strong> {item.variation}
              </p>
            ))}
          </div>
        </div>

        <div className="panel history-panel">
          <div className="section-title compact">
            <h2>Registro y selección</h2>
            <p>{selectedIds.length}/30 lotes</p>
          </div>
          <div className="history-actions">
            <button className="secondary-action" type="button" disabled={selectedIds.length === 0} onClick={clearGroup}>
              Limpiar grupo
            </button>
            <button className="danger-action" type="button" disabled={selectedIds.length === 0} onClick={deleteSelectedLots}>
              Eliminar seleccionados
            </button>
          </div>
          {history.length === 0 ? (
            <p className="empty">Guarde un análisis para crear el registro y exportarlo.</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div className="history-item" key={item.id}>
                  <label className="lot-check">
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleLot(item.id)} />
                    <span>Grupo</span>
                  </label>
                  <button type="button" onClick={() => loadAnalysis(item)}>
                    <span>
                      {item.input.lote} · {products[item.input.producto]}
                    </span>
                    <strong>{item.result.bottleneck.name}</strong>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel group-panel">
        <div className="section-title">
          <h2>Análisis grupal de lotes</h2>
          <p>Cada lote corresponde a un carrito; al salir, libera su posición para el siguiente lote.</p>
        </div>
        {!groupResult ? (
          <p className="empty">El análisis grupal aparecerá cuando seleccione al menos un lote guardado.</p>
        ) : (
          <div className="group-grid">
            <div>
              <p className="eyebrow">Conjunto evaluado</p>
              <strong className="group-count">{groupResult.lotCount} lotes</strong>
              <div className="capacity-stats">
                <div>
                  <span>Ocupación máxima</span>
                  <strong>{groupResult.maxConcurrentCarts}/18</strong>
                </div>
                <div>
                  <span>Lotes fuera de zona ideal</span>
                  <strong>{groupResult.lotsOutsideIdealZone}</strong>
                </div>
              </div>
              <div className="frequency-list">
                {groupResult.topBottlenecks.map((item) => (
                  <div key={item.stage}>
                    <span>{item.stage}</span>
                    <strong>{item.lots}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow">Monte Carlo grupal</p>
              <div className="mc-grid">
                <div>
                  <span>P50 conjunto</span>
                  <strong>{groupResult.monteCarlo.p50} min</strong>
                </div>
                <div>
                  <span>P90 conjunto</span>
                  <strong>{groupResult.monteCarlo.p90} min</strong>
                </div>
                <div>
                  <span>Riesgo</span>
                  <strong>{groupResult.monteCarlo.delayProbability}%</strong>
                </div>
              </div>
              <div className="frequency-list">
                {groupResult.monteCarlo.bottleneckFrequency.map((item) => (
                  <div key={item.stage}>
                    <span>{item.stage}</span>
                    <strong>{item.probability}%</strong>
                  </div>
                ))}
              </div>
              <div className="variable-list">
                {groupResult.monteCarlo.variables.map((item) => (
                  <p key={item.name}>
                    <strong>{item.name}:</strong> {item.variation}
                  </p>
                ))}
              </div>
            </div>
            <div className="group-lots">
              <p className="eyebrow">Tiempo completo por lote</p>
              {groupResult.lotTotals.map((item) => (
                <div key={item.lote}>
                  <span>{item.lote} · 1 carrito</span>
                  <strong>{item.totalTime === null ? "Pendiente" : `${item.totalTime} min`}</strong>
                </div>
              ))}
            </div>
            {groupResult.alerts.length > 0 ? (
              <div className="group-alerts">
                <p className="eyebrow">Alertas del conjunto</p>
                <ul className="message-list alert-list">
                  {groupResult.alerts.slice(0, 8).map((alert) => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="panel waste-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Control de calidad</p>
            <h2>Registro de merma</h2>
          </div>
          <p>Clasifique los lotes problemáticos y sus motivos.</p>
        </div>
        {history.length === 0 ? (
          <p className="empty">Guarde al menos un lote para registrar merma.</p>
        ) : (
          <>
            <div className="waste-form">
              <Field label="Lote a clasificar">
                <select value={wasteLotId} onChange={(event) => setWasteLotId(event.target.value)}>
                  {history.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.input.lote} · {products[item.input.producto]}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="check-option waste-toggle">
                <input
                  type="checkbox"
                  disabled={!wasteLotIsComplete}
                  checked={wasteLot?.wasteReported ?? false}
                  onChange={(event) => updateWaste(event.target.checked)}
                />
                <span>Este lote tuvo merma</span>
              </label>
              {!wasteLotIsComplete ? (
                <p className="waste-warning">Este lote tiene datos incompletos. Complete el proceso antes de registrar merma.</p>
              ) : null}
              <div className="waste-reasons">
                {Object.entries(wasteReasons).map(([key, reason]) => (
                  <label className="check-option" key={key}>
                    <input
                      type="checkbox"
                      disabled={!wasteLotIsComplete || !wasteLot?.wasteReported}
                      checked={wasteLot?.wasteReasons.includes(key as WasteReasonKey) ?? false}
                      onChange={() => toggleWasteReason(key as WasteReasonKey)}
                    />
                    <span className="defect-copy">
                      <strong>{reason.label}</strong>
                      <small>{reason.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="waste-charts">
              <PieChart
                title="Merma individual"
                subtitle={wasteLot ? wasteLot.input.lote : "Sin lote"}
                data={individualWasteData}
              />
              <PieChart
                title="Merma del conjunto"
                subtitle={`${groupWasteCount}/${selectedAnalyses.length} lotes seleccionados con merma`}
                data={groupWasteData}
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
