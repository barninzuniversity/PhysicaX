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

type ColorKey = "f" | "d" | "i";

const defaultColors: Record<ColorKey, string> = {
  f: "#2563eb",
  d: "#f97316",
  i: "#16a34a"
};

export function DerivativeIntegralSim() {
  const { t } = useLocale();
  const [expr, setExpr] = useState("sin(x) + 0.2*x^2");
  const [xMin, setXMin] = useState("-4");
  const [xMax, setXMax] = useState("4");
  const [x0, setX0] = useState("0");
  const [showDerivative, setShowDerivative] = useState(true);
  const [showIntegral, setShowIntegral] = useState(true);
  const [colors, setColors] = useState<Record<ColorKey, string>>(defaultColors);

  const analysis = useMemo(() => {
    let compiled;
    let deriv;
    try {
      const normalized = normalizeExpr(expr);
      compiled = math.compile(normalized);
      deriv = math.compile(math.derivative(normalized, "x").toString());
    } catch {
      return { warning: t("calcInvalidExpr"), series: [] as any[] };
    }
    const f = (x: number) => {
      const val = Number(compiled.evaluate({ x }));
      return Number.isFinite(val) ? val : NaN;
    };
    const df = (x: number) => {
      const val = Number(deriv.evaluate({ x }));
      return Number.isFinite(val) ? val : NaN;
    };

    const min = Number(xMin);
    const max = Number(xMax);
    const anchor = Number(x0);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      return { warning: t("calcInvalidBounds"), series: [] as any[] };
    }
    if (!Number.isFinite(anchor) || anchor < min || anchor > max) {
      return { warning: t("calcInvalidAnchor"), series: [] as any[] };
    }

    const samples = 240;
    const points: { x: number; y: number }[] = [];
    const derivPts: { x: number; y: number }[] = [];
    const cumulativePts: { x: number; y: number }[] = [];
    let cumulative = 0;
    let prevX = min;
    let prevY = f(prevX);
    for (let i = 0; i <= samples; i += 1) {
      const x = min + ((max - min) * i) / samples;
      const y = f(x);
      points.push({ x, y });
      derivPts.push({ x, y: df(x) });
      if (i === 0) {
        cumulative = 0;
      } else {
        const area = 0.5 * (y + prevY) * (x - prevX);
        cumulative += area;
      }
      cumulativePts.push({ x, y: cumulative });
      prevX = x;
      prevY = y;
    }

    const anchorIndex = Math.max(0, Math.min(samples, Math.round(((anchor - min) / (max - min)) * samples)));
    const anchorValue = cumulativePts[anchorIndex]?.y ?? 0;
    const integralPts = cumulativePts.map((pt) => ({ x: pt.x, y: pt.y - anchorValue }));

    const series = [
      { id: "f", points, color: colors.f, label: t("calcFunction") }
    ];
    if (showDerivative) {
      series.push({ id: "d", points: derivPts, color: colors.d, label: t("calcDerivative") });
    }
    if (showIntegral) {
      series.push({ id: "i", points: integralPts, color: colors.i, label: t("calcIntegral") });
    }

    return { warning: "", series };
  }, [expr, xMin, xMax, x0, showDerivative, showIntegral, colors, t]);

  const updateColor = (key: ColorKey, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("calcTitle")}</div>
      <div className="demo-grid demo-grid-wide">
        <label className="field span-2">
          <span>{t("calcExpr")}</span>
          <input value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("calcXmin")}</span>
          <input type="number" value={xMin} onChange={(event) => setXMin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("calcXmax")}</span>
          <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("calcAnchor")}</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("calcShowDerivative")}</span>
          <select value={showDerivative ? "on" : "off"} onChange={(event) => setShowDerivative(event.target.value === "on")}>
            <option value="on">{t("featureToggleOn")}</option>
            <option value="off">{t("featureToggleOff")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("calcShowIntegral")}</span>
          <select value={showIntegral ? "on" : "off"} onChange={(event) => setShowIntegral(event.target.value === "on")}>
            <option value="on">{t("featureToggleOn")}</option>
            <option value="off">{t("featureToggleOff")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("calcColorFunction")}</span>
          <input type="color" value={colors.f} onChange={(event) => updateColor("f", event.target.value)} />
        </label>
        <label className="field">
          <span>{t("calcColorDerivative")}</span>
          <input type="color" value={colors.d} onChange={(event) => updateColor("d", event.target.value)} />
        </label>
        <label className="field">
          <span>{t("calcColorIntegral")}</span>
          <input type="color" value={colors.i} onChange={(event) => updateColor("i", event.target.value)} />
        </label>
      </div>
      {analysis.warning ? <div className="pill pill-bad">{analysis.warning}</div> : null}
      <div className="demo-note">{t("calcNote")}</div>
      <PlotCanvas
        series={analysis.series}
        xLabel="x"
        yLabel="y"
        showLegend
      />
    </div>
  );
}
