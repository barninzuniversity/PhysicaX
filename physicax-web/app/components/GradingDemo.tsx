"use client";

import { useMemo, useState } from "react";

export function GradingDemo() {
  const [correct, setCorrect] = useState("9.81");
  const [answer, setAnswer] = useState("9.8");
  const [tol, setTol] = useState("0.05");

  const { diff, pass } = useMemo(() => {
    const c = Number(correct);
    const a = Number(answer);
    const t = Number(tol);
    if (!Number.isFinite(c) || !Number.isFinite(a) || !Number.isFinite(t)) {
      return { diff: NaN, pass: false };
    }
    const d = Math.abs(c - a);
    return { diff: d, pass: d <= t };
  }, [correct, answer, tol]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Auto-Grading Demo</div>
      <div className="demo-grid">
        <label className="field">
          <span>Correct value</span>
          <input type="number" value={correct} onChange={(event) => setCorrect(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Student answer</span>
          <input type="number" value={answer} onChange={(event) => setAnswer(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Absolute tolerance</span>
          <input type="number" value={tol} onChange={(event) => setTol(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">diff = {Number.isFinite(diff) ? diff.toFixed(4) : "--"}</span>
          <span className={`pill ${pass ? "pill-good" : "pill-bad"}`}>
            {pass ? "passed" : "failed"}
          </span>
        </div>
        <div className="demo-note">{"Pass if |answer - correct| <= tolerance."}</div>
      </div>
    </div>
  );
}
