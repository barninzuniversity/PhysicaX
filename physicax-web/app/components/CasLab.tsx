"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
import { PlotCanvas } from "./PlotCanvas";
import { MathBlock } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

const math = create(all);
math.import({ ln: (value: number) => math.log(value) }, { override: true });

type CasStep = {
  label: string;
  latex?: string;
  text?: string;
};

type CasResponse = {
  result?: string;
  latex?: string;
  steps?: CasStep[];
  plots?: { x: number; y: number }[];
};

type CasEntry = {
  id: string;
  expr: string;
  op: string;
  result?: string;
  latex?: string;
  steps?: CasStep[];
  error?: string;
  timestamp: string;
};

type AssumptionFlags = {
  real?: boolean;
  positive?: boolean;
  integer?: boolean;
  nonzero?: boolean;
};

type AssumptionRow = {
  name: string;
  flags: AssumptionFlags;
};

const ops = [
  { id: "eval", label: "evaluate" },
  { id: "simplify", label: "simplify" },
  { id: "expand", label: "expand" },
  { id: "factor", label: "factor" },
  { id: "diff", label: "differentiate" },
  { id: "integrate", label: "integrate" },
  { id: "solve", label: "solve" },
  { id: "series", label: "series" },
  { id: "limit", label: "limit" },
  { id: "numeric", label: "numeric evaluate" },
  { id: "units_convert", label: "convert units" },
  { id: "det", label: "determinant" },
  { id: "rref", label: "rref" },
  { id: "eigenvals", label: "eigenvalues" },
  { id: "eigenvects", label: "eigenvectors" },
  { id: "inv", label: "inverse" },
  { id: "transpose", label: "transpose" },
  { id: "trace", label: "trace" },
  { id: "rank", label: "rank" }
];

