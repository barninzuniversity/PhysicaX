"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";

export function DiffusionDemo() {
  const [d, setD] = useState("0.01");
  const [t, setT] = useState("10");

  const { x2, r2_2d, r2_3d } = useMemo(() => {
    const dVal = Number(d);
    const tVal = Number(t);
    if (!Number.isFinite(dVal) || !Number.isFinite(tVal) || dVal < 0 || tVal < 0) {
      return { x2: NaN, r2_2d: NaN, r2_3d: NaN };
    }
    return { x2: 2 * dVal * tVal, r2_2d: 4 * dVal * tVal, r2_3d: 6 * dVal * tVal };
  }, [d, t]);

  const x2Text = Number.isFinite(x2) ? `${x2.toFixed(4)}` : "--";
  const r2_2dText = Number.isFinite(r2_2d) ? `${r2_2d.toFixed(4)}` : "--";
  const r2_3dText = Number.isFinite(r2_3d) ? `${r2_3d.toFixed(4)}` : "--";

  return (
    <div className="demo-panel">
      <div className="demo-title">Diffusion Moments</div>
      <div className="demo-grid">
        <label className="field">
          <span>D</span>
          <input type="number" value={d} onChange={(event) => setD(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>t</span>
          <input type="number" value={t} onChange={(event) => setT(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">&lt;x^2&gt; = {x2Text}</span>
          <span className="pill">2D &lt;r^2&gt; = {r2_2dText}</span>
          <span className="pill">3D &lt;r^2&gt; = {r2_3dText}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`\langle x^2 \rangle = 2 D t,\; \langle r^2 \rangle = 2 d D t`} />
        </div>
      </div>
    </div>
  );
}
