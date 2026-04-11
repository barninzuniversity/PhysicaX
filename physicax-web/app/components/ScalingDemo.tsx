"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

export function ScalingDemo() {
  const [l, setL] = useState("1");
  const [g, setG] = useState("9.80665");
  const [t, setT] = useState("2");
  const { t: tt } = useLocale();

  const { period, tau } = useMemo(() => {
    const lVal = Number(l);
    const gVal = Number(g);
    const tVal = Number(t);
    if (!Number.isFinite(lVal) || !Number.isFinite(gVal) || !Number.isFinite(tVal) || lVal <= 0 || gVal <= 0) {
      return { period: NaN, tau: NaN };
    }
    const periodVal = 2 * Math.PI * Math.sqrt(lVal / gVal);
    return { period: periodVal, tau: tVal / periodVal };
  }, [l, g, t]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{tt("scalingHelperTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{tt("scalingHelperLength")}</span>
          <input type="number" value={l} onChange={(event) => setL(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{tt("scalingHelperGravity")}</span>
          <input type="number" value={g} onChange={(event) => setG(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{tt("scalingHelperTime")}</span>
          <input type="number" value={t} onChange={(event) => setT(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">T = {Number.isFinite(period) ? period.toFixed(3) : "--"} s</span>
          <span className="pill">tau = {Number.isFinite(tau) ? tau.toFixed(3) : "--"}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`\tau = \frac{t}{T}`} />
        </div>
      </div>
    </div>
  );
}
