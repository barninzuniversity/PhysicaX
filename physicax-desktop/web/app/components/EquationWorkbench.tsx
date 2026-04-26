"use client";

import { useMemo, useState, type ReactNode } from "react";
import { create, all } from "mathjs";
import { PlotCanvas } from "./PlotCanvas";
import { useLocale } from "./LocaleProvider";

const math = create(all);

type EquationParameterDetail = {
  key: string;
  label: string;
  unit?: string;
  description: string;
};

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
  equationRole?: string;
  equationSummary?: string;
  parameterDetails?: EquationParameterDetail[];
  assumptions?: string[];
  validationHints?: string[];
  escalationHint?: string;
};

type SolveResult = {
  points: { x: number; y: number }[];
  vPoints: { x: number; y: number }[];
  summary: { max: number; min: number; period: number | null };
  params: Record<string, number>;
  diagnostics: {
    solverLabel: string;
    requestedSteps: number;
    simulatedSteps: number;
    dt: number;
    tMax: number;
    zeroCrossings: number;
    capped: boolean;
  };
  warnings: string[];
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
  yLabel = "y",
  equationRole,
  equationSummary,
  parameterDetails,
  assumptions,
  validationHints,
  escalationHint
}: EquationWorkbenchProps) {
  const [expr, setExpr] = useState(equation);
  const [paramText, setParamText] = useState(JSON.stringify(paramDefaults, null, 2));
  const [y0Text, setY0Text] = useState(String(y0));
  const [v0Text, setV0Text] = useState(String(v0));
  const [tMaxText, setTMaxText] = useState(String(tMax));
  const [dtText, setDtText] = useState(String(dt));
  const { t } = useLocale();
  const resolvedTitle = title ?? t("equationWorkbenchTitle");

  const result = useMemo<SolveResult>(() => {
    const y0Val = Number(y0Text);
    const v0Val = Number(v0Text);
    const tMaxVal = Number(tMaxText);
    const dtVal = Number(dtText);
    const solverLabel = mode === "first" ? "RK4 / first-order state" : "RK4 / second-order state";
    const emptyDiagnostics = {
      solverLabel,
      requestedSteps: 0,
      simulatedSteps: 0,
      dt: dtVal,
      tMax: tMaxVal,
      zeroCrossings: 0,
      capped: false
    };

    if (!Number.isFinite(y0Val) || !Number.isFinite(v0Val) || !Number.isFinite(tMaxVal) || !Number.isFinite(dtVal)) {
      return {
        points: [],
        vPoints: [],
        summary: { max: NaN, min: NaN, period: null },
        params: {},
        diagnostics: emptyDiagnostics,
        warnings: [],
        error: t("equationWorkbenchInvalidInputs")
      };
    }

    if (dtVal <= 0 || tMaxVal <= 0) {
      return {
        points: [],
        vPoints: [],
        summary: { max: NaN, min: NaN, period: null },
        params: {},
        diagnostics: emptyDiagnostics,
        warnings: [],
        error: t("equationWorkbenchPositive")
      };
    }

    let params: Record<string, number> = {};
    try {
      const parsed = JSON.parse(paramText) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("invalid");
      }
      params = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, Number(value)]));
      if (Object.values(params).some((value) => !Number.isFinite(value))) {
        throw new Error("invalid");
      }
    } catch {
      return {
        points: [],
        vPoints: [],
        summary: { max: NaN, min: NaN, period: null },
        params: {},
        diagnostics: emptyDiagnostics,
        warnings: [],
        error: t("equationWorkbenchParamsInvalid")
      };
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

    const requestedSteps = Math.max(1, Math.floor(tMaxVal / dtVal));
    const steps = Math.min(8000, requestedSteps);

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
            params,
            diagnostics: {
              solverLabel,
              requestedSteps,
              simulatedSteps: i,
              dt: dtVal,
              tMax: tMaxVal,
              zeroCrossings: zeros.length,
              capped: requestedSteps > steps
            },
            warnings: [],
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
            params,
            diagnostics: {
              solverLabel,
              requestedSteps,
              simulatedSteps: i,
              dt: dtVal,
              tMax: tMaxVal,
              zeroCrossings: zeros.length,
              capped: requestedSteps > steps
            },
            warnings: [],
            error: t("equationWorkbenchAccelerationError")
          };
        }

        y += (dtVal / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
        v += (dtVal / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      }
      time += dtVal;
    }

    const values = pts.map((point) => point.y);
    const max = Math.max(...values);
    const min = Math.min(...values);
    let period: number | null = null;
    if (zeros.length >= 2) {
      const diffs = zeros.slice(1).map((zero, index) => zero - zeros[index]);
      const mean = diffs.reduce((left, right) => left + right, 0) / diffs.length;
      period = Number.isFinite(mean) ? mean : null;
    }

    const warnings: string[] = [];
    if (requestedSteps > 8000) {
      warnings.push("The requested run exceeded 8,000 integration steps, so the time horizon was capped for responsiveness.");
    }
    if (requestedSteps < 120) {
      warnings.push("This run uses fewer than 120 integration steps, so extrema and phase cues are only rough guidance.");
    }
    if (dtVal > tMaxVal / 120) {
      warnings.push("dt is coarse relative to the total window. Reduce dt if you need cleaner extrema or period estimates.");
    }
    if (period === null && zeros.length < 2 && pts.length > 40) {
      warnings.push("A stable period could not be estimated yet. Increase tMax or reduce damping/forcing ambiguity before trusting timing claims.");
    }
    if (mode === "first") {
      warnings.push("Velocity is derived from the first-order update, so use the velocity trace as a reading aid rather than a separately validated state.");
    }

    return {
      points: pts,
      vPoints: vPts,
      summary: { max, min, period },
      params,
      diagnostics: {
        solverLabel,
        requestedSteps,
        simulatedSteps: steps,
        dt: dtVal,
        tMax: tMaxVal,
        zeroCrossings: zeros.length,
        capped: requestedSteps > steps
      },
      warnings
    };
  }, [dtText, expr, mode, paramText, t, tMaxText, v0Text, y0Text]);

  const summary = result.summary;
  const parameterReadout = useMemo(() => {
    const currentParams = result.params;
    const describedKeys = new Set((parameterDetails ?? []).map((detail) => detail.key));
    const described = (parameterDetails ?? []).map((detail) => ({
      ...detail,
      value: currentParams[detail.key]
    }));
    const extras = Object.entries(currentParams)
      .filter(([key]) => !describedKeys.has(key))
      .map(([key, value]) => ({
        key,
        label: key,
        unit: undefined,
        description: "Custom parameter from the live JSON block.",
        value
      }));
    return [...described, ...extras];
  }, [parameterDetails, result.params]);
  const solverCues = [
    result.diagnostics.solverLabel,
    `dt = ${Number.isFinite(result.diagnostics.dt) ? result.diagnostics.dt.toPrecision(3) : "--"}`,
    `tMax = ${Number.isFinite(result.diagnostics.tMax) ? result.diagnostics.tMax.toPrecision(3) : "--"}`,
    `steps = ${result.diagnostics.simulatedSteps}`,
    `period = ${summary.period ? summary.period.toFixed(3) : "unresolved"}`
  ];

  return (
    <div className="demo-panel equation-workbench-panel">
      <div className="demo-title">{resolvedTitle}</div>
      <div className="equation-workbench-controls">
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
        <label className="field equation-workbench-params">
          <span>{t("equationWorkbenchParams")}</span>
          <textarea value={paramText} onChange={(event) => setParamText(event.target.value)} rows={5} />
        </label>
      </div>

      <div className="equation-workbench-readout">
        <div className="model-grid">
          <div className="model-card">
            <h3>Model readout</h3>
            {equationSummary ? <p className="demo-note">{equationSummary}</p> : null}
            <div className="code-block compact equation-workbench-code">
              <pre>
                <code>{expr}</code>
              </pre>
            </div>
            {equationRole ? <p className="demo-note">{equationRole}</p> : null}
            <div className="pill-grid">
              {solverCues.map((cue) => (
                <span key={cue} className="pill">
                  {cue}
                </span>
              ))}
            </div>
          </div>

          <div className="model-card">
            <h3>Parameter roles</h3>
            {parameterReadout.length ? (
              <div className="equation-workbench-param-grid">
                {parameterReadout.map((detail) => (
                  <div key={detail.key} className="equation-workbench-param-card">
                    <div className="equation-workbench-param-head">
                      <strong>{detail.label}</strong>
                      <span className="pill">
                        {Number.isFinite(detail.value) ? Number(detail.value).toPrecision(4) : "--"}
                        {detail.unit ? ` ${detail.unit}` : ""}
                      </span>
                    </div>
                    <div className="demo-note">{detail.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="demo-note">Add parameters in the JSON block to explain the model in domain-specific terms.</p>
            )}
          </div>

          <div className="model-card">
            <h3>Trust cues</h3>
            <ul className="feature-list">
              <li>
                Use smaller <span className="mono">dt</span> values when extrema, resonance timing, or phase comparisons
                matter.
              </li>
              <li>
                Make sure <span className="mono">tMax</span> is long enough to show at least two comparable cycles before
                leaning on the period estimate.
              </li>
              <li>
                The current run detected {result.diagnostics.zeroCrossings} upward zero-crossing
                {result.diagnostics.zeroCrossings === 1 ? "" : "s"}.
              </li>
              {result.diagnostics.capped ? (
                <li>The current horizon was capped to keep the browser responsive. Shorten the run or reduce scope for higher fidelity.</li>
              ) : null}
            </ul>
          </div>

          <div className="model-card">
            <h3>Assumptions and next step</h3>
            {assumptions?.length ? (
              <ul className="feature-list">
                {assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="demo-note">Treat the editable equation as a reasoning layer. Validate it against the dedicated simulator beside this workbench.</p>
            )}
            {validationHints?.length ? (
              <>
                <div className="demo-note equation-workbench-subhead">Validation notes</div>
                <ul className="feature-list">
                  {validationHints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {escalationHint ? (
              <>
                <div className="demo-note equation-workbench-subhead">Recommended escalation</div>
                <p className="demo-note">{escalationHint}</p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="demo-output">
        {result.error ? <div className="pill pill-bad">{result.error}</div> : null}
        {!result.error ? (
          <div className="inline-kv">
            <span className="pill">
              {t("equationWorkbenchMax")} {Number.isFinite(summary.max) ? summary.max.toFixed(3) : "--"}
            </span>
            <span className="pill">
              {t("equationWorkbenchMin")} {Number.isFinite(summary.min) ? summary.min.toFixed(3) : "--"}
            </span>
            <span className="pill">
              {t("equationWorkbenchPeriod")} {summary.period ? summary.period.toFixed(3) : "--"} s
            </span>
          </div>
        ) : null}
        {!result.error && result.warnings.length ? (
          <div className="equation-workbench-warning-stack">
            {result.warnings.map((warning) => (
              <div key={warning} className="pill pill-bad equation-workbench-warning">
                {warning}
              </div>
            ))}
          </div>
        ) : null}
        <div className="demo-note">
          {t("equationWorkbenchVariables")}
          {mode === "second" ? t("equationWorkbenchVariablesSecond") : t("equationWorkbenchVariablesFirst")}
        </div>
      </div>

      {result.points.length ? (
        <div className="demo-stack">
          <PlotCanvas
            series={[{ id: "y", points: result.points, color: "#2563eb", label: yLabel }]}
            xLabel="t"
            yLabel={yLabel}
            showLegend
          />
          <PlotCanvas
            series={[{ id: "v", points: result.vPoints, color: "#d97706", label: "v(t)" }]}
            xLabel="t"
            yLabel="v"
            showLegend
          />
        </div>
      ) : null}
    </div>
  );
}
