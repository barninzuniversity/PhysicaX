"use client";

import { useMemo, useState } from "react";
import { MathInline } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

export function MatrixSolverSim() {
  const { t } = useLocale();
  const [a11, setA11] = useState("3");
  const [a12, setA12] = useState("2");
  const [a21, setA21] = useState("-1");
  const [a22, setA22] = useState("4");
  const [b1, setB1] = useState("7");
  const [b2, setB2] = useState("5");

  const result = useMemo(() => {
    const A11 = Number(a11);
    const A12 = Number(a12);
    const A21 = Number(a21);
    const A22 = Number(a22);
    const B1 = Number(b1);
    const B2 = Number(b2);
    if (![A11, A12, A21, A22, B1, B2].every(Number.isFinite)) {
      return { det: NaN, x: NaN, y: NaN, eig1: "", eig2: "" };
    }
    const det = A11 * A22 - A12 * A21;
    let x = NaN;
    let y = NaN;
    if (Math.abs(det) > 1e-9) {
      x = (B1 * A22 - A12 * B2) / det;
      y = (A11 * B2 - B1 * A21) / det;
    }
    const trace = A11 + A22;
    const disc = trace * trace - 4 * det;
    let eig1 = "";
    let eig2 = "";
    if (disc >= 0) {
      const root = Math.sqrt(disc);
      eig1 = ((trace + root) / 2).toFixed(3);
      eig2 = ((trace - root) / 2).toFixed(3);
    } else {
      const root = Math.sqrt(-disc) / 2;
      const real = (trace / 2).toFixed(3);
      eig1 = `${real} + ${root.toFixed(3)}i`;
      eig2 = `${real} - ${root.toFixed(3)}i`;
    }
    return { det, x, y, eig1, eig2 };
  }, [a11, a12, a21, a22, b1, b2]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("matrixSolverTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>a11</span>
          <input type="number" value={a11} onChange={(event) => setA11(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>a12</span>
          <input type="number" value={a12} onChange={(event) => setA12(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>a21</span>
          <input type="number" value={a21} onChange={(event) => setA21(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>a22</span>
          <input type="number" value={a22} onChange={(event) => setA22(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>b1</span>
          <input type="number" value={b1} onChange={(event) => setB1(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>b2</span>
          <input type="number" value={b2} onChange={(event) => setB2(event.target.value)} step="any" />
        </label>
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span className={`pill ${Math.abs(result.det) < 1e-9 ? "pill-bad" : ""}`}>
            {t("matrixDetLabel")} {Number.isFinite(result.det) ? result.det.toFixed(3) : "--"}
          </span>
          <span className="pill">{t("matrixXLabel")} {Number.isFinite(result.x) ? result.x.toFixed(3) : "--"}</span>
          <span className="pill">{t("matrixYLabel")} {Number.isFinite(result.y) ? result.y.toFixed(3) : "--"}</span>
          <span className="pill">{t("matrixLambda1")} {result.eig1 || "--"}</span>
          <span className="pill">{t("matrixLambda2")} {result.eig2 || "--"}</span>
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`A\vec{x}=\vec{b},\;\; \det(A)\neq 0 \Rightarrow \text{${t("matrixUniqueSolution")}}`} />
        </div>
      </div>
    </div>
  );
}
