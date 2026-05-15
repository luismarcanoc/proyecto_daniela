"use client";

import { useEffect, useMemo, useState } from "react";
import {
  analyzeProcess,
  defaultInput,
  products,
  recipes,
  scoreStage,
  type AnalysisResult,
  type ProcessInput,
  type ProductKey,
  type RecipeKey,
} from "@/lib/process-analysis";

type SavedAnalysis = {
  id: string;
  input: ProcessInput;
  result: AnalysisResult;
  createdAt: string;
};

const storageKey = "proyecto-daniela-analisis";

function numberValue(value: string) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
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

function StatusDot({ status }: { status: "ok" | "warning" | "critical" }) {
  return <span className={`status-dot ${status}`} aria-hidden="true" />;
}

export function ProcessAnalyzer() {
  const [input, setInput] = useState<ProcessInput>(() => defaultInput());
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const result = useMemo(() => analyzeProcess(input), [input]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) setHistory(JSON.parse(raw) as SavedAnalysis[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history]);

  function update<K extends keyof ProcessInput>(key: K, value: ProcessInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function saveAnalysis() {
    const item: SavedAnalysis = {
      id: crypto.randomUUID(),
      input,
      result,
      createdAt: new Date().toISOString(),
    };
    setHistory((current) => [item, ...current].slice(0, 20));
  }

  function loadAnalysis(item: SavedAnalysis) {
    setInput(item.input);
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Control de producción</p>
          <h1>Analizador de cuellos de botella</h1>
        </div>
        <button className="primary-action" type="button" onClick={saveAnalysis}>
          Guardar análisis
        </button>
      </section>

      <section className="workspace">
        <form className="panel form-panel">
          <div className="section-title">
            <h2>Datos del lote</h2>
            <p>Parámetros tomados del documento de variables.</p>
          </div>

          <div className="form-grid">
            <Field label="Fecha">
              <input type="date" value={input.fecha} onChange={(event) => update("fecha", event.target.value)} />
            </Field>
            <Field label="Lote">
              <input value={input.lote} onChange={(event) => update("lote", event.target.value)} />
            </Field>
            <Field label="Tipo de pan">
              <select
                value={input.producto}
                onChange={(event) => update("producto", event.target.value as ProductKey)}
              >
                {Object.entries(products).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amasadora / horno">
              <select
                value={input.amasadora}
                onChange={(event) => update("amasadora", event.target.value as ProcessInput["amasadora"])}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </Field>
            <Field label="Temperatura del área (°C)">
              <input
                type="number"
                min="0"
                max="50"
                value={input.temperaturaArea}
                onChange={(event) => update("temperaturaArea", numberValue(event.target.value))}
              />
            </Field>
            <Field label="Humedad relativa (%)">
              <input
                type="number"
                value={input.humedadRelativa}
                onChange={(event) => update("humedadRelativa", numberValue(event.target.value))}
              />
            </Field>
            <Field label="Inicio de amasado">
              <input
                type="time"
                value={input.horaInicioAmasado}
                onChange={(event) => update("horaInicioAmasado", event.target.value)}
              />
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
            <Field label="Peso pre-mezcla (g)">
              <input
                type="number"
                value={input.pesoPremezcla}
                onChange={(event) => update("pesoPremezcla", numberValue(event.target.value))}
              />
            </Field>
            <Field label="Agregado">
              <select
                value={input.agregado}
                onChange={(event) => update("agregado", event.target.value as ProcessInput["agregado"])}
              >
                <option value="agua">Agua</option>
                <option value="hielo">Hielo</option>
              </select>
            </Field>
            <Field label="Operarios boleando">
              <input
                type="number"
                min="0"
                value={input.operariosBoleado}
                onChange={(event) => update("operariosBoleado", numberValue(event.target.value))}
              />
            </Field>
            <Field label="Temperatura de masa (°C)">
              <input
                type="number"
                value={input.temperaturaMasa}
                onChange={(event) => update("temperaturaMasa", numberValue(event.target.value))}
              />
            </Field>
          </div>

          <div className="section-title compact">
            <h2>Tiempos del proceso</h2>
          </div>

          <div className="form-grid times">
            {[
              ["tiempoMezclado", "Mezclado"],
              ["tiempoPicado", "Picado"],
              ["tiempoPorcionado", "Porcionado"],
              ["tiempoBoleado", "Boleado"],
              ["tiempoFermentacion", "Fermentación"],
              ["tiempoHorno", "Horno"],
              ["tiempoTraslado", "Traslado"],
            ].map(([key, label]) => (
              <Field key={key} label={`${label} (min)`}>
                <input
                  type="number"
                  value={input[key as keyof ProcessInput] as number}
                  onChange={(event) => update(key as keyof ProcessInput, numberValue(event.target.value) as never)}
                />
              </Field>
            ))}
            <Field label="Temperatura horno (°C)">
              <input
                type="number"
                value={input.temperaturaHorno}
                onChange={(event) => update("temperaturaHorno", numberValue(event.target.value))}
              />
            </Field>
          </div>
        </form>

        <aside className="results-column">
          <section className="panel result-hero">
            <p className="eyebrow">Cuello de botella principal</p>
            <h2>{result.bottleneck.name}</h2>
            <div className="metric-row">
              <span>{Math.round(result.bottleneck.value)} {result.bottleneck.unit}</span>
              <strong>{scoreStage(result.bottleneck)}%</strong>
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
              <p className="empty">No hay alertas críticas con los valores actuales.</p>
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
            <h2>Presión por etapa</h2>
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
                    {item.value} {item.unit}
                    {item.min !== undefined || item.max !== undefined
                      ? ` · rango ${item.min ?? "0"}-${item.max ?? "sin límite"} ${item.unit}`
                      : ""}
                  </span>
                </div>
                <div className="bar" aria-label={`Presión ${scoreStage(item)}%`}>
                  <span style={{ width: `${Math.min(scoreStage(item), 100)}%` }} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title compact">
            <h2>Monte Carlo</h2>
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
        </div>

        <div className="panel history-panel">
          <div className="section-title compact">
            <h2>Registro</h2>
          </div>
          {history.length === 0 ? (
            <p className="empty">Guarda un análisis para compararlo luego.</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <button type="button" key={item.id} onClick={() => loadAnalysis(item)}>
                  <span>
                    {item.input.lote} · {products[item.input.producto]}
                  </span>
                  <strong>{item.result.bottleneck.name}</strong>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
