"use client";

import { useMemo, useState } from "react";
import { create, all } from "mathjs";
import { MathBlock } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

const math = create(all);

const factorial = (n: number) => {
  let out = 1;
  for (let i = 2; i <= n; i += 1) {
    out *= i;
  }
  return out;
};

export function SymbolicWorkbenchSim() {
  const [expr, setExpr] = useState("sin(x) * exp(x)");
  const [x0, setX0] = useState("0");
  const [order, setOrder] = useState("5");
  const [a, setA] = useState("0");
  const [b, setB] = useState("1");
  const { t } = useLocale();

  const analysis = useMemo(() => {
    let simplified = "";
    let derivative = "";
    let second = "";
    let series = "";
    let numericInt = "";
    let warning = "";
    try {
      simplified = math.simplify(expr).toString();
      derivative = math.derivative(expr, "x").toString();
      second = math.derivative(derivative, "x").toString();
    } catch {
      warning = t("symbolicWorkbenchParseError");
    }

    const orderVal = Math.max(1, Math.min(12, Math.floor(Number(order) || 1)));
    const x0Val = Number(x0) || 0;
    try {
      const derivatives: string[] = [];
      let current = expr;
      for (let k = 0; k <= orderVal; k += 1) {
        const evalDeriv = math.derivative(current, "x").toString();
        derivatives.push(current);
        current = evalDeriv;
      }
      const terms = derivatives.map((d, idx) => {
        const compiled = math.compile(d);
        const val = Number(compiled.evaluate({ x: x0Val }));
        const coeff = val / factorial(idx);
        return `${coeff.toFixed(4)} (x - ${x0Val})^${idx}`;
      });
      series = terms.join(" + ");
    } catch {
      // ignore
    }

    try {
      const aVal = Number(a);
      const bVal = Number(b);
      if (Number.isFinite(aVal) && Number.isFinite(bVal) && aVal < bVal) {
        const fn = math.compile(expr);
        const n = 600;
        const h = (bVal - aVal) / n;
        let sum = 0;
        for (let i = 0; i <= n; i += 1) {
          const x = aVal + h * i;
          const w = i === 0 || i === n ? 1 : i % 2 === 0 ? 2 : 4;
          sum += w * Number(fn.evaluate({ x }));
        }
        numericInt = `${((h / 3) * sum).toFixed(5)}`;
      }
    } catch {
      // ignore
    }

    return { simplified, derivative, second, series, numericInt, warning };
  }, [expr, x0, order, a, b]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("symbolicWorkbenchTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("symbolicWorkbenchExpression")}</span>
          <input value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("symbolicWorkbenchTaylorCenter")}</span>
          <input value={x0} onChange={(event) => setX0(event.target.value)} type="number" step="any" />
        </label>
        <label className="field">
          <span>{t("symbolicWorkbenchSeriesOrder")}</span>
          <input value={order} onChange={(event) => setOrder(event.target.value)} type="number" step="1" />
        </label>
        <label className="field">
          <span>{t("symbolicWorkbenchIntegralA")}</span>
          <input value={a} onChange={(event) => setA(event.target.value)} type="number" step="any" />
        </label>
        <label className="field">
          <span>{t("symbolicWorkbenchIntegralB")}</span>
          <input value={b} onChange={(event) => setB(event.target.value)} type="number" step="any" />
        </label>
      </div>
      {analysis.warning ? <div className="pill pill-bad">{analysis.warning}</div> : null}
      <div className="workspace">
        <div className="workspace-pane">
          <h4>{t("symbolicWorkbenchSimplified")}</h4>
          <MathBlock latex={String.raw`f(x) = ${analysis.simplified || expr}`} />
          <h4>{t("symbolicWorkbenchDerivative")}</h4>
          <MathBlock latex={String.raw`f'(x) = ${analysis.derivative || "?"}`} />
          <h4>{t("symbolicWorkbenchSecondDerivative")}</h4>
          <MathBlock latex={String.raw`f''(x) = ${analysis.second || "?"}`} />
        </div>
        <div className="workspace-pane">
          <h4>{t("symbolicWorkbenchTaylorExpansion")}</h4>
          <div className="math-block" style={{ fontSize: "0.92rem" }}>{analysis.series || t("symbolicWorkbenchSeriesUnavailable")}</div>
          <h4>{t("symbolicWorkbenchNumericalIntegral")}</h4>
          <div className="pill">{t("symbolicWorkbenchIntegral")} {analysis.numericInt || t("symbolicWorkbenchNA")}</div>
          <div className="demo-note">{t("symbolicWorkbenchSimpsonNote")}</div>
        </div>
      </div>
    </div>
  );
}
