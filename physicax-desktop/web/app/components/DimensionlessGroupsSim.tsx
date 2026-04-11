"use client";

import { useEffect, useMemo, useState } from "react";
import { MathInline } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

type FluidKey = "air" | "water" | "oil" | "custom";

const fluidPresets: Record<Exclude<FluidKey, "custom">, {
  rho: number;
  mu: number;
  nu: number;
  k: number;
  cp: number;
  a: number;
  beta: number;
  sigma: number;
}> = {
  air: { rho: 1.204, mu: 1.82e-5, nu: 1.51e-5, k: 0.026, cp: 1007, a: 343, beta: 0.0033, sigma: 0.072 },
  water: { rho: 998, mu: 0.001, nu: 1.0e-6, k: 0.6, cp: 4182, a: 1480, beta: 0.00021, sigma: 0.072 },
  oil: { rho: 850, mu: 0.08, nu: 9.4e-5, k: 0.13, cp: 2100, a: 1300, beta: 0.0007, sigma: 0.03 }
};

export function DimensionlessGroupsSim() {
  const [fluid, setFluid] = useState<FluidKey>("air");
  const [rho, setRho] = useState("1.204");
  const [mu, setMu] = useState("0.0000182");
  const [nu, setNu] = useState("0.0000151");
  const [k, setK] = useState("0.026");
  const [cp, setCp] = useState("1007");
  const [a, setA] = useState("343");
  const [beta, setBeta] = useState("0.0033");
  const [sigma, setSigma] = useState("0.072");
  const [v, setV] = useState("2");
  const { t } = useLocale();
  const [L, setL] = useState("0.5");
  const [g, setG] = useState("9.81");
  const [deltaT, setDeltaT] = useState("20");

  useEffect(() => {
    if (fluid === "custom") {
      return;
    }
    const preset = fluidPresets[fluid];
    setRho(String(preset.rho));
    setMu(String(preset.mu));
    setNu(String(preset.nu));
    setK(String(preset.k));
    setCp(String(preset.cp));
    setA(String(preset.a));
    setBeta(String(preset.beta));
    setSigma(String(preset.sigma));
  }, [fluid]);

  const results = useMemo(() => {
    const rhoVal = Number(rho);
    const muVal = Number(mu);
    const nuVal = Number(nu);
    const kVal = Number(k);
    const cpVal = Number(cp);
    const aVal = Number(a);
    const betaVal = Number(beta);
    const sigmaVal = Number(sigma);
    const vVal = Number(v);
    const LVal = Number(L);
    const gVal = Number(g);
    const dTVal = Number(deltaT);

    const nuEff = Number.isFinite(nuVal) && nuVal > 0 ? nuVal : muVal / Math.max(1e-9, rhoVal);
    const re = Number.isFinite(vVal) && Number.isFinite(LVal) && nuEff > 0 ? (vVal * LVal) / nuEff : NaN;
    const fr = Number.isFinite(vVal) && Number.isFinite(LVal) && LVal > 0 ? vVal / Math.sqrt(Math.max(1e-9, gVal * LVal)) : NaN;
    const ma = Number.isFinite(vVal) && aVal > 0 ? vVal / aVal : NaN;
    const pr = kVal > 0 && muVal > 0 ? (cpVal * muVal) / kVal : NaN;
    const gr =
      Number.isFinite(betaVal) && Number.isFinite(dTVal) && nuEff > 0
        ? (gVal * betaVal * dTVal * Math.pow(LVal, 3)) / (nuEff * nuEff)
        : NaN;
    const ra = Number.isFinite(gr) && Number.isFinite(pr) ? gr * pr : NaN;
    const we = Number.isFinite(sigmaVal) && sigmaVal > 0 ? (rhoVal * vVal * vVal * LVal) / sigmaVal : NaN;
    const pe = Number.isFinite(re) && Number.isFinite(pr) ? re * pr : NaN;

    const regime = Number.isFinite(re) ? (re < 2300 ? "laminar" : re < 4e5 ? "transitional" : "turbulent") : "--";

    return { re, fr, ma, pr, gr, ra, we, pe, regime };
  }, [rho, mu, nu, k, cp, a, beta, sigma, v, L, g, deltaT]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("dimensionlessTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("dimensionlessPreset")}</span>
          <select value={fluid} onChange={(event) => setFluid(event.target.value as FluidKey)}>
            <option value="air">{t("dimensionlessAir")}</option>
            <option value="water">{t("dimensionlessWater")}</option>
            <option value="oil">{t("dimensionlessOil")}</option>
            <option value="custom">{t("dimensionlessCustom")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("dimensionlessVelocity")}</span>
          <input type="number" value={v} onChange={(event) => setV(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessLength")}</span>
          <input type="number" value={L} onChange={(event) => setL(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessGravity")}</span>
          <input type="number" value={g} onChange={(event) => setG(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessDeltaT")}</span>
          <input type="number" value={deltaT} onChange={(event) => setDeltaT(event.target.value)} step="any" />
        </label>
      </div>

      <div className="demo-grid">
        <label className="field">
          <span>{t("dimensionlessDensity")}</span>
          <input type="number" value={rho} onChange={(event) => setRho(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessMu")}</span>
          <input type="number" value={mu} onChange={(event) => setMu(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessNu")}</span>
          <input type="number" value={nu} onChange={(event) => setNu(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessK")}</span>
          <input type="number" value={k} onChange={(event) => setK(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessCp")}</span>
          <input type="number" value={cp} onChange={(event) => setCp(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessSound")}</span>
          <input type="number" value={a} onChange={(event) => setA(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessBeta")}</span>
          <input type="number" value={beta} onChange={(event) => setBeta(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("dimensionlessSigma")}</span>
          <input type="number" value={sigma} onChange={(event) => setSigma(event.target.value)} step="any" />
        </label>
      </div>

      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">Re = {Number.isFinite(results.re) ? results.re.toFixed(2) : "--"}</span>
          <span className="pill">Fr = {Number.isFinite(results.fr) ? results.fr.toFixed(3) : "--"}</span>
          <span className="pill">Ma = {Number.isFinite(results.ma) ? results.ma.toFixed(3) : "--"}</span>
          <span className="pill">Pr = {Number.isFinite(results.pr) ? results.pr.toFixed(2) : "--"}</span>
          <span className="pill">Gr = {Number.isFinite(results.gr) ? results.gr.toExponential(2) : "--"}</span>
          <span className="pill">Ra = {Number.isFinite(results.ra) ? results.ra.toExponential(2) : "--"}</span>
          <span className="pill">We = {Number.isFinite(results.we) ? results.we.toFixed(2) : "--"}</span>
          <span className="pill">Pe = {Number.isFinite(results.pe) ? results.pe.toExponential(2) : "--"}</span>
          <span className="pill">{t("dimensionlessRegime")} {results.regime}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`Re=\frac{\rho v L}{\mu},\; Pr=\frac{c_p \mu}{k},\; Fr=\frac{v}{\sqrt{gL}}`} />
        </div>
      </div>
    </div>
  );
}
