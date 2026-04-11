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

const normalizeExpr = (expr: string) => expr.replace(/\bln\s*\(/g, "log(");

type FuncKey = "sin" | "cos" | "exp" | "ln1p" | "geom" | "custom";

const factorial = (n: number) => {
  let out = 1;
  for (let i = 2; i <= n; i += 1) {
    out *= i;
  }
  return out;
};

const presets: Record<Exclude<FuncKey, "custom">, { label: string; expr: string }> = {
  sin: { label: "sin(x)", expr: "sin(x)" },
  cos: { label: "cos(x)", expr: "cos(x)" },
  exp: { label: "exp(x)", expr: "exp(x)" },
  ln1p: { label: "ln(1 + x)", expr: "log(1 + x)" },
  geom: { label: "1 / (1 - x)", expr: "1 / (1 - x)" }
};

export function TaylorSeriesSim() {
  const [fn, setFn] = useState<FuncKey>("custom");
  const [order, setOrder] = useState("6");
  const [x0, setX0] = useState("0");
  const [xMin, setXMin] = useState("-3");
  const [xMax, setXMax] = useState("3");
  const [customExpr, setCustomExpr] = useState("sin(x) + 0.2*x^2");
  const isCustom = fn === "custom";
  const { t } = useLocale();

  const { approx, target, warning } = useMemo(() => {
    const n = Math.max(1, Math.min(14, Math.floor(Number(order))));
    const x0Val = Number(x0);
    const min = Number(xMin);
    const max = Number(xMax);
    const samples = 240;
    if (!Number.isFinite(x0Val) || !Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      return { approx: [], target: [], warning: t("taylorInvalidDomain") };
    }
    if ((fn === "ln1p" && min <= -1) || (fn === "geom" && max >= 1)) {
      return { approx: [], target: [], warning: t("taylorSingularity") };
    }

    const exprText = fn === "custom" ? customExpr : presets[fn].expr;
    const normalizedExpr = normalizeExpr(exprText);
    let compiled;
    try {
      compiled = math.compile(normalizedExpr);
    } catch {
      return { approx: [], target: [], warning: t("taylorInvalidExpr") };
    }

    const derivatives: { evaluate: (scope: { x: number }) => number }[] = [compiled];
    let derivExpr = normalizedExpr;
    try {
      for (let k = 1; k <= n; k += 1) {
        derivExpr = math.derivative(derivExpr, "x").toString();
        derivatives.push(math.compile(derivExpr));
      }
    } catch {
      return { approx: [], target: [], warning: t("taylorDerivativeFail") };
    }

    const approxPts: { x: number; y: number }[] = [];
    const targetPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= samples; i += 1) {
      const x = min + ((max - min) * i) / samples;
      let series = 0;
      for (let k = 0; k <= n; k += 1) {
        const d = derivatives[k]?.evaluate({ x: x0Val });
        if (!Number.isFinite(d)) {
          return { approx: [], target: [], warning: t("taylorDerivativeNonFinite") };
        }
        series += (d / factorial(k)) * Math.pow(x - x0Val, k);
      }
      approxPts.push({ x, y: series });
      const targetValue = compiled.evaluate({ x });
      targetPts.push({ x, y: Number(targetValue) });
    }

    return { approx: approxPts, target: targetPts, warning: "" };
  }, [fn, order, x0, xMin, xMax, customExpr]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("taylorTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("taylorPresetLabel")}</span>
          <select value={fn} onChange={(event) => setFn(event.target.value as FuncKey)}>
            {Object.entries(presets).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
            <option value="custom">{t("taylorCustomOption")}</option>
          </select>
        </label>
        <label className="field">
          <span>f(x)</span>
          <input
            type="text"
            value={customExpr}
            onChange={(event) => {
              setCustomExpr(event.target.value);
              if (fn !== "custom") {
                setFn("custom");
              }
            }}
          />
        </label>
        {!isCustom ? (
          <button type="button" className="control-chip" onClick={() => setFn("custom")}>
            {t("taylorEditCustom")}
          </button>
        ) : null}
        <label className="field">
          <span>{t("taylorOrder")}</span>
          <input type="number" value={order} onChange={(event) => setOrder(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>{t("taylorCenter")}</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("taylorXmin")}</span>
          <input type="number" value={xMin} onChange={(event) => setXMin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("taylorXmax")}</span>
          <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
        </label>
      </div>
      {warning ? <div className="pill pill-bad">{warning}</div> : null}
      <div className="demo-note">{t("taylorNote")}</div>
      <PlotCanvas
        series={[
          { id: "series", points: approx, color: "#2563eb", label: t("taylorSeriesLabel") },
          { id: "true", points: target, color: "#94a3b8", dash: [6, 4], label: t("taylorTrueLabel") }
        ]}
        xLabel="x"
        yLabel="f(x)"
        showLegend
      />
    </div>
  );
}
