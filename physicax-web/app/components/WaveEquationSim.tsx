"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type WaveMode = "analytic" | "numeric";
type InitType = "sine" | "gaussian" | "square";
type BoundaryType = "fixed" | "periodic";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function WaveEquationSim() {
  const [mode, setMode] = useState<WaveMode>("analytic");
  const [c, setC] = useState("1");
  const [dx, setDx] = useState("0.05");
  const [dt, setDt] = useState("0.02");
  const [time, setTime] = useState(0);
  const [length, setLength] = useState("1");
  const [phase, setPhase] = useState("0");
  const [phi0, setPhi0] = useState("0");
  const [amplitude, setAmplitude] = useState("1");
  const [center, setCenter] = useState("0.5");
  const [width, setWidth] = useState("0.2");
  const [baseline, setBaseline] = useState("0");
  const [initType, setInitType] = useState<InitType>("sine");
  const [boundary, setBoundary] = useState<BoundaryType>("fixed");
  const [velocityScale, setVelocityScale] = useState("0");
  const [probeX, setProbeX] = useState("0.5");
  const [showAnalytic, setShowAnalytic] = useState(true);
  const [speed, setSpeed] = useState("1");
  const [isPlaying, setIsPlaying] = useState(false);
  const lastRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const { points, analyticPoints, probeSeries, energySeries, s, stable, minVal, maxVal, timeUsed, dtMax, dtSuggested } =
    useMemo(() => {
    const cVal = Number(c);
    const dxVal = Number(dx);
    const dtVal = Number(dt);
    const phaseVal = Number(phase);
    const phi0Val = Number(phi0);
    const ampVal = Number(amplitude);
    const centerVal = Number(center);
    const widthVal = Math.max(1e-4, Number(width));
    const baseVal = Number(baseline);
    const lengthVal = Math.max(0.1, Number(length));
    const timeVal = Math.max(0, Number(time));
    const vScaleVal = Number(velocityScale);
    if (!Number.isFinite(cVal) || !Number.isFinite(dxVal) || !Number.isFinite(dtVal) || dxVal <= 0 || dtVal <= 0) {
      return {
        points: [],
        analyticPoints: [],
        probeSeries: [],
        energySeries: [],
        s: NaN,
        stable: false,
        minVal: NaN,
        maxVal: NaN,
        timeUsed: 0,
        dtMax: NaN,
        dtSuggested: NaN
      };
    }
    const n = clamp(Math.floor(lengthVal / dxVal), 30, 220);
    const dxStep = lengthVal / (n - 1);
    const sVal = (cVal * dtVal) / dxStep;
    const stableVal = sVal <= 1;
    const dtMaxVal = cVal > 0 ? dxStep / cVal : NaN;
    const dtSuggestedVal = Number.isFinite(dtMaxVal) ? dtMaxVal * 0.8 : NaN;
    const steps = Math.min(1600, Math.floor(timeVal / dtVal));
    const xs = Array.from({ length: n }, (_, i) => i * dxStep);
    const probeRaw = Number(probeX);
    const probeIdx = Number.isFinite(probeRaw)
      ? clamp(Math.round((probeRaw / lengthVal) * (n - 1)), 0, n - 1)
      : Math.floor(n / 2);

    const initValue = (x: number) => {
      if (initType === "gaussian") {
        const z = (x - centerVal) / widthVal;
        return baseVal + ampVal * Math.exp(-0.5 * z * z);
      }
      if (initType === "square") {
        return baseVal + (Math.abs(x - centerVal) <= widthVal * 0.5 ? ampVal : 0);
      }
      return baseVal + ampVal * Math.sin((Math.PI * x) / lengthVal + phaseVal);
    };

    if (mode === "analytic") {
      const pts = xs.map((x) => ({
        x,
        y: baseVal + ampVal * Math.sin((Math.PI * x) / lengthVal + phaseVal) * Math.cos((Math.PI * cVal * timeVal) / lengthVal + phi0Val)
      }));
      const values = pts.map((p) => p.y);
      return {
        points: pts,
        analyticPoints: [],
        probeSeries: [],
        energySeries: [],
        s: sVal,
        stable: stableVal,
        minVal: Math.min(...values),
        maxVal: Math.max(...values),
        timeUsed: timeVal,
        dtMax: dtMaxVal,
        dtSuggested: dtSuggestedVal
      };
    }

    let uPrev = xs.map((x) => initValue(x));
    let uCurr = uPrev.slice();
    const v0 = xs.map((x) => (Number.isFinite(vScaleVal) ? vScaleVal * initValue(x) : 0));
    const probePts: { x: number; y: number }[] = [];
    const energyPts: { x: number; y: number }[] = [];

    const laplacian = (arr: number[], i: number) => arr[i + 1] - 2 * arr[i] + arr[i - 1];
    const applyBoundary = (arr: number[]) => {
      if (boundary === "fixed") {
        arr[0] = baseVal;
        arr[arr.length - 1] = baseVal;
      }
    };

    if (steps > 0) {
      for (let i = 1; i < n - 1; i += 1) {
        uCurr[i] = uPrev[i] + dtVal * v0[i] + 0.5 * sVal * sVal * laplacian(uPrev, i);
      }
      if (boundary === "periodic") {
        uCurr[0] = uPrev[0] + dtVal * v0[0] + 0.5 * sVal * sVal * (uPrev[1] - 2 * uPrev[0] + uPrev[n - 1]);
        uCurr[n - 1] =
          uPrev[n - 1] + dtVal * v0[n - 1] + 0.5 * sVal * sVal * (uPrev[0] - 2 * uPrev[n - 1] + uPrev[n - 2]);
      } else {
        applyBoundary(uCurr);
      }
    }

    for (let step = 0; step <= steps; step += 1) {
      const t = step * dtVal;
      probePts.push({ x: t, y: uCurr[probeIdx] ?? 0 });

      let energy = 0;
      for (let i = 1; i < n - 1; i += 1) {
        const du = (uCurr[i] - uPrev[i]) / dtVal;
        const dxu = (uCurr[i + 1] - uCurr[i - 1]) / (2 * dxStep);
        energy += 0.5 * (du * du + cVal * cVal * dxu * dxu) * dxStep;
      }
      energyPts.push({ x: t, y: energy });

      if (step === steps) {
        break;
      }

      const uNext = new Array(n).fill(0);
      if (boundary === "periodic") {
        for (let i = 0; i < n; i += 1) {
          const left = uCurr[(i - 1 + n) % n];
          const right = uCurr[(i + 1) % n];
          uNext[i] = 2 * uCurr[i] - uPrev[i] + sVal * sVal * (right - 2 * uCurr[i] + left);
        }
      } else {
        uNext[0] = baseVal;
        uNext[n - 1] = baseVal;
        for (let i = 1; i < n - 1; i += 1) {
          uNext[i] = 2 * uCurr[i] - uPrev[i] + sVal * sVal * laplacian(uCurr, i);
        }
      }
      uPrev = uCurr;
      uCurr = uNext;
    }

    const pts = xs.map((x, idx) => ({ x, y: uCurr[idx] ?? 0 }));
    const values = pts.map((p) => p.y);
    const analyticPts =
      showAnalytic && initType === "sine"
        ? xs.map((x) => ({
            x,
            y:
              baseVal +
              ampVal *
                Math.sin((Math.PI * x) / lengthVal + phaseVal) *
                Math.cos((Math.PI * cVal * timeVal) / lengthVal + phi0Val)
          }))
        : [];

    return {
      points: pts,
      analyticPoints: analyticPts,
      probeSeries: probePts,
      energySeries: energyPts,
      s: sVal,
      stable: stableVal,
      minVal: Math.min(...values),
      maxVal: Math.max(...values),
      timeUsed: steps * dtVal,
      dtMax: dtMaxVal,
      dtSuggested: dtSuggestedVal
    };
  }, [
    mode,
    c,
    dx,
    dt,
    time,
    length,
    phase,
    phi0,
    amplitude,
    center,
    width,
    baseline,
    initType,
    boundary,
    velocityScale,
    probeX,
    showAnalytic
  ]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const step = (now: number) => {
      const last = lastRef.current ?? now;
      const dtSec = (now - last) / 1000;
      lastRef.current = now;
      const rate = Number(speed);
      setTime((prev) => prev + dtSec * (Number.isFinite(rate) ? rate : 1));
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying, speed]);

  return (
    <div className="demo-panel">
      <div className="demo-title">1D Wave Equation</div>
      <div className="demo-grid">
        <label className="field">
          <span>mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as WaveMode)}>
            <option value="analytic">Analytic</option>
            <option value="numeric">Numeric</option>
          </select>
        </label>
        <label className="field">
          <span>c</span>
          <input type="number" value={c} onChange={(event) => setC(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dx</span>
          <input type="number" value={dx} onChange={(event) => setDx(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>time</span>
          <input type="number" value={time} onChange={(event) => setTime(Number(event.target.value))} step="any" />
        </label>
        <label className="field">
          <span>domain length</span>
          <input type="number" value={length} onChange={(event) => setLength(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>init</span>
          <select value={initType} onChange={(event) => setInitType(event.target.value as InitType)}>
            <option value="sine">Sine</option>
            <option value="gaussian">Gaussian</option>
            <option value="square">Square pulse</option>
          </select>
        </label>
        <label className="field">
          <span>amplitude</span>
          <input type="number" value={amplitude} onChange={(event) => setAmplitude(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>center</span>
          <input type="number" value={center} onChange={(event) => setCenter(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>width</span>
          <input type="number" value={width} onChange={(event) => setWidth(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>baseline</span>
          <input type="number" value={baseline} onChange={(event) => setBaseline(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>phase</span>
          <input type="number" value={phase} onChange={(event) => setPhase(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>initial phase</span>
          <input type="number" value={phi0} onChange={(event) => setPhi0(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>boundary</span>
          <select value={boundary} onChange={(event) => setBoundary(event.target.value as BoundaryType)}>
            <option value="fixed">Fixed</option>
            <option value="periodic">Periodic</option>
          </select>
        </label>
        <label className="field">
          <span>velocity scale</span>
          <input type="number" value={velocityScale} onChange={(event) => setVelocityScale(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>probe x</span>
          <input type="number" value={probeX} onChange={(event) => setProbeX(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>overlay analytic</span>
          <select value={showAnalytic ? "on" : "off"} onChange={(event) => setShowAnalytic(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>playback speed</span>
          <input type="number" value={speed} onChange={(event) => setSpeed(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">s = {Number.isFinite(s) ? s.toFixed(4) : "--"}</span>
          <span className={`pill ${stable ? "pill-good" : "pill-bad"}`}>stable: {stable ? "yes" : "no"}</span>
          <span className="pill">min = {Number.isFinite(minVal) ? minVal.toFixed(3) : "--"}</span>
          <span className="pill">max = {Number.isFinite(maxVal) ? maxVal.toFixed(3) : "--"}</span>
          <span className="pill">time used = {Number.isFinite(timeUsed) ? timeUsed.toFixed(3) : "--"} s</span>
          <span className="pill">dt max = {Number.isFinite(dtMax) ? dtMax.toExponential(2) : "--"}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`u_{tt} = c^2 u_{xx},\; s = c \Delta t / \Delta x`} />
        </div>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={() => setIsPlaying((prev) => !prev)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="control-button secondary" onClick={() => setTime(0)}>
          Reset
        </button>
        <button
          type="button"
          className="control-button ghost"
          onClick={() => {
            if (Number.isFinite(dtSuggested)) {
              setDt(Number(dtSuggested).toExponential(3));
            }
          }}
        >
          Use stable dt
        </button>
      </div>
      <PlotCanvas
        series={[
          { id: "wave", points, color: "#d26a2e", label: "numeric" },
          ...(analyticPoints.length
            ? [{ id: "analytic", points: analyticPoints, color: "#2563eb", label: "analytic", dash: [6, 6] }]
            : [])
        ]}
        xLabel="x"
        yLabel="u"
        showLegend
      />
      {probeSeries.length ? (
        <PlotCanvas
          series={[{ id: "probe", points: probeSeries, color: "#0b7285", label: "probe" }]}
          xLabel="t"
          yLabel="u(x_probe)"
          showLegend
        />
      ) : null}
      {energySeries.length ? (
        <PlotCanvas
          series={[{ id: "energy", points: energySeries, color: "#16a34a", label: "energy" }]}
          xLabel="t"
          yLabel="energy"
          showLegend
        />
      ) : null}
    </div>
  );
}
