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

type Method = "bisection" | "secant" | "newton";

export function RootFinderSim() {
  const { t } = useLocale();
  const [expr, setExpr] = useState("x^3 - 3*x + 0.5");
  const [method, setMethod] = useState<Method>("bisection");
  const [a, setA] = useState("-2");
  const [b, setB] = useState("2");
  const [x0, setX0] = useState("1");
  const [x1, setX1] = useState("1.5");
  const [iters, setIters] = useState("12");
  const [tol, setTol] = useState("1e-5");

  const analysis = useMemo(() => {
    let compiled;
    try {
      compiled = math.compile(expr);
    } catch {
      return { warning: t("rootInvalidExpr"), steps: [], curve: [], root: NaN, residual: NaN };
    }
    const f = (x: number) => {
      try {
        const value = Number(compiled.evaluate({ x }));
        return Number.isFinite(value) ? value : NaN;
      } catch {
        return NaN;
      }
    };
    const aVal = Number(a);
    const bVal = Number(b);
    const x0Val = Number(x0);
    const x1Val = Number(x1);
    const maxIter = Math.max(3, Math.min(40, Math.floor(Number(iters) || 12)));
    const tolVal = Math.max(1e-10, Number(tol) || 1e-5);

    const curve: { x: number; y: number }[] = [];
    const xMin = Number.isFinite(aVal) ? Math.min(aVal, bVal, x0Val, x1Val) : -3;
    const xMax = Number.isFinite(bVal) ? Math.max(aVal, bVal, x0Val, x1Val) : 3;
    const spanMin = Number.isFinite(xMin) ? xMin - 1 : -4;
    const spanMax = Number.isFinite(xMax) ? xMax + 1 : 4;
    const samples = 240;
    for (let i = 0; i <= samples; i += 1) {
      const x = spanMin + ((spanMax - spanMin) * i) / samples;
      curve.push({ x, y: f(x) });
    }

    const steps: { k: number; x: number; fx: number }[] = [];
    let root = NaN;

    if (method === "bisection") {
      if (!Number.isFinite(aVal) || !Number.isFinite(bVal)) {
        return { warning: t("rootInvalidBounds"), steps, curve, root, residual: NaN };
      }
      let left = aVal;
      let right = bVal;
      let fLeft = f(left);
      let fRight = f(right);
      if (!Number.isFinite(fLeft) || !Number.isFinite(fRight) || fLeft * fRight > 0) {
        return { warning: t("rootNoBracket"), steps, curve, root, residual: NaN };
      }
      for (let k = 0; k < maxIter; k += 1) {
        const mid = (left + right) / 2;
        const fMid = f(mid);
        steps.push({ k: k + 1, x: mid, fx: fMid });
        if (Math.abs(fMid) < tolVal) {
          root = mid;
          break;
        }
        if (fLeft * fMid <= 0) {
          right = mid;
          fRight = fMid;
        } else {
          left = mid;
          fLeft = fMid;
        }
        root = mid;
      }
    }

    if (method === "secant") {
      if (!Number.isFinite(x0Val) || !Number.isFinite(x1Val)) {
        return { warning: t("rootInvalidSeeds"), steps, curve, root, residual: NaN };
      }
      let xPrev = x0Val;
      let xCurr = x1Val;
      let fPrev = f(xPrev);
      let fCurr = f(xCurr);
      for (let k = 0; k < maxIter; k += 1) {
        if (!Number.isFinite(fPrev) || !Number.isFinite(fCurr)) break;
        const denom = fCurr - fPrev;
        if (Math.abs(denom) < 1e-12) break;
        const next = xCurr - fCurr * (xCurr - xPrev) / denom;
        steps.push({ k: k + 1, x: next, fx: f(next) });
        if (Math.abs(f(next)) < tolVal) {
          root = next;
          break;
        }
        xPrev = xCurr;
        fPrev = fCurr;
        xCurr = next;
        fCurr = f(xCurr);
        root = xCurr;
      }
    }

    if (method === "newton") {
      let deriv;
      try {
        deriv = math.compile(math.derivative(expr, "x").toString());
      } catch {
        return { warning: t("rootDerivativeFail"), steps, curve, root, residual: NaN };
      }
      const df = (x: number) => {
        try {
          const value = Number(deriv.evaluate({ x }));
          return Number.isFinite(value) ? value : NaN;
        } catch {
          return NaN;
        }
      };
      let xCurr = Number.isFinite(x0Val) ? x0Val : 0;
      for (let k = 0; k < maxIter; k += 1) {
        const fCurr = f(xCurr);
        const dCurr = df(xCurr);
        if (!Number.isFinite(fCurr) || !Number.isFinite(dCurr) || Math.abs(dCurr) < 1e-12) {
          break;
        }
        const next = xCurr - fCurr / dCurr;
        steps.push({ k: k + 1, x: next, fx: f(next) });
        if (Math.abs(f(next)) < tolVal) {
          root = next;
          break;
        }
        xCurr = next;
        root = xCurr;
      }
    }

    const residual = Number.isFinite(root) ? f(root) : NaN;
    return { warning: "", steps, curve, root, residual };
  }, [expr, method, a, b, x0, x1, iters, tol, t]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("rootFinderTitle")}</div>
      <div className="demo-grid demo-grid-wide">
        <label className="field span-2">
          <span>{t("rootFinderExpr")}</span>
          <input value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("rootFinderMethod")}</span>
          <select value={method} onChange={(event) => setMethod(event.target.value as Method)}>
            <option value="bisection">{t("rootFinderBisection")}</option>
            <option value="secant">{t("rootFinderSecant")}</option>
            <option value="newton">{t("rootFinderNewton")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("rootFinderIter")}</span>
          <input type="number" value={iters} onChange={(event) => setIters(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>{t("rootFinderTol")}</span>
          <input type="number" value={tol} onChange={(event) => setTol(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("rootFinderA")}</span>
          <input type="number" value={a} onChange={(event) => setA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("rootFinderB")}</span>
          <input type="number" value={b} onChange={(event) => setB(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("rootFinderX0")}</span>
          <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("rootFinderX1")}</span>
          <input type="number" value={x1} onChange={(event) => setX1(event.target.value)} step="any" />
        </label>
      </div>
      {analysis.warning ? <div className="pill pill-bad">{analysis.warning}</div> : null}
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">{t("rootFinderRoot")} {Number.isFinite(analysis.root) ? analysis.root.toFixed(6) : "--"}</span>
          <span className="pill">{t("rootFinderResidual")} {Number.isFinite(analysis.residual) ? analysis.residual.toExponential(2) : "--"}</span>
        </div>
      </div>
      <PlotCanvas
        series={[
          { id: "f", points: analysis.curve, color: "#2563eb", label: "f(x)" },
          {
            id: "iters",
            points: analysis.steps.map((s) => ({ x: s.x, y: s.fx })),
            color: "#f97316",
            label: t("rootFinderIterates"),
            mode: "scatter"
          }
        ]}
        xLabel="x"
        yLabel="f(x)"
        showLegend
      />
      <div className="mini-table">
        <div className="mini-row header">
          <span>{t("rootFinderStep")}</span>
          <span>x</span>
          <span>f(x)</span>
        </div>
        {analysis.steps.slice(0, 10).map((step) => (
          <div key={`step-${step.k}`} className="mini-row">
            <span>{step.k}</span>
            <span>{step.x.toFixed(4)}</span>
            <span>{step.fx.toExponential(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
