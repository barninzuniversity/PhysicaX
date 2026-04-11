"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

export function BeatEnvelopeSim() {
  const [f1, setF1] = useState("2.2");
  const [f2, setF2] = useState("2.6");
  const [duration, setDuration] = useState("10");

  const { wave, envelope } = useMemo(() => {
    const f1Val = Number(f1);
    const f2Val = Number(f2);
    const durVal = Number(duration);
    if (!Number.isFinite(f1Val) || !Number.isFinite(f2Val) || !Number.isFinite(durVal)) {
      return { wave: [], envelope: [] };
    }
    if (durVal <= 0) {
      return { wave: [], envelope: [] };
    }
    const pts: { x: number; y: number }[] = [];
    const env: { x: number; y: number }[] = [];
    const steps = 600;
    for (let i = 0; i <= steps; i += 1) {
      const t = (durVal * i) / steps;
      const y = Math.sin(2 * Math.PI * f1Val * t) + Math.sin(2 * Math.PI * f2Val * t);
      const amp = 2 * Math.cos(Math.PI * (f1Val - f2Val) * t);
      pts.push({ x: t, y });
      env.push({ x: t, y: amp });
    }
    return { wave: pts, envelope: env };
  }, [f1, f2, duration]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Beat Envelope</div>
      <div className="demo-grid">
        <label className="field">
          <span>f1 (Hz)</span>
          <input type="number" value={f1} onChange={(event) => setF1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>f2 (Hz)</span>
          <input type="number" value={f2} onChange={(event) => setF2(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>duration (s)</span>
          <input type="number" value={duration} onChange={(event) => setDuration(event.target.value)} step="any" />
        </label>
      </div>
      <PlotCanvas
        series={[
          { id: "wave", points: wave, color: "#0b7285", label: "signal" },
          { id: "env", points: envelope, color: "#9ca3af", dash: [6, 4], label: "envelope" }
        ]}
        xLabel="t"
        yLabel="y"
        showLegend
      />
      <div className="demo-note">
        <MathInline latex={String.raw`\cos(2\pi f_1 t) + \cos(2\pi f_2 t)`} />
      </div>
    </div>
  );
}
