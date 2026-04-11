"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

export function StabilityDemo() {
  const { t } = useLocale();
  const [alpha, setAlpha] = useState("0.01");
  const [c, setC] = useState("1");
  const [dt, setDt] = useState("0.05");
  const [dx, setDx] = useState("0.2");

  const { r, s, heatStable, waveStable } = useMemo(() => {
    const alphaVal = Number(alpha);
    const cVal = Number(c);
    const dtVal = Number(dt);
    const dxVal = Number(dx);
    if (
      !Number.isFinite(alphaVal) ||
      !Number.isFinite(cVal) ||
      !Number.isFinite(dtVal) ||
      !Number.isFinite(dxVal) ||
      dxVal <= 0 ||
      dtVal <= 0
    ) {
      return { r: NaN, s: NaN, heatStable: false, waveStable: false };
    }
    const rVal = (alphaVal * dtVal) / (dxVal * dxVal);
    const sVal = (cVal * dtVal) / dxVal;
    return { r: rVal, s: sVal, heatStable: rVal <= 0.5, waveStable: sVal <= 1 };
  }, [alpha, c, dt, dx]);

  const rText = Number.isFinite(r) ? r.toFixed(4) : "--";
  const sText = Number.isFinite(s) ? s.toFixed(4) : "--";

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("stabilityDemoTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("stabilityAlpha")}</span>
          <input type="number" value={alpha} onChange={(event) => setAlpha(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("stabilityC")}</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("stabilityDt")}</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("stabilityDx")}</span>
          <input type="number" value={dx} onChange={(event) => setDx(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">{t("stabilityR")} {rText}</span>
          <span className="pill">{t("stabilityS")} {sText}</span>
          <span className={`pill ${heatStable ? "pill-good" : "pill-bad"}`}>
            {t("stabilityHeat")} {heatStable ? t("stabilityYes") : t("stabilityNo")}
          </span>
          <span className={`pill ${waveStable ? "pill-good" : "pill-bad"}`}>
            {t("stabilityWave")} {waveStable ? t("stabilityYes") : t("stabilityNo")}
          </span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`r \le \tfrac{1}{2},\; s \le 1`} />
        </div>
      </div>
    </div>
  );
}
