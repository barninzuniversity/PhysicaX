"use client";

import { useMemo, useState } from "react";
import { create, all } from "mathjs";
import { MathInline } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

const math = create(all);

type Equilibrium = {
  x: number;
  y: number;
  type: string;
  eig: string;
};

const classify = (a: number, b: number, c: number, d: number) => {
  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  if (!Number.isFinite(tr) || !Number.isFinite(det)) return { type: "indeterminate", eig: "--" };
  if (det < 0) return { type: "saddle", eig: "det < 0" };
  if (Math.abs(det) < 1e-8) return { type: "degenerate", eig: "det approx 0" };
  if (disc > 0) {
    const r1 = (tr + Math.sqrt(disc)) / 2;
    const r2 = (tr - Math.sqrt(disc)) / 2;
    const stable = tr < 0;
    return { type: stable ? "stable node" : "unstable node", eig: `${r1.toFixed(3)}, ${r2.toFixed(3)}` };
  }
  if (disc < 0) {
    const real = tr / 2;
    const imag = Math.sqrt(-disc) / 2;
    if (Math.abs(real) < 1e-6) return { type: "center", eig: `${real.toFixed(3)} +/- ${imag.toFixed(3)}i` };
    return { type: real < 0 ? "stable spiral" : "unstable spiral", eig: `${real.toFixed(3)} +/- ${imag.toFixed(3)}i` };
  }
  const r = tr / 2;
  return { type: r < 0 ? "stable node" : "unstable node", eig: `${r.toFixed(3)}` };
};

export function LinearizationSim() {
  const [fx, setFx] = useState("y");
  const [fy, setFy] = useState("-x - 0.2*y");
  const [params, setParams] = useState("{}");
  const [xmin, setXmin] = useState("-3");
  const [xmax, setXmax] = useState("3");
  const [ymin, setYmin] = useState("-3");
  const [ymax, setYmax] = useState("3");
  const [grid, setGrid] = useState("15");
  const { t } = useLocale();

  const results = useMemo(() => {
    let compiledFx;
    let compiledFy;
    let dfx;
    let dfy;
    let dgx;
    let dgy;
    let paramObj: Record<string, number> = {};
    try {
      paramObj = JSON.parse(params);
      compiledFx = math.compile(fx);
      compiledFy = math.compile(fy);
      dfx = math.compile(math.derivative(fx, "x").toString());
      dfy = math.compile(math.derivative(fx, "y").toString());
      dgx = math.compile(math.derivative(fy, "x").toString());
      dgy = math.compile(math.derivative(fy, "y").toString());
    } catch {
      return { error: t("linearizationInvalidExpr"), eqs: [] as Equilibrium[] };
    }

    const x0 = Number(xmin);
    const x1 = Number(xmax);
    const y0 = Number(ymin);
    const y1 = Number(ymax);
    const n = Math.max(5, Math.min(40, Math.floor(Number(grid))));
    if (![x0, x1, y0, y1].every(Number.isFinite) || x0 >= x1 || y0 >= y1) {
      return { error: t("linearizationInvalidBounds"), eqs: [] as Equilibrium[] };
    }

    const candidates: { x: number; y: number; mag: number }[] = [];
    for (let i = 0; i < n; i += 1) {
      const x = x0 + ((x1 - x0) * i) / (n - 1);
      for (let j = 0; j < n; j += 1) {
        const y = y0 + ((y1 - y0) * j) / (n - 1);
        const scope = { x, y, ...paramObj };
        const f = Number(compiledFx.evaluate(scope));
        const g = Number(compiledFy.evaluate(scope));
        if (!Number.isFinite(f) || !Number.isFinite(g)) continue;
        const mag = Math.hypot(f, g);
        candidates.push({ x, y, mag });
      }
    }
    candidates.sort((a, b) => a.mag - b.mag);

    const eqs: Equilibrium[] = [];
    const refine = (xStart: number, yStart: number) => {
      let x = xStart;
      let y = yStart;
      for (let k = 0; k < 12; k += 1) {
        const scope = { x, y, ...paramObj };
        const f = Number(compiledFx.evaluate(scope));
        const g = Number(compiledFy.evaluate(scope));
        const a = Number(dfx.evaluate(scope));
        const b = Number(dfy.evaluate(scope));
        const c = Number(dgx.evaluate(scope));
        const d = Number(dgy.evaluate(scope));
        const det = a * d - b * c;
        if (!Number.isFinite(f) || !Number.isFinite(g) || !Number.isFinite(det) || Math.abs(det) < 1e-8) {
          break;
        }
        const dx = (d * f - b * g) / det;
        const dy = (-c * f + a * g) / det;
        x -= dx;
        y -= dy;
        if (Math.hypot(dx, dy) < 1e-6) break;
      }
      return { x, y };
    };

    for (const cand of candidates.slice(0, 6)) {
      const { x, y } = refine(cand.x, cand.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (eqs.some((e) => Math.hypot(e.x - x, e.y - y) < 0.05)) continue;
      const scope = { x, y, ...paramObj };
      const a = Number(dfx.evaluate(scope));
      const b = Number(dfy.evaluate(scope));
      const c = Number(dgx.evaluate(scope));
      const d = Number(dgy.evaluate(scope));
      const cls = classify(a, b, c, d);
      eqs.push({ x, y, type: cls.type, eig: cls.eig });
    }

    return { error: "", eqs };
  }, [fx, fy, params, xmin, xmax, ymin, ymax, grid]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("linearizationTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("linearizationFx")}</span>
          <input type="text" value={fx} onChange={(event) => setFx(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("linearizationFy")}</span>
          <input type="text" value={fy} onChange={(event) => setFy(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("linearizationParams")}</span>
          <input type="text" value={params} onChange={(event) => setParams(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("linearizationGrid")}</span>
          <input type="number" value={grid} onChange={(event) => setGrid(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>{t("linearizationXmin")}</span>
          <input type="number" value={xmin} onChange={(event) => setXmin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("linearizationXmax")}</span>
          <input type="number" value={xmax} onChange={(event) => setXmax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("linearizationYmin")}</span>
          <input type="number" value={ymin} onChange={(event) => setYmin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("linearizationYmax")}</span>
          <input type="number" value={ymax} onChange={(event) => setYmax(event.target.value)} step="any" />
        </label>
      </div>
      {results.error ? <div className="pill pill-bad">{results.error}</div> : null}
      <div className="demo-output">
        <div className="demo-note">
          <MathInline latex={String.raw`J=\begin{bmatrix}f_x & f_y \\ g_x & g_y\end{bmatrix}`} />
        </div>
        <div className="metric-grid">
          {results.eqs.map((eq, idx) => (
            <div key={`${eq.x}-${idx}`} className="metric-card">
              <div className="pill">{t("linearizationEquilibrium")} {eq.x.toFixed(3)}, {eq.y.toFixed(3)}</div>
              <div className="demo-note">{eq.type}</div>
              <div className="demo-note">{t("linearizationEig")} {eq.eig}</div>
            </div>
          ))}
          {!results.eqs.length && !results.error ? <div className="pill">{t("linearizationNone")}</div> : null}
        </div>
      </div>
    </div>
  );
}
