"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
import { useLocale } from "./LocaleProvider";

const math = create(all);

type SensRow = { name: string; df: number; norm: number };

type Heatmap = {
  values: number[][];
  min: number;
  max: number;
  aVals: number[];
  bVals: number[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function SensitivitySim() {
  const { t } = useLocale();
  const [expr, setExpr] = useState("a*x^2 + b*x + c");
  const [params, setParams] = useState('{"a":1,"b":2,"c":1}');
  const [x0, setX0] = useState("1");
  const [eps, setEps] = useState("0.001");
  const [paramA, setParamA] = useState("a");
  const [paramB, setParamB] = useState("b");
  const [minA, setMinA] = useState("");
  const [maxA, setMaxA] = useState("");
  const [minB, setMinB] = useState("");
  const [maxB, setMaxB] = useState("");
  const [steps, setSteps] = useState("22");
  const heatRef = useRef<HTMLCanvasElement | null>(null);

  const analysis = useMemo(() => {
    const xVal = Number(x0);
    const epsVal = Number(eps);
    let parsed: Record<string, number>;
    try {
      parsed = JSON.parse(params);
    } catch {
      return { error: t("sensitivityInvalidParams"), rows: [] as SensRow[], base: NaN, heatmap: null as Heatmap | null };
    }
    let compiled;
    try {
      compiled = math.compile(expr);
    } catch {
      return { error: t("sensitivityInvalidExpr"), rows: [] as SensRow[], base: NaN, heatmap: null as Heatmap | null };
    }

    const base = Number(compiled.evaluate({ x: xVal, ...parsed }));
    if (!Number.isFinite(base)) {
      return { error: t("sensitivityNonFiniteBase"), rows: [] as SensRow[], base: NaN, heatmap: null };
    }

    const rows: SensRow[] = [];
    Object.keys(parsed).forEach((key) => {
      const p = Number(parsed[key]);
      const h = Math.abs(p) > 0 ? epsVal * Math.abs(p) : epsVal;
      const pPlus = { ...parsed, [key]: p + h };
      const pMinus = { ...parsed, [key]: p - h };
      const fPlus = Number(compiled.evaluate({ x: xVal, ...pPlus }));
      const fMinus = Number(compiled.evaluate({ x: xVal, ...pMinus }));
      const df = Number.isFinite(fPlus) && Number.isFinite(fMinus) ? (fPlus - fMinus) / (2 * h) : NaN;
      const norm = Number.isFinite(df) ? (df * p) / base : NaN;
      rows.push({ name: key, df, norm });
    });

    const sorted = [...rows].sort((a, b) => Math.abs(b.norm) - Math.abs(a.norm));

    let heatmap: Heatmap | null = null;
    if (paramA && paramB && paramA !== paramB && parsed[paramA] !== undefined && parsed[paramB] !== undefined) {
      const a0 = parsed[paramA];
      const b0 = parsed[paramB];
      const s = clamp(Math.round(Number(steps) || 22), 8, 40);
      const spanA = Math.abs(a0) > 0 ? Math.abs(a0) * 0.6 : 1;
      const spanB = Math.abs(b0) > 0 ? Math.abs(b0) * 0.6 : 1;
      const aMinVal = Number.isFinite(Number(minA)) ? Number(minA) : a0 - spanA;
      const aMaxVal = Number.isFinite(Number(maxA)) ? Number(maxA) : a0 + spanA;
      const bMinVal = Number.isFinite(Number(minB)) ? Number(minB) : b0 - spanB;
      const bMaxVal = Number.isFinite(Number(maxB)) ? Number(maxB) : b0 + spanB;
      const aVals: number[] = [];
      const bVals: number[] = [];
      for (let i = 0; i < s; i += 1) {
        aVals.push(aMinVal + (aMaxVal - aMinVal) * (i / (s - 1)));
        bVals.push(bMinVal + (bMaxVal - bMinVal) * (i / (s - 1)));
      }
      const values: number[][] = [];
      let minVal = Infinity;
      let maxVal = -Infinity;
      bVals.forEach((bVal) => {
        const row: number[] = [];
        aVals.forEach((aVal) => {
          const val = Number(
            compiled.evaluate({ x: xVal, ...parsed, [paramA]: aVal, [paramB]: bVal })
          );
          row.push(val);
          if (Number.isFinite(val)) {
            minVal = Math.min(minVal, val);
            maxVal = Math.max(maxVal, val);
          }
        });
        values.push(row);
      });
      if (minVal !== Infinity && maxVal !== -Infinity) {
        heatmap = { values, min: minVal, max: maxVal, aVals, bVals };
      }
    }

    return { error: "", rows: sorted, base, heatmap };
  }, [expr, params, x0, eps, paramA, paramB, minA, maxA, minB, maxB, steps, t]);

  useEffect(() => {
    const canvas = heatRef.current;
    if (!canvas || !analysis.heatmap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 360;
    const height = 220;
    canvas.width = width;
    canvas.height = height;
    const { values, min, max } = analysis.heatmap;
    const rows = values.length;
    const cols = values[0]?.length ?? 0;
    if (!rows || !cols) return;
    const cellW = width / cols;
    const cellH = height / rows;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const v = values[y][x];
        const t = Number.isFinite(v) ? (v - min) / (max - min + 1e-6) : 0;
        const r = Math.round(255 * t);
        const g = Math.round(180 * (1 - t));
        const b = Math.round(220 * (1 - t));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }, [analysis.heatmap]);

  const paramKeys = useMemo(() => {
    try {
      return Object.keys(JSON.parse(params));
    } catch {
      return [] as string[];
    }
  }, [params]);

  const mostInfluential = analysis.rows[0];

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("sensitivityTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("sensitivityExprLabel")}</span>
          <input type="text" value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("sensitivityX0")}</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("sensitivityEpsilon")}</span>
          <input type="number" value={eps} onChange={(event) => setEps(event.target.value)} step="any" />
        </label>
      </div>
      <label className="field" style={{ marginTop: "12px" }}>
        <span>{t("sensitivityParams")}</span>
        <textarea rows={4} value={params} onChange={(event) => setParams(event.target.value)} />
      </label>
      {analysis.error ? <div className="pill pill-bad">{analysis.error}</div> : null}

      <div className="workspace">
        <div className="workspace-pane">
          <div className="demo-title" style={{ fontSize: "1rem" }}>{t("sensitivityTornadoTitle")}</div>
          <div className="demo-note">
            {t("sensitivityMostInfluential")} {mostInfluential ? mostInfluential.name : "--"}
          </div>
          <div className="tornado-list">
            {analysis.rows.map((row) => {
              const strength = Number.isFinite(row.norm) ? Math.min(1, Math.abs(row.norm)) : 0;
              return (
                <div key={row.name} className="tornado-row">
                  <span className="tornado-label">{row.name}</span>
                  <div className="tornado-bar">
                    <span style={{ width: `${strength * 100}%` }} />
                  </div>
                  <span className="tornado-value">
                    {Number.isFinite(row.norm) ? row.norm.toFixed(3) : "--"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="workspace-pane">
          <div className="demo-title" style={{ fontSize: "1rem" }}>{t("sensitivityLocalDerivatives")}</div>
          <div className="metric-grid">
            {analysis.rows.map((row) => (
              <div key={row.name} className="metric-card">
                <div className="pill">{row.name}</div>
                <div className="demo-note">
                  {t("sensitivityDerivativeLabel")} {row.name} ~= {Number.isFinite(row.df) ? row.df.toFixed(4) : "--"}
                </div>
                <div className="demo-note">
                  {t("sensitivityNormalizedLabel")} {Number.isFinite(row.norm) ? row.norm.toFixed(4) : "--"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="demo-panel" style={{ marginTop: "18px" }}>
        <div className="demo-title">{t("sensitivityHeatmapTitle")}</div>
        <div className="demo-grid">
          <label className="field">
            <span>{t("sensitivityParamA")}</span>
            <select value={paramA} onChange={(event) => setParamA(event.target.value)}>
              {paramKeys.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("sensitivityParamB")}</span>
            <select value={paramB} onChange={(event) => setParamB(event.target.value)}>
              {paramKeys.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("sensitivityMinA")}</span>
            <input value={minA} onChange={(event) => setMinA(event.target.value)} type="number" step="any" />
          </label>
          <label className="field">
            <span>{t("sensitivityMaxA")}</span>
            <input value={maxA} onChange={(event) => setMaxA(event.target.value)} type="number" step="any" />
          </label>
          <label className="field">
            <span>{t("sensitivityMinB")}</span>
            <input value={minB} onChange={(event) => setMinB(event.target.value)} type="number" step="any" />
          </label>
          <label className="field">
            <span>{t("sensitivityMaxB")}</span>
            <input value={maxB} onChange={(event) => setMaxB(event.target.value)} type="number" step="any" />
          </label>
          <label className="field">
            <span>{t("sensitivityGridSteps")}</span>
            <input value={steps} onChange={(event) => setSteps(event.target.value)} type="number" step="1" />
          </label>
        </div>
        <div className="heatmap-wrap">
          <canvas ref={heatRef} className="heatmap-canvas" />
          {analysis.heatmap ? (
            <div className="demo-note">
              {t("sensitivityHeatmapRange")} {analysis.heatmap.min.toFixed(3)} {t("sensitivityHeatmapRangeTo")} {analysis.heatmap.max.toFixed(3)}
            </div>
          ) : (
            <div className="demo-note">{t("sensitivityHeatmapEmpty")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
