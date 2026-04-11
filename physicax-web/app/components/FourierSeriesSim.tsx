"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { useLocale } from "./LocaleProvider";

type WaveType = "square" | "sawtooth" | "triangle";

export function FourierSeriesSim() {
  const [terms, setTerms] = useState("7");
  const [type, setType] = useState<WaveType>("square");
  const { t } = useLocale();

  const { approx, target } = useMemo(() => {
    const nTerms = Math.max(1, Math.min(30, Math.floor(Number(terms))));
    const pts: { x: number; y: number }[] = [];
    const targetPts: { x: number; y: number }[] = [];
    const samples = 240;

    const seriesValue = (x: number) => {
      let sum = 0;
      if (type === "square") {
        for (let k = 0; k < nTerms; k += 1) {
          const n = 2 * k + 1;
          sum += (1 / n) * Math.sin(n * x);
        }
        return (4 / Math.PI) * sum;
      }
      if (type === "triangle") {
        for (let k = 0; k < nTerms; k += 1) {
          const n = 2 * k + 1;
          const sign = k % 2 === 0 ? 1 : -1;
          sum += sign * (1 / (n * n)) * Math.sin(n * x);
        }
        return (8 / (Math.PI * Math.PI)) * sum;
      }
      for (let n = 1; n <= nTerms; n += 1) {
        const sign = n % 2 === 0 ? -1 : 1;
        sum += sign * (1 / n) * Math.sin(n * x);
      }
      return (2 / Math.PI) * sum;
    };

    const targetValue = (x: number) => {
      if (type === "square") {
        return Math.sign(Math.sin(x));
      }
      if (type === "triangle") {
        return (2 / Math.PI) * Math.asin(Math.sin(x));
      }
      return x / Math.PI;
    };

    for (let i = 0; i <= samples; i += 1) {
      const x = -Math.PI + (2 * Math.PI * i) / samples;
      pts.push({ x, y: seriesValue(x) });
      targetPts.push({ x, y: targetValue(x) });
    }

    return { approx: pts, target: targetPts };
  }, [terms, type]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("fourierTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("fourierWaveType")}</span>
          <select value={type} onChange={(event) => setType(event.target.value as WaveType)}>
            <option value="square">{t("fourierSquare")}</option>
            <option value="sawtooth">{t("fourierSaw")}</option>
            <option value="triangle">{t("fourierTriangle")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("fourierTerms")}</span>
          <input type="number" value={terms} onChange={(event) => setTerms(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-note">{t("fourierNote")}</div>
      <PlotCanvas
        series={[
          { id: "approx", points: approx, color: "#0b7285", label: t("fourierSeriesLabel") },
          { id: "target", points: target, color: "#9ca3af", dash: [6, 4], label: t("fourierTargetLabel") }
        ]}
        xLabel="x"
        yLabel="f(x)"
        showLegend
      />
    </div>
  );
}

