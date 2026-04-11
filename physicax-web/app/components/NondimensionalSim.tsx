"use client";

import { useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Var = { id: string; name: string; value: string; scale: string };

export function NondimensionalSim() {
  const [vars, setVars] = useState<Var[]>([
    { id: "t", name: "t", value: "2", scale: "0.5" },
    { id: "x", name: "x", value: "1.2", scale: "0.4" },
    { id: "u", name: "u", value: "3", scale: "2" }
  ]);
  const { t } = useLocale();

  const results = useMemo(() => {
    return vars.map((v) => {
      const val = Number(v.value);
      const scale = Number(v.scale);
      const out = Number.isFinite(val) && Number.isFinite(scale) && scale !== 0 ? val / scale : NaN;
      return { ...v, out };
    });
  }, [vars]);

  const updateVar = (id: string, patch: Partial<Var>) => {
    setVars((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const addVar = () => {
    setVars((prev) => [...prev, { id: `v${Date.now()}`, name: "q", value: "1", scale: "1" }]);
  };

  const removeVar = (id: string) => {
    setVars((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("nondimensionalTitle")}</div>
      <div className="demo-note">{t("nondimensionalNote")}</div>
      <div className="demo-grid">
        {results.map((v) => (
          <div key={v.id} className="metric-card">
            <label className="field">
              <span>{t("nondimensionalVariable")}</span>
              <input type="text" value={v.name} onChange={(event) => updateVar(v.id, { name: event.target.value })} />
            </label>
            <label className="field">
              <span>{t("nondimensionalValue")}</span>
              <input type="number" value={v.value} onChange={(event) => updateVar(v.id, { value: event.target.value })} step="any" />
            </label>
            <label className="field">
              <span>{t("nondimensionalScale")}</span>
              <input type="number" value={v.scale} onChange={(event) => updateVar(v.id, { scale: event.target.value })} step="any" />
            </label>
            <div className="pill">{t("nondimensionalResult")} {Number.isFinite(v.out) ? v.out.toFixed(3) : "--"}</div>
            <button type="button" className="control-chip" onClick={() => removeVar(v.id)}>
              {t("unitCheckerRemove")}
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="control-button secondary" onClick={addVar}>
        {t("unitCheckerAdd")}
      </button>
    </div>
  );
}
