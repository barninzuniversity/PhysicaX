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

type Model = "linear" | "quadratic" | "exponential" | "power";

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

const linearRegression = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
};

export function CurveFittingSim() {
  const { t } = useLocale();
  const [model, setModel] = useState<Model>("linear");
  const [rawPoints, setRawPoints] = useState("0,0.4\n1,1.2\n2,2.5\n3,3.1\n4,4.6");
  const [expr, setExpr] = useState("0.4*x^2 + 0.6*x + 0.4");
  const [xMin, setXMin] = useState("0");
  const [xMax, setXMax] = useState("4");
  const [count, setCount] = useState("10");
  const [noise, setNoise] = useState("0.15");

  const analysis = useMemo(() => {
    let points = parsePoints(rawPoints);
    let warning = "";
    if (points.length < 2) {
      warning = t("fitNeedPoints");
    }

    if (!warning && points.length === 0) {
      warning = t("fitNeedPoints");
    }

    if (!warning && points.length === 0) {
      return { warning, points: [], curve: [], label: "", r2: NaN };
    }

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
    const sst = ys.reduce((acc, y) => acc + (y - meanY) ** 2, 0);

    const fit = (x: number) => {
      if (model === "linear") {
        const { slope, intercept } = linearRegression(xs, ys);
        return slope * x + intercept;
      }
      if (model === "quadratic") {
        const A = xs.map((x) => [1, x, x * x]);
        const b = ys;
        const coeffsRaw = math.lusolve(A as any, b as any) as any;
        const coeffs = Array.isArray(coeffsRaw) ? coeffsRaw : coeffsRaw.valueOf();
        const a0 = coeffs?.[0]?.[0] ?? 0;
        const a1 = coeffs?.[1]?.[0] ?? 0;
        const a2 = coeffs?.[2]?.[0] ?? 0;
        return a0 + a1 * x + a2 * x * x;
      }
      if (model === "exponential") {
        if (ys.some((y) => y <= 0)) {
          return NaN;
        }
        const lnY = ys.map((y) => Math.log(y));
        const { slope, intercept } = linearRegression(xs, lnY);
        return Math.exp(intercept) * Math.exp(slope * x);
      }
      if (model === "power") {
        if (xs.some((x) => x <= 0) || ys.some((y) => y <= 0)) {
          return NaN;
        }
        const lnX = xs.map((x) => Math.log(x));
        const lnY = ys.map((y) => Math.log(y));
        const { slope, intercept } = linearRegression(lnX, lnY);
        return Math.exp(intercept) * Math.pow(x, slope);
      }
      return NaN;
    };

    const curve: { x: number; y: number }[] = [];
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    for (let i = 0; i <= 200; i += 1) {
      const x = min + ((max - min) * i) / 200;
      curve.push({ x, y: fit(x) });
    }

    let sse = 0;
    points.forEach((p) => {
      const yFit = fit(p.x);
      sse += (p.y - yFit) ** 2;
    });
    const r2 = sst === 0 ? NaN : 1 - sse / sst;

    return { warning, points, curve, label: t(`fitModel_${model}`), r2 };
  }, [rawPoints, model, t]);

  const generateSample = () => {
    let compiled;
    try {
      compiled = math.compile(expr);
    } catch {
      return;
    }
    const min = Number(xMin);
    const max = Number(xMax);
    const n = Math.max(4, Math.min(18, Math.floor(Number(count) || 10)));
    const noiseVal = Math.max(0, Number(noise) || 0);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return;
    const rows: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const x = min + (i / (n - 1)) * (max - min);
      const base = Number(compiled.evaluate({ x }));
      const jitter = noiseVal ? (Math.random() * 2 - 1) * noiseVal : 0;
      rows.push(`${x.toFixed(3)}, ${(base + jitter).toFixed(3)}`);
    }
    setRawPoints(rows.join("\n"));
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("fitTitle")}</div>
      <div className="demo-grid demo-grid-wide">
        <label className="field">
          <span>{t("fitModel")}</span>
          <select value={model} onChange={(event) => setModel(event.target.value as Model)}>
            <option value="linear">{t("fitModel_linear")}</option>
            <option value="quadratic">{t("fitModel_quadratic")}</option>
            <option value="exponential">{t("fitModel_exponential")}</option>
            <option value="power">{t("fitModel_power")}</option>
          </select>
        </label>
        <label className="field span-2">
          <span>{t("fitPoints")}</span>
          <textarea rows={6} value={rawPoints} onChange={(event) => setRawPoints(event.target.value)} />
        </label>
      </div>
      <div className="demo-grid demo-grid-wide">
        <label className="field span-2">
          <span>{t("fitGeneratorExpr")}</span>
          <input value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("fitGeneratorXmin")}</span>
          <input type="number" value={xMin} onChange={(event) => setXMin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("fitGeneratorXmax")}</span>
          <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("fitGeneratorCount")}</span>
          <input type="number" value={count} onChange={(event) => setCount(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>{t("fitGeneratorNoise")}</span>
          <input type="number" value={noise} onChange={(event) => setNoise(event.target.value)} step="any" />
        </label>
        <button type="button" className="control-chip" onClick={generateSample}>
          {t("fitGenerate")}
        </button>
      </div>
      {analysis.warning ? <div className="pill pill-bad">{analysis.warning}</div> : null}
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">{analysis.label}</span>
          <span className="pill">R² {Number.isFinite(analysis.r2) ? analysis.r2.toFixed(4) : "--"}</span>
        </div>
      </div>
      <PlotCanvas
        series={[
          { id: "curve", points: analysis.curve, color: "#2563eb", label: t("fitCurve") },
          { id: "samples", points: analysis.points, color: "#f97316", label: t("fitSamples"), mode: "scatter" }
        ]}
        xLabel="x"
        yLabel="y"
        showLegend
      />
    </div>
  );
}
