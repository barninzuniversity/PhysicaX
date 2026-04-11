"use client";

import { useMemo, useState, type ReactNode } from "react";
import { create, all } from "mathjs";
import { PlotCanvas } from "./PlotCanvas";
import { useLocale } from "./LocaleProvider";

const math = create(all);

type EquationWorkbenchProps = {
  title?: ReactNode;
  equation: string;
  paramDefaults: Record<string, number>;
  mode?: "first" | "second";
  y0?: number;
  v0?: number;
  tMax?: number;
  dt?: number;
  yLabel?: string;
};

type SolveResult = {
  points: { x: number; y: number }[];
  vPoints: { x: number; y: number }[];
  summary: { max: number; min: number; period: number | null };
  error?: string;
};

export function EquationWorkbench({
  title,
  equation,
  paramDefaults,
  mode = "second",
  y0 = 1,
  v0 = 0,
  tMax = 20,
  dt = 0.01,
  yLabel = "y"
}: EquationWorkbenchProps) {
  const [expr, setExpr] = useState(equation);
  const [paramText, setParamText] = useState(JSON.stringify(paramDefaults, null, 2));
  const [y0Text, setY0Text] = useState(String(y0));
  const [v0Text, setV0Text] = useState(String(v0));
  const [tMaxText, setTMaxText] = useState(String(tMax));
  const [dtText, setDtText] = useState(String(dt));
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();
  const resolvedTitle = title ?? t("equationWorkbenchTitle");

  const result = useMemo<SolveResult>(() => {
    const y0Val = Number(y0Text);
    const v0Val = Number(v0Text);
    const tMaxVal = Number(tMaxText);
    const dtVal = Number(dtText);
    if (!Number.isFinite(y0Val) || !Number.isFinite(v0Val) || !Number.isFinite(tMaxVal) || !Number.isFinite(dtVal)) {
      return { points: [], vPoints: [], summary: { max: NaN, min: NaN, period: null }, error: t("equationWorkbenchInvalidInputs") };
    }
    if (dtVal <= 0 || tMaxVal <= 0) {
      return { points: [], vPoints: [], summary: { max: NaN, min: NaN, period: null }, error: t("equationWorkbenchPositive") };
    }
    let params: Record<string, number> = {};
    try {
      params = JSON.parse(paramText);
    } catch {
      return { points: [], vPoints: [], summary: { max: NaN, min: NaN, period: null }, error: t("equationWorkbenchParamsInvalid") };
    }

    const accel = (time: number, y: number, v: number) => {
      try {
        const scope = { t: time, y, v, ...params };
        const value = math.evaluate(expr, scope);
        return Number(value);
      } catch {
        return NaN;
      }
    };

    let y = y0Val;
    let v = v0Val;
    let time = 0;
    const pts: { x: number; y: number }[] = [];
    const vPts: { x: number; y: number }[] = [];
    const zeros: number[] = [];
    let lastY = y;

    const steps = Math.min(8000, Math.floor(tMaxVal / dtVal));
    for (let i = 0; i <= steps; i += 1) {
      pts.push({ x: time, y });
      vPts.push({ x: time, y: v });
      if (i > 0 && lastY <= 0 && y > 0) {
        zeros.push(time);
      }
      lastY = y;

      if (mode === "first") {
        const k1 = accel(time, y, v);
        const k2 = accel(time + 0.5 * dtVal, y + 0.5 * dtVal * k1, v);
        const k3 = accel(time + 0.5 * dtVal, y + 0.5 * dtVal * k2, v);
        const k4 = accel(time + dtVal, y + dtVal * k3, v);
        if (![k1, k2, k3, k4].every(Number.isFinite)) {
          return {
            points: [],
            vPoints: [],
            summary: { max: NaN, min: NaN, period: null },
            error: t("equationWorkbenchDerivativeError")
          };
        }
        const dy = (dtVal / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        y += dy;
        v = dy / dtVal;
      } else {
        const k1y = v;
        const k1v = accel(time, y, v);
        const k2y = v + 0.5 * dtVal * k1v;
        const k2v = accel(time + 0.5 * dtVal, y + 0.5 * dtVal * k1y, v + 0.5 * dtVal * k1v);
        const k3y = v + 0.5 * dtVal * k2v;
        const k3v = accel(time + 0.5 * dtVal, y + 0.5 * dtVal * k2y, v + 0.5 * dtVal * k2v);
        const k4y = v + dtVal * k3v;
        const k4v = accel(time + dtVal, y + dtVal * k3y, v + dtVal * k3v);

        if (![k1v, k2v, k3v, k4v].every(Number.isFinite)) {
          return {
            points: [],
            vPoints: [],
            summary: { max: NaN, min: NaN, period: null },
            error: t("equationWorkbenchAccelerationError")
          };
        }

        y += (dtVal / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
        v += (dtVal / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      }
      time += dtVal;
    }

    const values = pts.map((p) => p.y);
    const max = Math.max(...values);
    const min = Math.min(...values);
    let period: number | null = null;
    if (zeros.length >= 2) {
      const diffs = zeros.slice(1).map((z, idx) => z - zeros[idx]);
      const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      period = Number.isFinite(mean) ? mean : null;
    }
    return { points: pts, vPoints: vPts, summary: { max, min, period } };
  }, [expr, paramText, y0Text, v0Text, tMaxText, dtText, t]);

  const summary = result.summary;

  return (
    <div className="demo-panel">
      <div className="demo-title">{resolvedTitle}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{mode === "first" ? t("equationWorkbenchFirst") : t("equationWorkbenchSecond")}</span>
          <input type="text" value={expr} onChange={(event) => setExpr(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("equationWorkbenchY0")}</span>
          <input type="number" value={y0Text} onChange={(event) => setY0Text(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("equationWorkbenchV0")}</span>
          <input type="number" value={v0Text} onChange={(event) => setV0Text(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("equationWorkbenchTmax")}</span>
          <input type="number" value={tMaxText} onChange={(event) => setTMaxText(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("equationWorkbenchDt")}</span>
          <input type="number" value={dtText} onChange={(event) => setDtText(event.target.value)} step="any" />
        </label>
      </div>
      <label className="field" style={{ marginTop: "12px" }}>
        <span>{t("equationWorkbenchParams")}</span>
        <textarea value={paramText} onChange={(event) => setParamText(event.target.value)} rows={4} />
      </label>
      <div className="demo-output">
        {result.error ? <div className="pill pill-bad">{result.error}</div> : null}
        {!result.error ? (
          <div className="inline-kv">
            <span className="pill">{t("equationWorkbenchMax")} {Number.isFinite(summary.max) ? summary.max.toFixed(3) : "--"}</span>
            <span className="pill">{t("equationWorkbenchMin")} {Number.isFinite(summary.min) ? summary.min.toFixed(3) : "--"}</span>
            <span className="pill">{t("equationWorkbenchPeriod")} {summary.period ? summary.period.toFixed(3) : "--"} s</span>
          </div>
        ) : null}
        <div className="demo-note">
          {t("equationWorkbenchVariables")}
          {mode === "second" ? t("equationWorkbenchVariablesSecond") : t("equationWorkbenchVariablesFirst")}
        </div>
      </div>
      {result.points.length ? (
        <div className="demo-stack">
          <PlotCanvas series={[{ id: "y", points: result.points, color: "#2563eb", label: yLabel }]} xLabel="t" yLabel={yLabel} showLegend />
          <PlotCanvas series={[{ id: "v", points: result.vPoints, color: "#d97706", label: "v(t)" }]} xLabel="t" yLabel="v" showLegend />
        </div>
      ) : null}
    </div>
  );
}
