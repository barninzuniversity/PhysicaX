"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

type SolverKey = "Euler" | "Heun" | "RK4";

function stepEuler(y: number, h: number) {
  return y + h * (-y);
}

function stepHeun(y: number, h: number) {
  const k1 = -y;
  const yPred = y + h * k1;
  const k2 = -yPred;
  return y + (h / 2) * (k1 + k2);
}

function stepRK4(y: number, h: number) {
  const k1 = -y;
  const k2 = -(y + (h / 2) * k1);
  const k3 = -(y + (h / 2) * k2);
  const k4 = -(y + h * k3);
  return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

export function SolverStepDemo() {
  const { t } = useLocale();
  const [solver, setSolver] = useState<SolverKey>("RK4");
  const [h, setH] = useState("0.1");

  const { approx, exact, error, steps, dt } = useMemo(() => {
    const hVal = Number(h);
    if (!Number.isFinite(hVal) || hVal <= 0) {
      return { approx: NaN, exact: Math.exp(-1), error: NaN, steps: 0, dt: NaN };
    }
    const stepsVal = Math.max(1, Math.round(1 / hVal));
    const dtVal = 1 / stepsVal;
    let y = 1;
    for (let i = 0; i < stepsVal; i += 1) {
      if (solver === "Euler") {
        y = stepEuler(y, dtVal);
      } else if (solver === "Heun") {
        y = stepHeun(y, dtVal);
      } else {
        y = stepRK4(y, dtVal);
      }
    }
    const exactVal = Math.exp(-1);
    return {
      approx: y,
      exact: exactVal,
      error: Math.abs(y - exactVal),
      steps: stepsVal,
      dt: dtVal
    };
  }, [solver, h]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("solverAccuracyTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("solverAccuracySolver")}</span>
          <select value={solver} onChange={(event) => setSolver(event.target.value as SolverKey)}>
            <option value="Euler">Euler</option>
            <option value="Heun">Heun</option>
            <option value="RK4">RK4</option>
          </select>
        </label>
        <label className="field">
          <span>{t("solverAccuracyStep")}</span>
          <input type="number" value={h} onChange={(event) => setH(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">{t("solverAccuracySteps")} {steps}</span>
          <span className="pill">{t("solverAccuracyDt")} {Number.isFinite(dt) ? dt.toFixed(4) : "--"}</span>
          <span className="pill">{t("solverAccuracyApprox")} {Number.isFinite(approx) ? approx.toFixed(6) : "--"}</span>
          <span className="pill">{t("solverAccuracyExact")} {exact.toFixed(6)}</span>
          <span className="pill">{t("solverAccuracyError")} {Number.isFinite(error) ? error.toExponential(2) : "--"}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`y' = -y,\; y(0)=1,\; t=1`} />
        </div>
      </div>
    </div>
  );
}
