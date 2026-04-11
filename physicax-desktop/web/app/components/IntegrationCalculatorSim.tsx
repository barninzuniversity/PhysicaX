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

type Method = "simpson" | "trapezoid" | "midpoint" | "gauss4" | "adaptive";

const gaussNodes = [-0.8611363116, -0.3399810436, 0.3399810436, 0.8611363116];
const gaussWeights = [0.3478548451, 0.6521451549, 0.6521451549, 0.3478548451];

export function IntegrationCalculatorSim() {
  const { t } = useLocale();
  const [expr, setExpr] = useState("sin(x)^2 + 0.35*cos(2*x)");
  const [a, setA] = useState("-3");
  const [b, setB] = useState("3");
  const [steps, setSteps] = useState("200");
  const [method, setMethod] = useState<Method>("simpson");
  const [showCumulative, setShowCumulative] = useState(true);
  const [showAbs, setShowAbs] = useState(false);
  const [tol, setTol] = useState("1e-5");
  const [maxIter, setMaxIter] = useState("6");

  const analysis = useMemo(() => {
    const aVal = Number(a);
    const bVal = Number(b);
    const nRaw = Math.max(20, Math.min(1200, Math.floor(Number(steps) || 200)));
    if (!Number.isFinite(aVal) || !Number.isFinite(bVal) || aVal === bVal) {
      return { warning: t("integrationInvalidBounds"), integral: NaN, points: [], cumulative: [], error: NaN };
    }
    let compiled;
    try {
      compiled = math.compile(normalizeExpr(expr));
    } catch {
      return { warning: t("integrationInvalidExpr"), integral: NaN, points: [], cumulative: [], error: NaN };
    }

    const f = (x: number) => {
      const val = Number(compiled.evaluate({ x }));
      if (!Number.isFinite(val)) return NaN;
      return showAbs ? Math.abs(val) : val;
    };

    const left = Math.min(aVal, bVal);
    const right = Math.max(aVal, bVal);
    const direction = aVal <= bVal ? 1 : -1;

    const trapezoid = (n: number) => {
      const h = (right - left) / n;
      let sum = 0.5 * (f(left) + f(right));
      for (let i = 1; i < n; i += 1) {
        sum += f(left + i * h);
      }
      return sum * h;
    };

    const midpoint = (n: number) => {
      const h = (right - left) / n;
      let sum = 0;
      for (let i = 0; i < n; i += 1) {
        sum += f(left + (i + 0.5) * h);
      }
      return sum * h;
    };

    const simpson = (n: number) => {
      const nEven = n % 2 === 0 ? n : n + 1;
      const h = (right - left) / nEven;
      let sum = f(left) + f(right);
      for (let i = 1; i < nEven; i += 1) {
        const coeff = i % 2 === 0 ? 2 : 4;
        sum += coeff * f(left + i * h);
      }
      return (h / 3) * sum;
    };

    const gauss4 = (n: number) => {
      const h = (right - left) / n;
      let sum = 0;
      for (let i = 0; i < n; i += 1) {
        const x0 = left + i * h;
        const x1 = x0 + h;
        const mid = (x0 + x1) / 2;
        const half = (x1 - x0) / 2;
        let local = 0;
        for (let k = 0; k < 4; k += 1) {
          local += gaussWeights[k] * f(mid + half * gaussNodes[k]);
        }
        sum += local * half;
      }
      return sum;
    };

    const trapVal = trapezoid(nRaw);
    const simpVal = simpson(nRaw);
    const midVal = midpoint(nRaw);
    const gaussVal = gauss4(Math.max(10, Math.floor(nRaw / 4)));

    let integral = simpVal;
    let errorProxy = Math.abs(simpVal - trapVal);
    let adaptiveSteps = nRaw;
    if (method === "trapezoid") integral = trapVal;
    if (method === "midpoint") integral = midVal;
    if (method === "gauss4") integral = gaussVal;
    if (method === "adaptive") {
      const tolVal = Math.max(1e-8, Number(tol) || 1e-5);
      const maxIterVal = Math.max(2, Math.min(10, Math.floor(Number(maxIter) || 6)));
      let currentN = Math.max(20, nRaw);
      let prev = simpson(currentN);
      let estimate = Infinity;
      for (let iter = 0; iter < maxIterVal; iter += 1) {
        const nextN = currentN * 2;
        const next = simpson(nextN);
        estimate = Math.abs(next - prev) / 15;
        prev = next;
        currentN = nextN;
        if (estimate <= tolVal) {
          break;
        }
      }
      integral = prev;
      adaptiveSteps = currentN;
      errorProxy = estimate;
    }

    const samples = 240;
    const points: { x: number; y: number }[] = [];
    const cumulative: { x: number; y: number }[] = [];
    let area = 0;
    let prevX = left;
    let prevY = f(prevX);
    for (let i = 0; i <= samples; i += 1) {
      const x = left + (i / samples) * (right - left);
      const y = f(x);
      points.push({ x, y });
      if (i > 0) {
        area += 0.5 * (y + prevY) * (x - prevX);
      }
      cumulative.push({ x, y: area });
      prevX = x;
      prevY = y;
    }

    return {
      warning: "",
      integral: integral * direction,
      points,
      cumulative,
      error: errorProxy,
      adaptiveSteps
    };
  }, [a, b, steps, expr, method, showAbs, tol, maxIter, t]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("integrationTitle")}</div>
      <div className="demo-grid demo-grid-wide">
        <label className="field span-2">
          <span>{t("integrationExpr")}</span>
          <input value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("integrationLower")}</span>
          <input type="number" value={a} onChange={(event) => setA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("integrationUpper")}</span>
          <input type="number" value={b} onChange={(event) => setB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("integrationSteps")}</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>{t("integrationMethod")}</span>
          <select value={method} onChange={(event) => setMethod(event.target.value as Method)}>
            <option value="simpson">{t("integrationMethodSimpson")}</option>
            <option value="trapezoid">{t("integrationMethodTrapezoid")}</option>
            <option value="midpoint">{t("integrationMethodMidpoint")}</option>
            <option value="gauss4">{t("integrationMethodGauss4")}</option>
            <option value="adaptive">{t("integrationMethodAdaptive")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("integrationTolerance")}</span>
          <input type="number" value={tol} onChange={(event) => setTol(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("integrationMaxIter")}</span>
          <input type="number" value={maxIter} onChange={(event) => setMaxIter(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>{t("integrationAbs")}</span>
          <select value={showAbs ? "on" : "off"} onChange={(event) => setShowAbs(event.target.value === "on")}>
            <option value="off">{t("integrationAbsOff")}</option>
            <option value="on">{t("integrationAbsOn")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("integrationCumulative")}</span>
          <select value={showCumulative ? "on" : "off"} onChange={(event) => setShowCumulative(event.target.value === "on")}>
            <option value="on">{t("integrationCumulativeOn")}</option>
            <option value="off">{t("integrationCumulativeOff")}</option>
          </select>
        </label>
      </div>
      {analysis.warning ? <div className="pill pill-bad">{analysis.warning}</div> : null}
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">{t("integrationResult")} {Number.isFinite(analysis.integral) ? analysis.integral.toFixed(6) : "--"}</span>
          <span className="pill">{t("integrationErrorProxy")} {Number.isFinite(analysis.error) ? analysis.error.toExponential(2) : "--"}</span>
          {method === "adaptive" ? (
            <span className="pill">{t("integrationAdaptiveSteps")} {analysis.adaptiveSteps}</span>
          ) : null}
        </div>
        <div className="demo-note">{t("integrationNote")}</div>
      </div>
      <div className="demo-stack">
        <PlotCanvas
          series={[{ id: "f", points: analysis.points, color: "#2563eb", label: t("integrationSeriesLabel") }]}
          xLabel="x"
          yLabel={showAbs ? "|f(x)|" : "f(x)"}
          showLegend
        />
        {showCumulative ? (
          <PlotCanvas
            series={[{ id: "cum", points: analysis.cumulative, color: "#16a34a", label: t("integrationCumulativeLabel") }]}
            xLabel="x"
            yLabel={t("integrationCumulativeAxis")}
            showLegend
          />
        ) : null}
      </div>
    </div>
  );
}
