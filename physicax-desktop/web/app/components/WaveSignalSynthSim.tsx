"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";

export function WaveSignalSynthSim() {
  const [harmonics, setHarmonics] = useState("6");
  const [falloff, setFalloff] = useState("1.1");
  const [baseFreq, setBaseFreq] = useState("220");
  const [phaseMode, setPhaseMode] = useState<"zero" | "random">("zero");

  const { waveform, spectrum } = useMemo(() => {
    const hVal = Math.max(1, Math.min(20, Math.floor(Number(harmonics) || 6)));
    const fall = Math.max(0.2, Math.min(3, Number(falloff) || 1.1));
    const points: { x: number; y: number }[] = [];
    const spec: { x: number; y: number }[] = [];
    const phases: number[] = [];
    for (let n = 1; n <= hVal; n += 1) {
      phases.push(phaseMode === "random" ? Math.random() * Math.PI * 2 : 0);
      spec.push({ x: n, y: 1 / Math.pow(n, fall) });
    }

    const samples = 240;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      let y = 0;
      for (let n = 1; n <= hVal; n += 1) {
        const amp = 1 / Math.pow(n, fall);
        y += amp * Math.sin(2 * Math.PI * n * t + phases[n - 1]);
      }
      points.push({ x: t, y });
    }
    return { waveform: points, spectrum: spec };
  }, [harmonics, falloff, phaseMode]);

  const playTone = async () => {
    const hVal = Math.max(1, Math.min(20, Math.floor(Number(harmonics) || 6)));
    const fall = Math.max(0.2, Math.min(3, Number(falloff) || 1.1));
    const freq = Math.max(60, Math.min(880, Number(baseFreq) || 220));
    const ctx = new AudioContext();
    const real = new Float32Array(hVal + 1);
    const imag = new Float32Array(hVal + 1);
    for (let n = 1; n <= hVal; n += 1) {
      imag[n] = 1 / Math.pow(n, fall);
    }
    const osc = ctx.createOscillator();
    const wave = ctx.createPeriodicWave(real, imag);
    osc.setPeriodicWave(wave);
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.4);
    osc.onended = () => {
      ctx.close();
    };
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">Signal Synth + Fourier Harmonics</div>
      <div className="demo-grid">
        <label className="field">
          <span>Harmonics</span>
          <input type="number" value={harmonics} onChange={(event) => setHarmonics(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>Amplitude falloff</span>
          <input type="number" value={falloff} onChange={(event) => setFalloff(event.target.value)} step="0.1" />
        </label>
        <label className="field">
          <span>Base frequency (Hz)</span>
          <input type="number" value={baseFreq} onChange={(event) => setBaseFreq(event.target.value)} step="10" />
        </label>
        <label className="field">
          <span>Phase mode</span>
          <select value={phaseMode} onChange={(event) => setPhaseMode(event.target.value as "zero" | "random")}>
            <option value="zero">Zero</option>
            <option value="random">Random</option>
          </select>
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">Sum of sine harmonics with power falloff.</span>
          <button type="button" className="pill" onClick={playTone}>
            Play tone
          </button>
        </div>
      </div>
      <div className="demo-stack">
        <PlotCanvas series={[{ id: "wave", points: waveform, color: "#0f766e", label: "waveform" }]} xLabel="t" yLabel="x(t)" showLegend />
        <PlotCanvas series={[{ id: "spec", points: spectrum, color: "#4f46e5", label: "harmonics" }]} xLabel="n" yLabel="amp" showLegend />
      </div>
    </div>
  );
}
