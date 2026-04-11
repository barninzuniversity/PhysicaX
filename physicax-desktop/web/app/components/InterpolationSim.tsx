"use client";

import { useMemo, useState } from "react";
import { create, all } from "mathjs";
import { PlotCanvas } from "./PlotCanvas";
import { useLocale } from "./LocaleProvider";

const math = create(all);
math.import(
  {
    ln: (value: number) => math.log(value)
  },
  { override: true }
);

type Mode = "function" | "manual";

const parsePoints = (raw: string) => {
  const rows = raw.split("\n").map((line) => line.trim()).filter(Boolean);
  const points: { x: number; y: number }[] = [];
  rows.forEach((row) => {
    const cleaned = row.replace(/[()]/g, "");
    const parts = cleaned.split(/[,\\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      const x = Number(parts[0]);
      const y = Number(parts[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
      }
    }
  });
  return points;
};

const lagrange = (points: { x: number; y: number }[], x: number) => {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    let term = points[i].y;
    for (let j = 0; j < points.length; j += 1) {
      if (i === j) continue;
      term *= (x - points[j].x) / (points[i].x - points[j].x);
    }
    sum += term;
  }
  return sum;
};

export function InterpolationSim() {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("function");
  const [expr, setExpr] = useState("sin(x) + 0.2*x");
  const [xMin, setXMin] = useState("-3");
  const [xMax, setXMax] = useState("3");
  const [count, setCount] = useState("7");
  const [noise, setNoise] = useState("0.0");
  const [manualPoints, setManualPoints] = useState("-2, -0.5\n-1, -0.6\n0, 0.2\n1, 1.1\n2, 0.3");

  const analysis = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    let curve: { x: number; y: number }[] = [];
    let target: { x: number; y: number }[] = [];
    let warning = "";
    if (mode === "manual") {
      points.push(...parsePoints(manualPoints));
      if (points.length < 2) {
        warning = t("interpNeedPoints");
      }
    } else {
      let compiled;
      try {
        compiled = math.compile(expr);
      } catch {
        return { warning: t("interpInvalidExpr"), points: [], curve: [], target: [] };
      }
      const min = Number(xMin);
      const max = Number(xMax);
      const n = Math.max(3, Math.min(14, Math.floor(Number(count) || 7)));
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
        return { warning: t("interpInvalidBounds"), points: [], curve: [], target: [] };
      }
      const noiseVal = Math.max(0, Number(noise) || 0);
      for (let i = 0; i < n; i += 1) {
        const x = min + (i / (n - 1)) * (max - min);
        const base = Number(compiled.evaluate({ x }));
        const jitter = noiseVal ? (Math.random() * 2 - 1) * noiseVal : 0;
        points.push({ x, y: base + jitter });
      }
      const samples = 240;
      target = [];
      for (let i = 0; i <= samples; i += 1) {
        const x = min + ((max - min) * i) / samples;
        target.push({ x, y: Number(compiled.evaluate({ x })) });
      }
    }

    if (points.length >= 2) {
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const samples = 240;
      curve = [];
      for (let i = 0; i <= samples; i += 1) {
        const x = minX + ((maxX - minX) * i) / samples;
        curve.push({ x, y: lagrange(points, x) });
      }
    }

    return { warning, points, curve, target };
  }, [mode, expr, xMin, xMax, count, noise, manualPoints, t]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("interpTitle")}</div>
      <div className="demo-grid demo-grid-wide">
        <label className="field">
          <span>{t("interpMode")}</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
            <option value="function">{t("interpModeFunction")}</option>
            <option value="manual">{t("interpModeManual")}</option>
          </select>
        </label>
        {mode === "function" ? (
          <>
            <label className="field span-2">
              <span>{t("interpExpr")}</span>
              <input value={expr} onChange={(event) => setExpr(event.target.value)} />
            </label>
            <label className="field">
              <span>{t("interpXmin")}</span>
              <input type="number" value={xMin} onChange={(event) => setXMin(event.target.value)} step="any" />
            </label>
            <label className="field">
              <span>{t("interpXmax")}</span>
              <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
            </label>
            <label className="field">
              <span>{t("interpCount")}</span>
              <input type="number" value={count} onChange={(event) => setCount(event.target.value)} step="1" />
            </label>
            <label className="field">
              <span>{t("interpNoise")}</span>
              <input type="number" value={noise} onChange={(event) => setNoise(event.target.value)} step="any" />
            </label>
          </>
        ) : (
          <label className="field span-2">
            <span>{t("interpManualPoints")}</span>
            <textarea rows={6} value={manualPoints} onChange={(event) => setManualPoints(event.target.value)} />
          </label>
        )}
      </div>
      {analysis.warning ? <div className="pill pill-bad">{analysis.warning}</div> : null}
      <PlotCanvas
        series={[
          analysis.target.length
            ? { id: "target", points: analysis.target, color: "#94a3b8", label: t("interpTarget"), dash: [6, 4] }
            : null,
          analysis.curve.length
            ? { id: "interp", points: analysis.curve, color: "#2563eb", label: t("interpCurve") }
            : null,
          analysis.points.length
            ? {
                id: "samples",
                points: analysis.points,
                color: "#f97316",
                label: t("interpSamples"),
                mode: "scatter"
              }
            : null
        ].filter(Boolean) as any}
        xLabel="x"
        yLabel="y"
        showLegend
      />
      <div className="mini-table">
        <div className="mini-row header">
          <span>#</span>
          <span>x</span>
          <span>y</span>
        </div>
        {analysis.points.slice(0, 10).map((pt, idx) => (
          <div key={`pt-${idx}`} className="mini-row">
            <span>{idx + 1}</span>
            <span>{pt.x.toFixed(3)}</span>
            <span>{pt.y.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