export function CasLab() {
  const { t } = useLocale();
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<string, { resolve: (v: CasResponse) => void; reject: (e: any) => void }>());
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expr, setExpr] = useState("sin(x)^2 + cos(x)^2");
  const [op, setOp] = useState("simplify");
  const [variable, setVariable] = useState("x");
  const [order, setOrder] = useState("4");
  const [seriesPoint, setSeriesPoint] = useState("0");
  const [limitPoint, setLimitPoint] = useState("0");
  const [limitDir, setLimitDir] = useState("+");
  const [boundA, setBoundA] = useState("0");
  const [boundB, setBoundB] = useState("1");
  const [targetUnit, setTargetUnit] = useState("meter/second");
  const [solveVars, setSolveVars] = useState("x");
  const [matrixSize, setMatrixSize] = useState(2);
  const [matrixData, setMatrixData] = useState<string[]>(["1", "0", "0", "1"]);
  const [history, setHistory] = useState<CasEntry[]>([]);
  const [assumptions, setAssumptions] = useState<AssumptionRow[]>([
    { name: "x", flags: { real: true } }
  ]);
  const [assumptionVar, setAssumptionVar] = useState("");
  const [subsRows, setSubsRows] = useState<{ name: string; value: string }[]>([
    { name: "x", value: "1" }
  ]);
  const [showSteps, setShowSteps] = useState(true);

  const [plotXMin, setPlotXMin] = useState("-6");
  const [plotXMax, setPlotXMax] = useState("6");
  const [plotDataError, setPlotDataError] = useState("");
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [plotWidth, setPlotWidth] = useState(900);
  const matrixOps = new Set(["det", "rref", "eigenvals", "eigenvects", "inv", "transpose", "trace", "rank"]);

  useEffect(() => {
    const worker = new Worker("/workers/cas-worker.js");
    workerRef.current = worker;
    worker.onmessage = (event) => {
      const { id, type, payload, error } = event.data || {};
      if (type === "ready") {
        setReady(true);
        return;
      }
      const pending = pendingRef.current.get(id);
      if (!pending) return;
      if (type === "result") {
        pending.resolve(payload);
      } else {
        pending.reject(new Error(error || "CAS error"));
      }
      pendingRef.current.delete(id);
    };
    worker.postMessage({ id: "init", type: "init" });
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    const total = matrixSize * matrixSize;
    setMatrixData((prev) => {
      const next = prev.slice(0, total);
      while (next.length < total) {
        next.push("0");
      }
      return next;
    });
  }, [matrixSize]);

  useEffect(() => {
    if (!plotRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      if (width > 0) {
        setPlotWidth(Math.max(320, Math.floor(width)));
      }
    });
    observer.observe(plotRef.current);
    return () => observer.disconnect();
  }, []);

  const sendToWorker = (payload: Record<string, any>) =>
    new Promise<CasResponse>((resolve, reject) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      pendingRef.current.set(id, { resolve, reject });
      workerRef.current?.postMessage({ id, type: "run", payload });
    });

  const assumptionMap = useMemo(() => {
    const map: Record<string, AssumptionFlags> = {};
    assumptions.forEach((row) => {
      if (row.name.trim()) {
        map[row.name.trim()] = row.flags;
      }
    });
    return map;
  }, [assumptions]);

  const subsMap = useMemo(() => {
    const map: Record<string, string> = {};
    subsRows.forEach((row) => {
      if (row.name.trim()) {
        map[row.name.trim()] = row.value;
      }
    });
    return map;
  }, [subsRows]);

  const runCas = async () => {
    setLoading(true);
    const payload: Record<string, any> = {
      expr,
      op,
      var: variable || "x",
      order: Number(order) || 1,
      point: Number(seriesPoint) || 0,
      assumptions: assumptionMap,
      subs: subsMap,
      limit_dir: limitDir
    };
    if (op === "integrate") {
      payload.bounds = [Number(boundA) || 0, Number(boundB) || 1];
    }
    if (op === "units_convert") {
      payload.target = targetUnit;
    }
    if (op === "limit") {
      payload.point = Number(limitPoint) || 0;
    }
    if (op === "solve" && solveVars.trim()) {
      payload.vars = solveVars
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    try {
      const result = await sendToWorker(payload);
      const entry: CasEntry = {
        id: `${Date.now()}`,
        expr,
        op,
        result: result.result,
        latex: result.latex,
        steps: result.steps,
        timestamp: new Date().toLocaleTimeString()
      };
      setHistory((prev) => [entry, ...prev].slice(0, 18));
    } catch (error: any) {
      const entry: CasEntry = {
        id: `${Date.now()}`,
        expr,
        op,
        error: error?.message ?? "CAS error",
        timestamp: new Date().toLocaleTimeString()
      };
      setHistory((prev) => [entry, ...prev].slice(0, 18));
    } finally {
      setLoading(false);
    }
  };

  const plotCalc = useMemo(() => {
    let error = "";
    let compiled: any;
    try {
      const plotExpr = expr.replace(/\*\*/g, "^");
      compiled = math.compile(plotExpr);
    } catch {
      error = t("casPlotParseError");
      return { series: [] as any[], error };
    }
    const min = Number(plotXMin);
    const max = Number(plotXMax);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      error = t("casPlotDomainError");
      return { series: [] as any[], error };
    }
    const steps = 240;
    const dx = (max - min) / (steps - 1);
    const points = Array.from({ length: steps }, (_, i) => {
      const x = min + i * dx;
      let y = NaN;
      try {
        y = compiled.evaluate({ x });
      } catch {
        y = NaN;
      }
      return { x, y: Number.isFinite(y) ? Number(y) : NaN };
    }).filter((pt) => Number.isFinite(pt.y));
    return {
      series: [
      {
        id: "cas",
        label: "f(x)",
        points,
        color: "#2563eb"
      }
    ],
      error
    };
  }, [expr, plotXMin, plotXMax, t]);

  useEffect(() => {
    setPlotDataError(plotCalc.error);
  }, [plotCalc.error]);

  const plotSeries = plotCalc.series;

  return (
    <div className="cas-shell">
      <div className="cas-header">
        <div>
          <h2>{t("casTitle")}</h2>
          <p className="muted">{t("casSubtitle")}</p>
        </div>
        <div className="cas-status">
          <span className={`pill ${ready ? "pill-good" : "pill-bad"}`}>
            {ready ? t("casReady") : t("casLoading")}
          </span>
          <span className="pill">{t("casModeLocal")}</span>
        </div>
      </div>

      <div className="cas-grid">
        <div className="cas-card">
          <h3>{t("casEditor")}</h3>
          <label className="field">
            {t("casExpression")}
            <textarea value={expr} onChange={(e) => setExpr(e.target.value)} rows={4} />
          </label>
          <div className="cas-row">
            <label className="field">
              {t("casOperation")}
              <select value={op} onChange={(e) => setOp(e.target.value)}>
                {ops.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              {t("casVariable")}
              <input value={variable} onChange={(e) => setVariable(e.target.value)} />
            </label>
          </div>

          {op === "solve" && (
            <label className="field">
              {t("casSolveVars")}
              <input value={solveVars} onChange={(e) => setSolveVars(e.target.value)} />
            </label>
          )}

          {op === "diff" && (
            <label className="field">
              {t("casOrder")}
              <input value={order} onChange={(e) => setOrder(e.target.value)} />
            </label>
          )}
          {op === "series" && (
            <div className="cas-row">
              <label className="field">
                {t("casSeriesPoint")}
                <input value={seriesPoint} onChange={(e) => setSeriesPoint(e.target.value)} />
              </label>
              <label className="field">
                {t("casOrder")}
                <input value={order} onChange={(e) => setOrder(e.target.value)} />
              </label>
            </div>
          )}
          {op === "limit" && (
            <div className="cas-row">
              <label className="field">
                {t("casLimitPoint")}
                <input value={limitPoint} onChange={(e) => setLimitPoint(e.target.value)} />
              </label>
              <label className="field">
                {t("casLimitDir")}
                <select value={limitDir} onChange={(e) => setLimitDir(e.target.value)}>
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="+-">±</option>
                </select>
              </label>
            </div>
          )}
          {op === "integrate" && (
            <div className="cas-row">
              <label className="field">
                {t("casBoundA")}
                <input value={boundA} onChange={(e) => setBoundA(e.target.value)} />
              </label>
              <label className="field">
                {t("casBoundB")}
                <input value={boundB} onChange={(e) => setBoundB(e.target.value)} />
              </label>
            </div>
          )}
          {op === "units_convert" && (
            <label className="field">
              {t("casTargetUnit")}
              <input value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} />
            </label>
          )}
          {matrixOps.has(op) && (
            <div className="panel-block">
              <h4>{t("casMatrixBuilder")}</h4>
              <label className="field">
                {t("casMatrixSize")}
                <select value={matrixSize} onChange={(e) => setMatrixSize(Number(e.target.value))}>
                  <option value={2}>2x2</option>
                  <option value={3}>3x3</option>
                </select>
              </label>
              <div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${matrixSize}, 1fr)` }}>
                {matrixData.map((cell, idx) => (
                  <input
                    key={`cell-${idx}`}
                    className="matrix-cell"
                    value={cell}
                    onChange={(e) =>
                      setMatrixData((prev) => prev.map((item, i) => (i === idx ? e.target.value : item)))
                    }
                  />
                ))}
              </div>
              <button
                className="ghost"
                onClick={() => {
                  const rows: string[] = [];
                  for (let r = 0; r < matrixSize; r += 1) {
                    const row = matrixData.slice(r * matrixSize, r * matrixSize + matrixSize);
                    rows.push(`[${row.join(", ")}]`);
                  }
                  setExpr(`Matrix([${rows.join(", ")}])`);
                }}
              >
                {t("casMatrixInsert")}
              </button>
              <p className="muted">{t("casMatrixHint")}</p>
            </div>
          )}

          <button className="primary" onClick={runCas} disabled={!ready || loading}>
            {loading ? t("casRunning") : t("casRun")}
          </button>
          <div className="cas-row">
            <label className="chip">
              <input type="checkbox" checked={showSteps} onChange={(e) => setShowSteps(e.target.checked)} />
              {showSteps ? t("casShowSteps") : t("casHideSteps")}
            </label>
          </div>
          <p className="muted">{t("casHint")}</p>
        </div>

        <div className="cas-card">
          <h3>{t("casAssumptions")}</h3>
          {assumptions.map((row, idx) => (
            <div key={`${row.name}-${idx}`} className="cas-assumption-row">
              <input
                value={row.name}
                onChange={(e) =>
                  setAssumptions((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item))
                  )
                }
              />
              {(["real", "positive", "integer", "nonzero"] as const).map((flag) => (
                <label key={flag} className="chip">
                  <input
                    type="checkbox"
                    checked={Boolean(row.flags[flag])}
                    onChange={(e) =>
                      setAssumptions((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, flags: { ...item.flags, [flag]: e.target.checked } } : item
                        )
                      )
                    }
                  />
                  {flag}
                </label>
              ))}
            </div>
          ))}
          <div className="cas-row">
            <input
              value={assumptionVar}
              placeholder={t("casAssumptionVar")}
              onChange={(e) => setAssumptionVar(e.target.value)}
            />
            <button
              className="ghost"
              onClick={() => {
                if (!assumptionVar.trim()) return;
                setAssumptions((prev) => [...prev, { name: assumptionVar.trim(), flags: { real: true } }]);
                setAssumptionVar("");
              }}
            >
              {t("casAddVar")}
            </button>
          </div>
          <div className="cas-divider" />
          <h3>{t("casSubstitutions")}</h3>
          {subsRows.map((row, idx) => (
            <div key={`${row.name}-${idx}`} className="cas-row">
              <input
                value={row.name}
                onChange={(e) =>
                  setSubsRows((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item))
                  )
                }
              />
              <input
                value={row.value}
                onChange={(e) =>
                  setSubsRows((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item))
                  )
                }
              />
              <button className="ghost" onClick={() => setSubsRows((prev) => prev.filter((_, i) => i !== idx))}>
                {t("casRemoveVar")}
              </button>
            </div>
          ))}
          <button className="ghost" onClick={() => setSubsRows((prev) => [...prev, { name: "", value: "" }])}>
            {t("casAddVar")}
          </button>
        </div>

        <div className="cas-card cas-output">
          <h3>{t("casOutput")}</h3>
          {history[0]?.error ? (
            <div className="pill pill-bad">{history[0].error}</div>
          ) : (
            <>
              <div className="cas-output-row">
                <div className="mono">{history[0]?.result ?? "-"}</div>
              </div>
              <div className="cas-row">
                <button
                  className="ghost"
                  onClick={() => navigator.clipboard?.writeText(history[0]?.result ?? "")}
                >
                  {t("casCopyResult")}
                </button>
                <button
                  className="ghost"
                  onClick={() => history[0]?.result && setExpr(history[0].result)}
                >
                  {t("casUseResult")}
                </button>
              </div>
              {history[0]?.latex ? <MathBlock latex={history[0].latex ?? ""} /> : null}
              {showSteps && (
                <div className="cas-steps">
                  <div className="cas-steps-title">{t("casSteps")}</div>
                  <ul>
                    {(history[0]?.steps ?? []).map((step, idx) => (
                      <li key={`${step.label}-${idx}`}>
                        <strong>{step.label}</strong>
                        {step.latex ? <MathBlock latex={step.latex} /> : null}
                        {!step.latex ? <div className="mono">{step.text}</div> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="cas-card cas-plot" ref={plotRef}>
        <div className="cas-row">
          <h3>{t("casPlot")}</h3>
          <div className="cas-row">
            <label className="field">
              {t("casPlotXMin")}
              <input value={plotXMin} onChange={(e) => setPlotXMin(e.target.value)} />
            </label>
            <label className="field">
              {t("casPlotXMax")}
              <input value={plotXMax} onChange={(e) => setPlotXMax(e.target.value)} />
            </label>
          </div>
        </div>
        {plotDataError ? <div className="pill pill-bad">{plotDataError}</div> : null}
        {plotSeries.length ? <PlotCanvas series={plotSeries} width={plotWidth} height={360} /> : null}
      </div>

        <div className="cas-card">
          <h3>{t("casHistory")}</h3>
          <div className="cas-history">
            {history.map((entry) => (
            <div
              key={entry.id}
              className="cas-history-item"
              onClick={() => {
                setExpr(entry.expr);
                setOp(entry.op);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setExpr(entry.expr);
                  setOp(entry.op);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="mono">{entry.expr}</div>
              <div className="muted">{entry.op}</div>
              <div className="muted">{entry.timestamp}</div>
            </div>
          ))}
          </div>
        </div>
    </div>
  );
}
