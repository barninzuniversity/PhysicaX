"use client";

import { useMemo, useState } from "react";
import { create, all } from "mathjs";
import { PlotCanvas } from "./PlotCanvas";
import { useLocale } from "./LocaleProvider";

const math = create(all);

export function AsymptoticRegimeSim() {
  const [expr, setExpr] = useState("x^3 + 2*x");
  const [xmin, setXmin] = useState("0.1");
  const [xmax, setXmax] = useState("10");
  const [samples, setSamples] = useState("120");
  const { t } = useLocale();

  const { slope, logf, warning, dominant } = useMemo(() => {
    const x0 = Number(xmin);
    const x1 = Number(xmax);
    const n = Math.max(40, Math.min(300, Math.floor(Number(samples))));
    if (!Number.isFinite(x0) || !Number.isFinite(x1) || x0 <= 0 || x1 <= x0) {
      return { slope: [], logf: [], warning: t("regimePositiveRange") };
    }
    let compiled;
    try {
      compiled = math.compile(expr);
    } catch {
      return { slope: [], logf: [], warning: t("regimeInvalidExpr") };
    }

    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < n; i += 1) {
      const x = x0 * Math.pow(x1 / x0, i / (n - 1));
      let y = compiled.evaluate({ x });
      y = Number(y);
      if (!Number.isFinite(y)) continue;
      xs.push(x);
      ys.push(Math.abs(y));
    }
    const logX = xs.map((x) => Math.log10(x));
    const logY = ys.map((y) => Math.log10(Math.max(y, 1e-12)));

    const slopePts: { x: number; y: number }[] = [];
    for (let i = 1; i < logX.length - 1; i += 1) {
      const num = logY[i + 1] - logY[i - 1];
      const den = logX[i + 1] - logX[i - 1];
      slopePts.push({ x: logX[i], y: den !== 0 ? num / den : 0 });
    }
    const logPts = logX.map((x, i) => ({ x, y: logY[i] }));
    const tail = slopePts.slice(Math.max(0, slopePts.length - Math.max(4, Math.floor(slopePts.length * 0.2))));
    const avgSlope =
      tail.reduce((sum, p) => sum + p.y, 0) / (tail.length || 1);
    let label = `${t("regimePowerLabel")} ${avgSlope.toFixed(2)}`;
    if (Math.abs(avgSlope) < 0.2) label = t("regimeConstant");
    else if (Math.abs(avgSlope - 1) < 0.25) label = t("regimeLinear");
    else if (Math.abs(avgSlope - 2) < 0.35) label = t("regimeQuadratic");
    else if (Math.abs(avgSlope - 3) < 0.45) label = t("regimeCubic");

    return { slope: slopePts, logf: logPts, warning: "", dominant: label };
  }, [expr, xmin, xmax, samples]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("regimeTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("regimeExprLabel")}</span>
          <input type="text" value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("regimeXmin")}</span>
          <input type="number" value={xmin} onChange={(event) => setXmin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("regimeXmax")}</span>
          <input type="number" value={xmax} onChange={(event) => setXmax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("regimeSamples")}</span>
          <input type="number" value={samples} onChange={(event) => setSamples(event.target.value)} step="1" />
        </label>
      </div>
      {warning ? <div className="pill pill-bad">{warning}</div> : null}
      {!warning ? (
        <div className="pill">{t("regimeDominant")} {dominant}</div>
      ) : null}
      <div className="demo-stack">
        <PlotCanvas
          series={[{ id: "logf", points: logf, color: "#2563eb", label: t("regimeLogLabel") }]}
          xLabel="log10(x)"
          yLabel="log10|f|"
          showLegend
        />
        <PlotCanvas
          series={[{ id: "slope", points: slope, color: "#16a34a", label: t("regimeSlopeLabel") }]}
          xLabel="log10(x)"
          yLabel="d log f / d log x"
          showLegend
        />
      </div>
    </div>
  );
}
