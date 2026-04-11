"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type Mode = "motion1d" | "intercept" | "launch" | "relative" | "parametric";

export function KinematicsSuiteSim() {
  const [mode, setMode] = useState<Mode>("motion1d");
  const [x0, setX0] = useState("0");
  const [v0, setV0] = useState("10");
  const [a, setA] = useState("0");
  const [tMax, setTMax] = useState("5");
  const [targetX, setTargetX] = useState("100");
  const [targetY, setTargetY] = useState("20");
  const [targetVx, setTargetVx] = useState("-5");
  const [targetVy, setTargetVy] = useState("0");
  const [projSpeed, setProjSpeed] = useState("25");
  const [range, setRange] = useState("50");
  const [relX1, setRelX1] = useState("0");
  const [relV1, setRelV1] = useState("4");
  const [relX2, setRelX2] = useState("20");
  const [relV2, setRelV2] = useState("-1");
  const [ampX, setAmpX] = useState("1");
  const [ampY, setAmpY] = useState("0.6");
  const [omega, setOmega] = useState("2");

  const result = useMemo(() => {
    const tMaxVal = Math.max(0.1, Number(tMax));
    const steps = 120;
    const xs: { x: number; y: number }[] = [];
    const vs: { x: number; y: number }[] = [];
    const path: { x: number; y: number }[] = [];
    let summary = "";

    if (mode === "motion1d") {
      const x0Val = Number(x0);
      const v0Val = Number(v0);
      const aVal = Number(a);
      for (let i = 0; i <= steps; i += 1) {
        const t = (tMaxVal * i) / steps;
        const x = x0Val + v0Val * t + 0.5 * aVal * t * t;
        const v = v0Val + aVal * t;
        xs.push({ x: t, y: x });
        vs.push({ x: t, y: v });
      }
      summary = `x(t)=x0+v0 t+0.5 a t^2`;
    }

    if (mode === "relative") {
      const x1Val = Number(relX1);
      const v1Val = Number(relV1);
      const x2Val = Number(relX2);
      const v2Val = Number(relV2);
      for (let i = 0; i <= steps; i += 1) {
        const t = (tMaxVal * i) / steps;
        xs.push({ x: t, y: x1Val + v1Val * t - (x2Val + v2Val * t) });
      }
      summary = "Relative position Δx(t)";
    }

    if (mode === "parametric") {
      const aX = Number(ampX);
      const aY = Number(ampY);
      const w = Number(omega);
      for (let i = 0; i <= steps; i += 1) {
        const t = (tMaxVal * i) / steps;
        const x = aX * Math.cos(w * t);
        const y = aY * Math.sin(w * t);
        path.push({ x, y });
      }
      summary = "Parametric path (Lissajous)";
    }

    let interceptTime = NaN;
    if (mode === "intercept") {
      const tx = Number(targetX);
      const ty = Number(targetY);
      const tvx = Number(targetVx);
      const tvy = Number(targetVy);
      const speed = Math.max(1e-3, Number(projSpeed));
      const aTerm = tvx * tvx + tvy * tvy - speed * speed;
      const bTerm = 2 * (tx * tvx + ty * tvy);
      const cTerm = tx * tx + ty * ty;
      const disc = bTerm * bTerm - 4 * aTerm * cTerm;
      if (disc >= 0) {
        const t1 = (-bTerm - Math.sqrt(disc)) / (2 * aTerm);
        const t2 = (-bTerm + Math.sqrt(disc)) / (2 * aTerm);
        interceptTime = Math.min(t1 > 0 ? t1 : Infinity, t2 > 0 ? t2 : Infinity);
        if (!Number.isFinite(interceptTime)) {
          interceptTime = NaN;
        }
      }
      if (Number.isFinite(interceptTime)) {
        const ix = tx + tvx * interceptTime;
        const iy = ty + tvy * interceptTime;
        path.push({ x: 0, y: 0 }, { x: ix, y: iy });
      }
      summary = "Target interception line";
    }

    let launchAngles: number[] = [];
    if (mode === "launch") {
      const R = Number(range);
      const v = Number(projSpeed);
      const g = 9.81;
      const disc = 1 - (g * R) / (v * v);
      if (disc >= 0) {
        const theta1 = 0.5 * Math.asin((g * R) / (v * v));
        const theta2 = Math.PI / 2 - theta1;
        launchAngles = [theta1, theta2].map((t) => (t * 180) / Math.PI);
      }
      summary = "Launch angle solutions";
    }

    return { xs, vs, path, summary, interceptTime, launchAngles };
  }, [
    mode,
    x0,
    v0,
    a,
    tMax,
    targetX,
    targetY,
    targetVx,
    targetVy,
    projSpeed,
    range,
    relX1,
    relV1,
    relX2,
    relV2,
    ampX,
    ampY,
    omega
  ]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Kinematics Suite</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "motion1d" ? "active" : ""}`} onClick={() => setMode("motion1d")}>
          1D Motion
        </button>
        <button type="button" className={`control-chip ${mode === "intercept" ? "active" : ""}`} onClick={() => setMode("intercept")}>
          Target Intercept
        </button>
        <button type="button" className={`control-chip ${mode === "launch" ? "active" : ""}`} onClick={() => setMode("launch")}>
          Launch Optimize
        </button>
        <button type="button" className={`control-chip ${mode === "relative" ? "active" : ""}`} onClick={() => setMode("relative")}>
          Relative Motion
        </button>
        <button type="button" className={`control-chip ${mode === "parametric" ? "active" : ""}`} onClick={() => setMode("parametric")}>
          Parametric Path
        </button>
      </div>

      {mode === "motion1d" ? (
        <div className="demo-grid">
          <label className="field">
            <span>x0</span>
            <input type="number" value={x0} onChange={(event) => setX0(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>v0</span>
            <input type="number" value={v0} onChange={(event) => setV0(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>a</span>
            <input type="number" value={a} onChange={(event) => setA(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>t max</span>
            <input type="number" value={tMax} onChange={(event) => setTMax(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "relative" ? (
        <div className="demo-grid">
          <label className="field">
            <span>x1</span>
            <input type="number" value={relX1} onChange={(event) => setRelX1(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>v1</span>
            <input type="number" value={relV1} onChange={(event) => setRelV1(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>x2</span>
            <input type="number" value={relX2} onChange={(event) => setRelX2(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>v2</span>
            <input type="number" value={relV2} onChange={(event) => setRelV2(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>t max</span>
            <input type="number" value={tMax} onChange={(event) => setTMax(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "intercept" ? (
        <div className="demo-grid">
          <label className="field">
            <span>target x</span>
            <input type="number" value={targetX} onChange={(event) => setTargetX(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>target y</span>
            <input type="number" value={targetY} onChange={(event) => setTargetY(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>target vx</span>
            <input type="number" value={targetVx} onChange={(event) => setTargetVx(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>target vy</span>
            <input type="number" value={targetVy} onChange={(event) => setTargetVy(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>interceptor speed</span>
            <input type="number" value={projSpeed} onChange={(event) => setProjSpeed(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "launch" ? (
        <div className="demo-grid">
          <label className="field">
            <span>range (m)</span>
            <input type="number" value={range} onChange={(event) => setRange(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>speed (m/s)</span>
            <input type="number" value={projSpeed} onChange={(event) => setProjSpeed(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "parametric" ? (
        <div className="demo-grid">
          <label className="field">
            <span>A_x</span>
            <input type="number" value={ampX} onChange={(event) => setAmpX(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>A_y</span>
            <input type="number" value={ampY} onChange={(event) => setAmpY(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>omega</span>
            <input type="number" value={omega} onChange={(event) => setOmega(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>t max</span>
            <input type="number" value={tMax} onChange={(event) => setTMax(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      <div className="demo-output">
        <div className="demo-note">{result.summary}</div>
        {mode === "intercept" ? (
          <div className="inline-kv">
            <span className="pill">intercept time = {Number.isFinite(result.interceptTime) ? result.interceptTime.toFixed(2) : "--"} s</span>
          </div>
        ) : null}
        {mode === "launch" ? (
          <div className="inline-kv">
            <span className="pill">angles = {result.launchAngles.length ? result.launchAngles.map((a) => a.toFixed(1)).join("°, ") + "°" : "--"}</span>
          </div>
        ) : null}
        {mode === "motion1d" ? (
          <MathInline latex={String.raw`x(t)=x_0+v_0 t+\tfrac{1}{2} a t^2`} />
        ) : null}
      </div>

      {mode === "motion1d" || mode === "relative" ? (
        <div className="demo-stack">
          <PlotCanvas series={[{ id: "x", points: result.xs, color: "#2563eb", label: "x(t)" }]} xLabel="t" yLabel="x" showLegend />
          {mode === "motion1d" ? (
            <PlotCanvas series={[{ id: "v", points: result.vs, color: "#d97706", label: "v(t)" }]} xLabel="t" yLabel="v" showLegend />
          ) : null}
        </div>
      ) : null}

      {mode === "parametric" || mode === "intercept" ? (
        <PlotCanvas series={[{ id: "path", points: result.path, color: "#0b7285", label: "path" }]} xLabel="x" yLabel="y" showLegend />
      ) : null}
    </div>
  );
}
