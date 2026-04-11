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

export function OptimizationSim() {
  const { t } = useLocale();
  const [expr, setExpr] = useState("0.4*x^2 + 2*sin(x) + 0.2*x");
  const [x0, setX0] = useState("2");
  const [lr, setLr] = useState("0.15");
  const [momentum, setMomentum] = useState("0.2");
  const [iters, setIters] = useState("20");

  const analysis = useMemo(() => {
    let compiled;
    let deriv;
    try {
      compiled = math.compile(expr);
      deriv = math.compile(math.derivative(expr, "x").toString());
    } catch {
      return { warning: t("optInvalidExpr"), path: [], curve: [], residual: NaN, best: NaN };
    }
    const f = (x: number) => {
      const value = Number(compiled.evaluate({ x }));
      return Number.isFinite(value) ? value : NaN;
    };
    const df = (x: number) => {
      const value = Number(deriv.evaluate({ x }));
      return Number.isFinite(value) ? value : NaN;
    };

    const xStart = Number(x0);
    const lrVal = Number(lr);
    const momVal = Math.max(0, Math.min(0.95, Number(momentum)));
    const maxIter = Math.max(4, Math.min(60, Math.floor(Number(iters) || 20)));
    if (!Number.isFinite(xStart) || !Number.isFinite(lrVal) || !Number.isFinite(momVal)) {
      return { warning: t("optInvalidParams"), path: [], curve: [], residual: NaN, best: NaN };
    }

    const path: { x: number; y: number; k: number }[] = [];
    let xCurr = xStart;
    let velocity = 0;
    for (let k = 0; k < maxIter; k += 1) {
      const grad = df(xCurr);
      if (!Number.isFinite(grad)) break;
      velocity = momVal * velocity - lrVal * grad;
      xCurr += velocity;
      const yCurr = f(xCurr);
      path.push({ x: xCurr, y: yCurr, k: k + 1 });
    }

    const minX = path.reduce((acc, item) => Math.min(acc, item.x), xStart);
    const maxX = path.reduce((acc, item) => Math.max(acc, item.x), xStart);
    const spanMin = minX - 2;
    const spanMax = maxX + 2;
    const curve: { x: number; y: number }[] = [];
    for (let i = 0; i <= 240; i += 1) {
      const x = spanMin + ((spanMax - spanMin) * i) / 240;
      curve.push({ x, y: f(x) });
    }

    const best = path[path.length - 1]?.x ?? xStart;
    const residual = path[path.length - 1]?.y ?? f(xStart);
    return { warning: "", path, curve, residual, best };
  }, [expr, x0, lr, momentum, iters, t]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("optTitle")}</div>
      <div className="demo-grid demo-grid-wide">
        <label className="field span-2">
          <span>{t("optExpr")}</span>
          <input value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("optX0")}</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("optLr")}</span>
          <input type="number" value={lr} onChange={(event) => setLr(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("optMomentum")}</span>
          <input type="number" value={momentum} onChange={(event) => setMomentum(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("optIters")}</span>
          <input type="number" value={iters} onChange={(event) => setIters(event.target.value)} step="1" />
        </label>
      </div>
      {analysis.warning ? <div className="pill pill-bad">{analysis.warning}</div> : null}
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">{t("optBestX")} {Number.isFinite(analysis.best) ? analysis.best.toFixed(4) : "--"}</span>
          <span className="pill">{t("optBestF")} {Number.isFinite(analysis.residual) ? analysis.residual.toFixed(4) : "--"}</span>
        </div>
      </div>
      <PlotCanvas
        series={[
          { id: "curve", points: analysis.curve, color: "#2563eb", label: "f(x)" },
          {
            id: "path",
            points: analysis.path.map((p) => ({ x: p.x, y: p.y })),
            color: "#f97316",
            label: t("optPath"),
            mode: "scatter"
          }
        ]}
        xLabel="x"
        yLabel="f(x)"
        showLegend
      />
      <div className="mini-table">
        <div className="mini-row header">
          <span>{t("optStep")}</span>
          <span>x</span>
          <span>f(x)</span>
        </div>
        {analysis.path.slice(0, 10).map((step) => (
          <div key={`opt-${step.k}`} className="mini-row">
            <span>{step.k}</span>
            <span>{step.x.toFixed(4)}</span>
            <span>{step.y.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
