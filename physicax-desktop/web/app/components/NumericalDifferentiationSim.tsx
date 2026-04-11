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

type Method = "forward" | "backward" | "central" | "five";

export function NumericalDifferentiationSim() {
  const { t } = useLocale();
  const [expr, setExpr] = useState("sin(x) + 0.2*x^2");
  const [method, setMethod] = useState<Method>("central");
  const [xMin, setXMin] = useState("-4");
  const [xMax, setXMax] = useState("4");
  const [step, setStep] = useState("0.05");

  const analysis = useMemo(() => {
    let compiled;
    let deriv;
    try {
      compiled = math.compile(expr);
      deriv = math.compile(math.derivative(expr, "x").toString());
    } catch {
      return { warning: t("diffInvalidExpr"), numeric: [], analytic: [], error: [] };
    }

    const f = (x: number) => {
      try {
        const val = Number(compiled.evaluate({ x }));
        return Number.isFinite(val) ? val : NaN;
      } catch {
        return NaN;
      }
    };
    const df = (x: number) => {
      try {
        const val = Number(deriv.evaluate({ x }));
        return Number.isFinite(val) ? val : NaN;
      } catch {
        return NaN;
      }
    };

    const min = Number(xMin);
    const max = Number(xMax);
    const h = Math.max(1e-4, Number(step) || 0.05);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      return { warning: t("diffInvalidBounds"), numeric: [], analytic: [], error: [] };
    }

    const samples = 220;
    const numeric: { x: number; y: number }[] = [];
    const analytic: { x: number; y: number }[] = [];
    const error: { x: number; y: number }[] = [];

    for (let i = 0; i <= samples; i += 1) {
      const x = min + ((max - min) * i) / samples;
      let num = NaN;
      if (method === "forward") {
        num = (f(x + h) - f(x)) / h;
      } else if (method === "backward") {
        num = (f(x) - f(x - h)) / h;
      } else if (method === "central") {
        num = (f(x + h) - f(x - h)) / (2 * h);
      } else {
        num = (-f(x + 2 * h) + 8 * f(x + h) - 8 * f(x - h) + f(x - 2 * h)) / (12 * h);
      }
      const exact = df(x);
      if (!Number.isFinite(num) || !Number.isFinite(exact)) {
        continue;
      }
      numeric.push({ x, y: num });
      analytic.push({ x, y: exact });
      error.push({ x, y: Math.abs(num - exact) });
    }

    return { warning: "", numeric, analytic, error };
  }, [expr, method, xMin, xMax, step, t]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("diffTitle")}</div>
      <div className="demo-grid demo-grid-wide">
        <label className="field span-2">
          <span>{t("diffExpr")}</span>
          <input value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("diffMethod")}</span>
          <select value={method} onChange={(event) => setMethod(event.target.value as Method)}>
            <option value="forward">{t("diffForward")}</option>
            <option value="backward">{t("diffBackward")}</option>
            <option value="central">{t("diffCentral")}</option>
            <option value="five">{t("diffFivePoint")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("diffXmin")}</span>
          <input type="number" value={xMin} onChange={(event) => setXMin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("diffXmax")}</span>
          <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("diffStep")}</span>
          <input type="number" value={step} onChange={(event) => setStep(event.target.value)} step="any" />
        </label>
      </div>
      {analysis.warning ? <div className="pill pill-bad">{analysis.warning}</div> : null}
      <div className="demo-stack">
        <PlotCanvas
          series={[
            { id: "numeric", points: analysis.numeric, color: "#2563eb", label: t("diffNumeric") },
            { id: "analytic", points: analysis.analytic, color: "#94a3b8", dash: [6, 4], label: t("diffAnalytic") }
          ]}
          xLabel="x"
          yLabel="df/dx"
          showLegend
        />
        <PlotCanvas
          series={[{ id: "error", points: analysis.error, color: "#ef4444", label: t("diffError") }]}
          xLabel="x"
          yLabel={t("diffErrorAxis")}
          showLegend
        />
      </div>
    </div>
  );
}
