"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

type Mode = "multi" | "network" | "convection" | "radiation" | "exchanger";

export function HeatTransferExtrasSim() {
  const [mode, setMode] = useState<Mode>("multi");
  const [k1, setK1] = useState("205");
  const [k2, setK2] = useState("15");
  const [k3, setK3] = useState("0.8");
  const [l1, setL1] = useState("0.01");
  const [l2, setL2] = useState("0.02");
  const [l3, setL3] = useState("0.015");
  const [area, setArea] = useState("1");
  const [th, setTh] = useState("400");
  const [tc, setTc] = useState("300");
  const [h, setH] = useState("15");
  const [eps, setEps] = useState("0.8");
  const [tSurface, setTSurface] = useState("420");
  const [tInf, setTInf] = useState("300");
  const [u, setU] = useState("120");
  const [cHot, setCHot] = useState("4200");
  const [cCold, setCCold] = useState("3500");

  const results = useMemo(() => {
    const kVals = [Number(k1), Number(k2), Number(k3)];
    const lVals = [Number(l1), Number(l2), Number(l3)];
    const aVal = Math.max(1e-6, Number(area));
    const thVal = Number(th);
    const tcVal = Number(tc);
    const hVal = Number(h);
    const epsVal = Number(eps);
    const tSVal = Number(tSurface);
    const tInfVal = Number(tInf);
    const uVal = Number(u);
    const cHotVal = Number(cHot);
    const cColdVal = Number(cCold);
    const sigma = 5.670374e-8;

    const [L1, L2, L3] = lVals;
    const resistances = kVals.map((k, i) => (k > 0 ? lVals[i] / (k * aVal) : Infinity));
    const rTotal = resistances.reduce((acc, val) => acc + val, 0);
    const qCond = rTotal > 0 ? (thVal - tcVal) / rTotal : NaN;

    const biot = hVal > 0 && kVals[0] > 0 ? (hVal * lVals[0]) / kVals[0] : NaN;
    const hRad = epsVal * sigma * 4 * Math.pow(Math.max(tInfVal, 1), 3);
    const qRad = hRad * aVal * (tSVal - tInfVal);

    const cMin = Math.min(cHotVal, cColdVal);
    const cMax = Math.max(cHotVal, cColdVal);
    const ntu = cMin > 0 ? (uVal * aVal) / cMin : NaN;
    const effectiveness = Number.isFinite(ntu) ? 1 - Math.exp(-ntu) : NaN;
    const qEx = cMin > 0 ? effectiveness * cMin * (thVal - tcVal) : NaN;

    const tempProfile = [
      { x: 0, y: thVal },
      { x: L1, y: thVal - (qCond * resistances[0]) },
      { x: L1 + L2, y: thVal - qCond * (resistances[0] + resistances[1]) },
      { x: L1 + L2 + L3, y: tcVal }
    ];

    return {
      resistances,
      rTotal,
      qCond,
      biot,
      hRad,
      qRad,
      ntu,
      effectiveness,
      qEx,
      tempProfile
    };
  }, [k1, k2, k3, l1, l2, l3, area, th, tc, h, eps, tSurface, tInf, u, cHot, cCold]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Heat Transfer Extras</div>
      <div className="control-row">
        <button type="button" className={`control-chip ${mode === "multi" ? "active" : ""}`} onClick={() => setMode("multi")}>
          Multi-layer
        </button>
        <button type="button" className={`control-chip ${mode === "network" ? "active" : ""}`} onClick={() => setMode("network")}>
          Resistance
        </button>
        <button type="button" className={`control-chip ${mode === "convection" ? "active" : ""}`} onClick={() => setMode("convection")}>
          Convection
        </button>
        <button type="button" className={`control-chip ${mode === "radiation" ? "active" : ""}`} onClick={() => setMode("radiation")}>
          Radiation
        </button>
        <button type="button" className={`control-chip ${mode === "exchanger" ? "active" : ""}`} onClick={() => setMode("exchanger")}>
          Heat Exchanger
        </button>
      </div>

      {mode === "multi" || mode === "network" ? (
        <div className="demo-grid">
          <label className="field">
            <span>k1 (W/mK)</span>
            <input type="number" value={k1} onChange={(event) => setK1(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>k2</span>
            <input type="number" value={k2} onChange={(event) => setK2(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>k3</span>
            <input type="number" value={k3} onChange={(event) => setK3(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>L1 (m)</span>
            <input type="number" value={l1} onChange={(event) => setL1(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>L2</span>
            <input type="number" value={l2} onChange={(event) => setL2(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>L3</span>
            <input type="number" value={l3} onChange={(event) => setL3(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Area (m²)</span>
            <input type="number" value={area} onChange={(event) => setArea(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Th (K)</span>
            <input type="number" value={th} onChange={(event) => setTh(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Tc (K)</span>
            <input type="number" value={tc} onChange={(event) => setTc(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "convection" ? (
        <div className="demo-grid">
          <label className="field">
            <span>h (W/m²K)</span>
            <input type="number" value={h} onChange={(event) => setH(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>k (W/mK)</span>
            <input type="number" value={k1} onChange={(event) => setK1(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>L (m)</span>
            <input type="number" value={l1} onChange={(event) => setL1(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "radiation" ? (
        <div className="demo-grid">
          <label className="field">
            <span>emissivity</span>
            <input type="number" value={eps} onChange={(event) => setEps(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>T_surface (K)</span>
            <input type="number" value={tSurface} onChange={(event) => setTSurface(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>T_inf (K)</span>
            <input type="number" value={tInf} onChange={(event) => setTInf(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Area (m²)</span>
            <input type="number" value={area} onChange={(event) => setArea(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      {mode === "exchanger" ? (
        <div className="demo-grid">
          <label className="field">
            <span>U (W/m²K)</span>
            <input type="number" value={u} onChange={(event) => setU(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Area (m²)</span>
            <input type="number" value={area} onChange={(event) => setArea(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>C_hot (W/K)</span>
            <input type="number" value={cHot} onChange={(event) => setCHot(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>C_cold (W/K)</span>
            <input type="number" value={cCold} onChange={(event) => setCCold(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Th (K)</span>
            <input type="number" value={th} onChange={(event) => setTh(event.target.value)} step="any" />
          </label>
          <label className="field">
            <span>Tc (K)</span>
            <input type="number" value={tc} onChange={(event) => setTc(event.target.value)} step="any" />
          </label>
        </div>
      ) : null}

      <div className="demo-output">
        {mode === "multi" || mode === "network" ? (
          <>
            <div className="inline-kv">
              <span className="pill">R_total = {Number.isFinite(results.rTotal) ? results.rTotal.toFixed(4) : "--"} K/W</span>
              <span className="pill">Q = {Number.isFinite(results.qCond) ? results.qCond.toFixed(2) : "--"} W</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`R=\sum \frac{L}{kA},\;\; Q=\frac{T_h-T_c}{R}`}/>
            </div>
          </>
        ) : null}
        {mode === "convection" ? (
          <>
            <div className="inline-kv">
              <span className="pill">Bi = {Number.isFinite(results.biot) ? results.biot.toFixed(3) : "--"}</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`Bi=\frac{h L}{k}`} />
            </div>
          </>
        ) : null}
        {mode === "radiation" ? (
          <>
            <div className="inline-kv">
              <span className="pill">h_rad = {Number.isFinite(results.hRad) ? results.hRad.toFixed(2) : "--"} W/m²K</span>
              <span className="pill">Q_rad = {Number.isFinite(results.qRad) ? results.qRad.toFixed(1) : "--"} W</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`h_{rad}=4\epsilon\sigma T_\infty^3`} />
            </div>
          </>
        ) : null}
        {mode === "exchanger" ? (
          <>
            <div className="inline-kv">
              <span className="pill">NTU = {Number.isFinite(results.ntu) ? results.ntu.toFixed(2) : "--"}</span>
              <span className="pill">ε = {Number.isFinite(results.effectiveness) ? results.effectiveness.toFixed(2) : "--"}</span>
              <span className="pill">Q = {Number.isFinite(results.qEx) ? results.qEx.toFixed(1) : "--"} W</span>
            </div>
            <div className="demo-note">
              <MathInline latex={String.raw`\varepsilon = 1-e^{-\mathrm{NTU}},\;\; Q=\varepsilon C_{min}(T_h-T_c)`} />
            </div>
          </>
        ) : null}
      </div>

      {mode === "multi" || mode === "network" ? (
        <PlotCanvas
          series={[{ id: "temp", points: results.tempProfile, color: "#2563eb", label: "T(x)" }]}
          xLabel="x"
          yLabel="T"
          showLegend
        />
      ) : null}
    </div>
  );
}
