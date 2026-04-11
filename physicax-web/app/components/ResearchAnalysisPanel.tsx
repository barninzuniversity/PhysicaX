"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { useLocale } from "./LocaleProvider";

const parseSeries = (input: string) => {
  try {
    const data = JSON.parse(input);
    if (Array.isArray(data)) {
      if (data.length === 0) return [] as number[];
      if (typeof data[0] === "number") {
        return data.filter((v) => Number.isFinite(Number(v))).map(Number);
      }
      if (Array.isArray(data[0])) {
        return (data as Array<any[]>).map((row) => Number(row[1] ?? row[0])).filter((v) => Number.isFinite(v));
      }
    }
  } catch {
    // ignore
  }
  return [] as number[];
};

const stats = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  return { mean, std, min: sorted[0], max: sorted[sorted.length - 1], median };
};

const peakCount = (values: number[]) => {
  let peaks = 0;
  for (let i = 1; i < values.length - 1; i += 1) {
    if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
      peaks += 1;
    }
  }
  return peaks;
};

const convergenceCheck = (values: number[]) => {
  if (values.length < 8) return null;
  const slice = Math.max(3, Math.floor(values.length * 0.1));
  const tail = values.slice(-slice);
  const prev = values.slice(-slice * 2, -slice);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const tailMean = avg(tail);
  const prevMean = avg(prev);
  const delta = Math.abs(tailMean - prevMean);
  return { tailMean, prevMean, delta };
};

export function ResearchAnalysisPanel() {
  const [seriesInput, setSeriesInput] = useState("[1,1.1,1.05,1.02,1.01,1.005,1.002]");
  const [threshold, setThreshold] = useState("1000");
  const { t } = useLocale();

  const values = useMemo(() => parseSeries(seriesInput), [seriesInput]);
  const summary = useMemo(() => stats(values), [values]);
  const peaks = useMemo(() => peakCount(values), [values]);
  const convergence = useMemo(() => convergenceCheck(values), [values]);
  const unstable = useMemo(() => {
    const limit = Number(threshold);
    if (!Number.isFinite(limit)) return false;
    return values.some((v) => Math.abs(v) > limit);
  }, [values, threshold]);

  const plotSeries = values.map((y, idx) => ({ x: idx, y }));

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("researchAnalysisTitle")}</div>
      <label className="field">
        <span>{t("researchAnalysisSeriesLabel")}</span>
        <textarea rows={4} value={seriesInput} onChange={(event) => setSeriesInput(event.target.value)} />
      </label>
      <div className="demo-grid">
        <label className="field">
          <span>{t("researchAnalysisThreshold")}</span>
          <input value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" step="any" />
        </label>
      </div>
      <div className="demo-output">
        {summary ? (
          <div className="inline-kv">
            <span className="pill">{t("researchAnalysisMean")} {summary.mean.toFixed(4)}</span>
            <span className="pill">{t("researchAnalysisStd")} {summary.std.toFixed(4)}</span>
            <span className="pill">{t("researchAnalysisMin")} {summary.min.toFixed(4)}</span>
            <span className="pill">{t("researchAnalysisMax")} {summary.max.toFixed(4)}</span>
            <span className="pill">{t("researchAnalysisMedian")} {summary.median.toFixed(4)}</span>
            <span className={`pill ${unstable ? "pill-bad" : "pill-good"}`}>
              {unstable ? t("researchAnalysisDiverging") : t("researchAnalysisStable")}
            </span>
            <span className="pill">{t("researchAnalysisPeaks")} {peaks}</span>
          </div>
        ) : (
          <div className="demo-note">{t("researchAnalysisEmpty")}</div>
        )}
        {convergence ? (
          <div className="demo-note">
            {t("researchAnalysisConvergence")}
            {` ${convergence.tailMean.toFixed(4)} `}
            {t("researchAnalysisConvergenceVs")}
            {` ${convergence.prevMean.toFixed(4)} `}
            {t("researchAnalysisConvergenceDelta")}
            {` ${convergence.delta.toFixed(5)})`}
          </div>
        ) : null}
      </div>
      {plotSeries.length ? (
        <PlotCanvas
          series={[{ id: "series", points: plotSeries, color: "#2563eb", label: t("researchAnalysisSeriesLabel") }]}
          xLabel={t("researchAnalysisIndex")}
          yLabel={t("researchAnalysisValue")}
          showLegend
        />
      ) : null}
    </div>
  );
}
