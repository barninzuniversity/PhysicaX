"use client";

import { useMemo, useState } from "react";

export function BatchEstimatorDemo() {
  const [stepsA, setStepsA] = useState("10");
  const [stepsB, setStepsB] = useState("12");
  const [rep, setRep] = useState("1");
  const [runtime, setRuntime] = useState("0.4");

  const { runs, timeSec, timeMin } = useMemo(() => {
    const a = Math.max(1, Math.floor(Number(stepsA)));
    const b = Math.max(1, Math.floor(Number(stepsB)));
    const r = Math.max(1, Math.floor(Number(rep)));
    const t = Number(runtime);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(r) || !Number.isFinite(t)) {
      return { runs: NaN, timeSec: NaN, timeMin: NaN };
    }
    const total = a * b * r;
    const seconds = total * t;
    return { runs: total, timeSec: seconds, timeMin: seconds / 60 };
  }, [stepsA, stepsB, rep, runtime]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Batch Sweep Estimator</div>
      <div className="demo-grid">
        <label className="field">
          <span>Param A steps</span>
          <input type="number" value={stepsA} onChange={(event) => setStepsA(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>Param B steps</span>
          <input type="number" value={stepsB} onChange={(event) => setStepsB(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>Replicates</span>
          <input type="number" value={rep} onChange={(event) => setRep(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>Avg runtime (s)</span>
          <input type="number" value={runtime} onChange={(event) => setRuntime(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">runs = {Number.isFinite(runs) ? runs : "--"}</span>
          <span className="pill">time = {Number.isFinite(timeSec) ? timeSec.toFixed(1) : "--"} s</span>
          <span className="pill">time = {Number.isFinite(timeMin) ? timeMin.toFixed(2) : "--"} min</span>
        </div>
        <div className="demo-note">Total runs = stepsA * stepsB * replicates.</div>
      </div>
    </div>
  );
}
