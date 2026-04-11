"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const R = 8.314462618;

type CycleId =
  | "carnot"
  | "otto"
  | "diesel"
  | "dual"
  | "brayton"
  | "rankine"
  | "refrigeration"
  | "heatpump"
  | "stirling"
  | "ericsson";

const cycleMeta: Record<CycleId, { title: string; description: string }> = {
  carnot: { title: "Carnot", description: "Reversible upper-bound efficiency." },
  otto: { title: "Otto", description: "Spark-ignition engine model." },
  diesel: { title: "Diesel", description: "Compression ignition model." },
  dual: { title: "Dual", description: "Dual-combustion cycle (toy)." },
  brayton: { title: "Brayton", description: "Gas turbine / jet cycle." },
  rankine: { title: "Rankine", description: "Steam power plant cycle (toy)." },
  refrigeration: { title: "Refrigeration", description: "Heat pump / refrigeration COP." },
  heatpump: { title: "Heat Pump", description: "COP for heating mode." },
  stirling: { title: "Stirling", description: "Regenerative cycle." },
  ericsson: { title: "Ericsson", description: "Isothermal compression/expansion." }
};

export function CycleLibrarySim() {
  const [cycle, setCycle] = useState<CycleId>("otto");
  const [th, setTh] = useState("900");
  const [tc, setTc] = useState("300");
  const [gamma, setGamma] = useState("1.4");
  const [r, setR] = useState("10");
  const [rho, setRho] = useState("2");
  const [rp, setRp] = useState("8");
  const [etaIdeal, setEtaIdeal] = useState("0.4");
  const [v1, setV1] = useState("0.02");

  const { eta, curve, pvLoop, pvLabel } = useMemo(() => {
    const thVal = Number(th);
    const tcVal = Number(tc);
    const gVal = Number(gamma);
    const rVal = Number(r);
    const rhoVal = Number(rho);
    const rpVal = Number(rp);
    const etaIdealVal = Number(etaIdeal);
    const v1Val = Number(v1);
    const nVal = 1;
    const nR = nVal * R;

    let etaVal = NaN;
    if (cycle === "carnot" && thVal > 0 && tcVal > 0) {
      etaVal = clamp(1 - tcVal / thVal);
    } else if (cycle === "otto" && rVal > 1 && gVal > 1) {
      etaVal = clamp(1 - 1 / Math.pow(rVal, gVal - 1));
    } else if (cycle === "diesel" && rVal > 1 && rhoVal > 1 && gVal > 1) {
      etaVal = clamp(
        1 -
          (1 / Math.pow(rVal, gVal - 1)) *
            ((Math.pow(rhoVal, gVal) - 1) / (gVal * (rhoVal - 1)))
      );
    } else if (cycle === "dual" && rVal > 1 && rhoVal > 1 && gVal > 1) {
      const etaOtto = clamp(1 - 1 / Math.pow(rVal, gVal - 1));
      const etaDiesel = clamp(
        1 -
          (1 / Math.pow(rVal, gVal - 1)) *
            ((Math.pow(rhoVal, gVal) - 1) / (gVal * (rhoVal - 1)))
      );
      etaVal = clamp(0.5 * (etaOtto + etaDiesel));
    } else if (cycle === "brayton" && rpVal > 1 && gVal > 1) {
      etaVal = clamp(1 - 1 / Math.pow(rpVal, (gVal - 1) / gVal));
    } else if (cycle === "rankine") {
      etaVal = clamp(etaIdealVal);
    } else if (cycle === "refrigeration") {
      etaVal = clamp(tcVal / Math.max(1, thVal - tcVal));
    } else if (cycle === "heatpump") {
      etaVal = clamp(thVal / Math.max(1, thVal - tcVal));
    } else if (cycle === "stirling" && thVal > 0 && tcVal > 0) {
      etaVal = clamp(1 - tcVal / thVal);
    } else if (cycle === "ericsson" && thVal > 0 && tcVal > 0) {
      etaVal = clamp(1 - tcVal / thVal);
    }

    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 40; i += 1) {
      const x = i / 40;
      pts.push({ x, y: etaVal * (0.3 + 0.7 * Math.sin(Math.PI * x) ** 2) });
    }
    const pv: { x: number; y: number }[] = [];

    const addSegment = (points: { x: number; y: number }[]) => {
      if (!points.length) return;
      if (pv.length) {
        pv.push(points[0]);
      }
      pv.push(...points);
    };

    const buildIsothermal = (tConst: number, vStart: number, vEnd: number) => {
      const out: { x: number; y: number }[] = [];
      const steps = 50;
      const vMin = Math.min(vStart, vEnd);
      const vMax = Math.max(vStart, vEnd);
      for (let i = 0; i <= steps; i += 1) {
        const v = vMin + (vMax - vMin) * (i / steps);
        const p = (nR * tConst) / v;
        out.push({ x: v, y: p });
      }
      return vStart <= vEnd ? out : out.reverse();
    };

    const buildAdiabatic = (p1: number, v1p: number, v2p: number) => {
      const out: { x: number; y: number }[] = [];
      const steps = 50;
      const k = p1 * Math.pow(v1p, gVal);
      const vMin = Math.min(v1p, v2p);
      const vMax = Math.max(v1p, v2p);
      for (let i = 0; i <= steps; i += 1) {
        const v = vMin + (vMax - vMin) * (i / steps);
        const p = k / Math.pow(v, gVal);
        out.push({ x: v, y: p });
      }
      return v1p <= v2p ? out : out.reverse();
    };

    const buildIsobaric = (pConst: number, vStart: number, vEnd: number) => {
      const out: { x: number; y: number }[] = [];
      const steps = 25;
      const vMin = Math.min(vStart, vEnd);
      const vMax = Math.max(vStart, vEnd);
      for (let i = 0; i <= steps; i += 1) {
        const v = vMin + (vMax - vMin) * (i / steps);
        out.push({ x: v, y: pConst });
      }
      return vStart <= vEnd ? out : out.reverse();
    };

    const buildIsochoric = (vConst: number, pStart: number, pEnd: number) => {
      const out: { x: number; y: number }[] = [];
      const steps = 25;
      const pMin = Math.min(pStart, pEnd);
      const pMax = Math.max(pStart, pEnd);
      for (let i = 0; i <= steps; i += 1) {
        const p = pMin + (pMax - pMin) * (i / steps);
        out.push({ x: vConst, y: p });
      }
      return pStart <= pEnd ? out : out.reverse();
    };

    const pvLabelText = `${cycleMeta[cycle].title} P-V`;

    if (Number.isFinite(v1Val) && v1Val > 0) {
      const v1c = v1Val;
      const tCold = tcVal > 0 ? tcVal : 300;
      const tHot = thVal > 0 ? thVal : 900;
      const p1c = (nR * tCold) / v1c;

      if (cycle === "otto" && rVal > 1 && gVal > 1) {
        const v2 = v1c / rVal;
        const t2 = tCold * Math.pow(rVal, gVal - 1);
        const p2 = (nR * t2) / v2;
        const t3 = tHot;
        const p3 = (nR * t3) / v2;
        const t4 = t3 / Math.pow(rVal, gVal - 1);
        const p4 = (nR * t4) / v1c;
        addSegment(buildAdiabatic(p1c, v1c, v2));
        addSegment(buildIsochoric(v2, p2, p3));
        addSegment(buildAdiabatic(p3, v2, v1c));
        addSegment(buildIsochoric(v1c, p4, p1c));
      } else if (cycle === "diesel" && rVal > 1 && gVal > 1) {
        const v2 = v1c / rVal;
        const t2 = tCold * Math.pow(rVal, gVal - 1);
        const p2 = (nR * t2) / v2;
        const t3 = tHot;
        const v3 = v2 * (t3 / t2);
        const p3 = p2;
        const t4 = t3 * Math.pow(v3 / v1c, gVal - 1);
        const p4 = (nR * t4) / v1c;
        addSegment(buildAdiabatic(p1c, v1c, v2));
        addSegment(buildIsobaric(p2, v2, v3));
        addSegment(buildAdiabatic(p3, v3, v1c));
        addSegment(buildIsochoric(v1c, p4, p1c));
      } else if (cycle === "dual" && rVal > 1 && gVal > 1) {
        const v2 = v1c / rVal;
        const t2 = tCold * Math.pow(rVal, gVal - 1);
        const p2 = (nR * t2) / v2;
        const t3 = t2 * rhoVal;
        const p3 = (nR * t3) / v2;
        const t4 = tHot;
        const v4 = v2 * (t4 / t3);
        const p4 = p3;
        const t5 = t4 * Math.pow(v4 / v1c, gVal - 1);
        const p5 = (nR * t5) / v1c;
        addSegment(buildAdiabatic(p1c, v1c, v2));
        addSegment(buildIsochoric(v2, p2, p3));
        addSegment(buildIsobaric(p3, v2, v4));
        addSegment(buildAdiabatic(p4, v4, v1c));
        addSegment(buildIsochoric(v1c, p5, p1c));
      } else if (cycle === "brayton" && rpVal > 1 && gVal > 1) {
        const p2 = p1c * rpVal;
        const t2 = tCold * Math.pow(rpVal, (gVal - 1) / gVal);
        const v2 = (nR * t2) / p2;
        const t3 = tHot;
        const v3 = (nR * t3) / p2;
        const t4 = t3 / Math.pow(rpVal, (gVal - 1) / gVal);
        const v4 = (nR * t4) / p1c;
        addSegment(buildAdiabatic(p1c, v1c, v2));
        addSegment(buildIsobaric(p2, v2, v3));
        addSegment(buildAdiabatic(p2, v3, v4));
        addSegment(buildIsobaric(p1c, v4, v1c));
      } else if (cycle === "carnot" && thVal > 0 && tcVal > 0) {
        const v2 = v1c * Math.max(1.2, rVal);
        const v3 = v2 * Math.pow(thVal / tcVal, 1 / (gVal - 1));
        const v4 = v1c * Math.pow(thVal / tcVal, 1 / (gVal - 1));
        const p1h = (nR * thVal) / v1c;
        const p2h = (nR * thVal) / v2;
        const p3c = (nR * tcVal) / v3;
        const p4c = (nR * tcVal) / v4;
        addSegment(buildIsothermal(thVal, v1c, v2));
        addSegment(buildAdiabatic(p2h, v2, v3));
        addSegment(buildIsothermal(tcVal, v3, v4));
        addSegment(buildAdiabatic(p4c, v4, v1c));
      } else if (cycle === "stirling" && thVal > 0 && tcVal > 0) {
        const v2 = v1c * Math.max(1.2, rVal);
        const p1h = (nR * thVal) / v1c;
        const p2h = (nR * thVal) / v2;
        const p2c = (nR * tcVal) / v2;
        const p1cCold = (nR * tcVal) / v1c;
        addSegment(buildIsothermal(thVal, v1c, v2));
        addSegment(buildIsochoric(v2, p2h, p2c));
        addSegment(buildIsothermal(tcVal, v2, v1c));
        addSegment(buildIsochoric(v1c, p1cCold, p1h));
      } else if (cycle === "ericsson" && thVal > 0 && tcVal > 0) {
        const v2 = v1c * Math.max(1.2, rVal);
        const p1h = (nR * thVal) / v1c;
        const p2h = (nR * thVal) / v2;
        const v3 = v2 * (tcVal / thVal);
        const p3 = (nR * tcVal) / v3;
        const p4 = (nR * tcVal) / v1c;
        addSegment(buildIsothermal(thVal, v1c, v2));
        addSegment(buildIsobaric(p2h, v2, v3));
        addSegment(buildIsothermal(tcVal, v3, v1c));
        addSegment(buildIsobaric(p4, v1c, v1c));
      } else if (cycle === "rankine") {
        const v2 = v1c * 0.3;
        const pHigh = p1c * 6;
        addSegment(buildIsobaric(pHigh, v2, v1c));
        addSegment(buildIsochoric(v1c, pHigh, p1c));
        addSegment(buildIsobaric(p1c, v1c, v2));
        addSegment(buildIsochoric(v2, p1c, pHigh));
      }
    }

    return { eta: etaVal, curve: pts, pvLoop: pv, pvLabel: pvLabelText };
  }, [cycle, th, tc, gamma, r, rho, rp, etaIdeal]);

  const isCop = cycle === "refrigeration" || cycle === "heatpump";

  return (
    <div className="demo-panel">
      <div className="demo-title">Standard Cycle Library</div>
      <div className="demo-grid">
        <label className="field">
          <span>cycle</span>
          <select value={cycle} onChange={(event) => setCycle(event.target.value as CycleId)}>
            {Object.entries(cycleMeta).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Th (K)</span>
          <input type="number" value={th} onChange={(event) => setTh(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Tc (K)</span>
          <input type="number" value={tc} onChange={(event) => setTc(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>gamma</span>
          <input type="number" value={gamma} onChange={(event) => setGamma(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>compression ratio r</span>
          <input type="number" value={r} onChange={(event) => setR(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>cutoff ratio rho</span>
          <input type="number" value={rho} onChange={(event) => setRho(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>pressure ratio r_p</span>
          <input type="number" value={rp} onChange={(event) => setRp(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Rankine/extra η guess</span>
          <input type="number" value={etaIdeal} onChange={(event) => setEtaIdeal(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">
            {isCop ? "COP" : "η"} = {Number.isFinite(eta) ? (isCop ? eta.toFixed(2) : `${(eta * 100).toFixed(1)}%`) : "--"}
          </span>
          <span className="pill">{cycleMeta[cycle].description}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`\eta_{Carnot}=1-\frac{T_c}{T_h},\;\eta_{Otto}=1-\frac{1}{r^{\gamma-1}}`} />
        </div>
      </div>
      <PlotCanvas
        series={[{ id: "cycle", points: curve, color: "#2563eb", label: "cycle indicator" }]}
        xLabel="cycle progress"
        yLabel="efficiency"
      />
      {pvLoop.length ? (
        <PlotCanvas
          series={[{ id: "pv", points: pvLoop, color: "#16a34a", label: pvLabel }]}
          xLabel="V"
          yLabel="P"
          showLegend
        />
      ) : null}
    </div>
  );
}
