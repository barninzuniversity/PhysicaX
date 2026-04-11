"use client";

import { useMemo, useState } from "react";
import { MathBlock } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

const defaultExpr = "sin(x) + cos(x) + ln(1+x) + sqrt(1+x)";

type Assumption = {
  name: string;
  small: boolean;
  large: boolean;
  positive: boolean;
};

function normalizeExpr(expr: string) {
  return expr.replace(/\s+/g, " ").trim();
}

function applyAssumptionRules(expr: string, assumptions: Assumption[]) {
  let out = expr;
  const notes: string[] = [];

  assumptions.forEach((assumption) => {
    const v = assumption.name.trim();
    if (!v) return;

    const vEsc = v.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    if (assumption.positive) {
      const before = out;
      out = out
        .replace(new RegExp(`abs\\(${vEsc}\\)`, "g"), v)
        .replace(new RegExp(`sqrt\\(${vEsc}\\s*\\^\\s*2\\)`, "g"), v)
        .replace(new RegExp(`sqrt\\(${vEsc}\\s*\\*\\s*${vEsc}\\)`, "g"), v);
      if (before !== out) {
        notes.push(`${v} > 0: abs(${v}), sqrt(${v}^2) -> ${v}`);
      }
    }

    if (assumption.small) {
      const before = out;
      out = out
        .replace(new RegExp(`sin\\(${vEsc}\\)`, "g"), v)
        .replace(new RegExp(`tan\\(${vEsc}\\)`, "g"), v)
        .replace(new RegExp(`cos\\(${vEsc}\\)`, "g"), `1 - (${v})^2/2`)
        .replace(new RegExp(`exp\\(${vEsc}\\)`, "g"), `1 + ${v}`)
        .replace(new RegExp(`ln\\(1\\s*\\+\\s*${vEsc}\\)`, "g"), v)
        .replace(new RegExp(`1\\s*/\\s*\\(1\\s*\\+\\s*${vEsc}\\)`, "g"), `1 - ${v}`)
        .replace(new RegExp(`sqrt\\(1\\s*\\+\\s*${vEsc}\\)`, "g"), `1 + ${v}/2`);
      if (before !== out) {
        notes.push(`${v} small: sin/tan -> ${v}, cos -> 1-${v}^2/2, ln(1+${v}) -> ${v}`);
      }
    }

    if (assumption.large) {
      const before = out;
      out = out
        .replace(new RegExp(`1\\s*\\+\\s*${vEsc}`, "g"), v)
        .replace(new RegExp(`${vEsc}\\s*\\+\\s*1`, "g"), v)
        .replace(new RegExp(`ln\\(1\\s*\\+\\s*${vEsc}\\)`, "g"), `ln(${v})`)
        .replace(new RegExp(`sqrt\\(${vEsc}\\s*\\^\\s*2\\)`, "g"), assumption.positive ? v : `|${v}|`);
      if (before !== out) {
        notes.push(`${v} large: 1+${v} -> ${v}, ln(1+${v}) -> ln(${v})`);
      }
    }
  });

  return { simplified: out, notes };
}

export function SymbolicAssumptionsSim() {
  const { t } = useLocale();
  const [expr, setExpr] = useState(defaultExpr);
  const [vars, setVars] = useState<Assumption[]>([
    { name: "x", small: true, large: false, positive: false },
    { name: "y", small: false, large: false, positive: true }
  ]);

  const cleaned = useMemo(() => normalizeExpr(expr), [expr]);
  const applied = useMemo(() => applyAssumptionRules(cleaned, vars), [cleaned, vars]);

  const updateVar = (index: number, patch: Partial<Assumption>) => {
    setVars((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addVar = () => {
    setVars((prev) => [...prev, { name: "", small: false, large: false, positive: false }]);
  };

  const removeVar = (index: number) => {
    setVars((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("symbolicAssumptionsTitle")}</div>
      <p className="demo-lede">{t("symbolicAssumptionsLede")}</p>
      <div className="demo-grid">
        <label className="field span-2">
          <span>{t("symbolicAssumptionsExpression")}</span>
          <input
            type="text"
            value={expr}
            onChange={(event) => setExpr(event.target.value)}
            placeholder={t("symbolicAssumptionsPlaceholder")}
          />
        </label>
      </div>

      <div className="panel" style={{ marginTop: "16px" }}>
        <div className="panel-title">{t("symbolicAssumptionsPanel")}</div>
        <div className="assumption-grid">
          {vars.map((item, index) => (
            <div key={`${item.name}-${index}`} className="assumption-row">
              <input
                className="assumption-name"
                type="text"
                value={item.name}
                onChange={(event) => updateVar(index, { name: event.target.value })}
                placeholder={t("symbolicAssumptionsVariable")}
              />
              <label className="assumption-flag">
                <input
                  type="checkbox"
                  checked={item.small}
                  onChange={(event) => updateVar(index, { small: event.target.checked })}
                />
                {t("symbolicAssumptionsSmall")}
              </label>
              <label className="assumption-flag">
                <input
                  type="checkbox"
                  checked={item.large}
                  onChange={(event) => updateVar(index, { large: event.target.checked })}
                />
                {t("symbolicAssumptionsLarge")}
              </label>
              <label className="assumption-flag">
                <input
                  type="checkbox"
                  checked={item.positive}
                  onChange={(event) => updateVar(index, { positive: event.target.checked })}
                />
                {t("symbolicAssumptionsPositive")}
              </label>
              <button type="button" className="control-chip" onClick={() => removeVar(index)}>
                {t("symbolicAssumptionsRemove")}
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="control-button" onClick={addVar}>
          {t("symbolicAssumptionsAdd")}
        </button>
      </div>

      <div className="grid-two" style={{ marginTop: "18px" }}>
        <div className="card">
          <h3>{t("symbolicAssumptionsOriginal")}</h3>
          <MathBlock latex={String.raw`\text{${cleaned || ""}}`} />
        </div>
        <div className="card">
          <h3>{t("symbolicAssumptionsSimplified")}</h3>
          <MathBlock latex={String.raw`\text{${applied.simplified || ""}}`} />
        </div>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3>{t("symbolicAssumptionsRules")}</h3>
        {applied.notes.length ? (
          <ul className="list">
            {applied.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : (
          <p>{t("symbolicAssumptionsNone")}</p>
        )}
      </div>
    </div>
  );
}
