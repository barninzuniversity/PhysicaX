"use client";

import { useMemo, useState } from "react";
import { create, all, MathNode } from "mathjs";
import { useLocale } from "./LocaleProvider";

const math = create(all);

type Dim = { L: number; M: number; T: number; Th: number };

type VarDef = { id: string; name: string; L: string; M: string; T: string; Th: string };

const zeroDim: Dim = { L: 0, M: 0, T: 0, Th: 0 };

const addDim = (a: Dim, b: Dim): Dim => ({
  L: a.L + b.L,
  M: a.M + b.M,
  T: a.T + b.T,
  Th: a.Th + b.Th
});

const subDim = (a: Dim, b: Dim): Dim => ({
  L: a.L - b.L,
  M: a.M - b.M,
  T: a.T - b.T,
  Th: a.Th - b.Th
});

const scaleDim = (a: Dim, s: number): Dim => ({
  L: a.L * s,
  M: a.M * s,
  T: a.T * s,
  Th: a.Th * s
});

const eqDim = (a: Dim, b: Dim) =>
  Math.abs(a.L - b.L) < 1e-6 &&
  Math.abs(a.M - b.M) < 1e-6 &&
  Math.abs(a.T - b.T) < 1e-6 &&
  Math.abs(a.Th - b.Th) < 1e-6;

const dimToString = (d: Dim) =>
  `L^${d.L.toFixed(2)} M^${d.M.toFixed(2)} T^${d.T.toFixed(2)} Th^${d.Th.toFixed(2)}`;

const parseTargetDim = (text: string) => {
  const dim: Dim = { L: 0, M: 0, T: 0, Th: 0 };
  const errors: string[] = [];
  const tokens = text.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
  tokens.forEach((token) => {
    const match = token.match(/^(Th|[MLT])\s*\^?\s*(-?\d+(?:\.\d+)?)$/i);
    if (!match) {
      errors.push(token);
      return;
    }
    const key = match[1];
    const value = Number(match[2]);
    if (!Number.isFinite(value)) {
      errors.push(token);
      return;
    }
    if (key.toLowerCase() === "l") dim.L = value;
    if (key.toLowerCase() === "m") dim.M = value;
    if (key.toLowerCase() === "t") dim.T = value;
    if (key.toLowerCase() === "th") dim.Th = value;
  });
  return { dim, errors };
};

const diffDims = (a: Dim, b: Dim) => {
  const diffs: { key: keyof Dim; expected: number; got: number }[] = [];
  (["L", "M", "T", "Th"] as (keyof Dim)[]).forEach((key) => {
    if (Math.abs(a[key] - b[key]) > 1e-6) {
      diffs.push({ key, expected: b[key], got: a[key] });
    }
  });
  return diffs;
};

export function UnitConsistencySim() {
  const [expr, setExpr] = useState("rho * v^2 * L");
  const [target, setTarget] = useState("M1 L-1 T-2");
  const [vars, setVars] = useState<VarDef[]>([
    { id: "rho", name: "rho", L: "-3", M: "1", T: "0", Th: "0" },
    { id: "v", name: "v", L: "1", M: "0", T: "-1", Th: "0" },
    { id: "L", name: "L", L: "1", M: "0", T: "0", Th: "0" }
  ]);
  const { t } = useLocale();

  const result = useMemo(() => {
    const varMap = new Map<string, Dim>();
    vars.forEach((v) => {
      varMap.set(v.name.trim(), {
        L: Number(v.L) || 0,
        M: Number(v.M) || 0,
        T: Number(v.T) || 0,
        Th: Number(v.Th) || 0
      });
    });

    let node: MathNode;
    try {
      node = math.parse(expr);
    } catch {
      return {
        dim: zeroDim,
        valid: false,
        error: t("unitInvalidExpression"),
        targetDim: zeroDim,
        targetErrors: [],
        diffs: []
      };
    }

    const errors: string[] = [];

    const dimOf = (n: MathNode): Dim => {
      if (n.type === "SymbolNode") {
        const key = (n as any).name;
        const d = varMap.get(key);
        if (!d) {
          errors.push(`${t("unitUnknownSymbol")} ${key}`);
          return zeroDim;
        }
        return d;
      }
      if (n.type === "ConstantNode") {
        return zeroDim;
      }
      if (n.type === "ParenthesisNode") {
        return dimOf((n as any).content);
      }
      if (n.type === "OperatorNode") {
        const op = (n as any).op;
        const args = (n as any).args as MathNode[];
        if (op === "+") {
          const d0 = dimOf(args[0]);
          const d1 = dimOf(args[1]);
          if (!eqDim(d0, d1)) {
            errors.push(t("unitAddSubError"));
          }
          return d0;
        }
        if (op === "-") {
          if (args.length === 1) return dimOf(args[0]);
          const d0 = dimOf(args[0]);
          const d1 = dimOf(args[1]);
          if (!eqDim(d0, d1)) {
            errors.push(t("unitAddSubError"));
          }
          return d0;
        }
        if (op === "*") {
          return args.map(dimOf).reduce(addDim, zeroDim);
        }
        if (op === "/") {
          return subDim(dimOf(args[0]), dimOf(args[1]));
        }
        if (op === "^") {
          const base = dimOf(args[0]);
          const expNode = args[1];
          if (expNode.type !== "ConstantNode") {
            errors.push(t("unitExponentConstant"));
            return base;
          }
          const value = Number((expNode as any).value);
          if (!Number.isFinite(value)) {
            errors.push(t("unitExponentFinite"));
            return base;
          }
          return scaleDim(base, value);
        }
      }
      if (n.type === "FunctionNode") {
        const fnName = (n as any).name;
        const args = (n as any).args as MathNode[];
        const argDim = args.length ? dimOf(args[0]) : zeroDim;
        if (["sin", "cos", "tan", "exp", "log", "ln"].includes(fnName)) {
          if (!eqDim(argDim, zeroDim)) {
            errors.push(`${fnName} ${t("unitFunctionDimensionless")}`);
          }
          return zeroDim;
        }
        if (fnName === "sqrt") {
          return scaleDim(argDim, 0.5);
        }
        return argDim;
      }
      return zeroDim;
    };

    const dim = dimOf(node);
    const parsedTarget = parseTargetDim(target);
    const targetDim = parsedTarget.dim;
    const targetErrors = parsedTarget.errors;
    const diffs = diffDims(dim, targetDim);
    return {
      dim,
      valid: errors.length === 0,
      error: errors.join(" "),
      targetDim,
      targetErrors,
      diffs
    };
  }, [expr, vars, target]);

  const addVar = () => {
    setVars((prev) => [
      ...prev,
      { id: `v${Date.now()}`, name: "x", L: "0", M: "0", T: "0", Th: "0" }
    ]);
  };

  const updateVar = (id: string, patch: Partial<VarDef>) => {
    setVars((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const removeVar = (id: string) => {
    setVars((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("unitCheckerTitle")}</div>
      <label className="field">
        <span>{t("unitCheckerExpression")}</span>
        <input type="text" value={expr} onChange={(event) => setExpr(event.target.value)} />
      </label>
      <label className="field" style={{ marginTop: "10px" }}>
        <span>{t("unitCheckerTarget")}</span>
        <input type="text" value={target} onChange={(event) => setTarget(event.target.value)} />
      </label>
      <div className="demo-note">{t("unitCheckerNote")}</div>
      <div className="demo-grid">
        {vars.map((v) => (
          <div key={v.id} className="metric-card">
            <label className="field">
              <span>{t("unitCheckerSymbol")}</span>
              <input type="text" value={v.name} onChange={(event) => updateVar(v.id, { name: event.target.value })} />
            </label>
            <div className="demo-grid">
              <label className="field">
                <span>L</span>
                <input type="number" value={v.L} onChange={(event) => updateVar(v.id, { L: event.target.value })} step="any" />
              </label>
              <label className="field">
                <span>M</span>
                <input type="number" value={v.M} onChange={(event) => updateVar(v.id, { M: event.target.value })} step="any" />
              </label>
              <label className="field">
                <span>T</span>
                <input type="number" value={v.T} onChange={(event) => updateVar(v.id, { T: event.target.value })} step="any" />
              </label>
              <label className="field">
                <span>Th</span>
                <input type="number" value={v.Th} onChange={(event) => updateVar(v.id, { Th: event.target.value })} step="any" />
              </label>
            </div>
            <button type="button" className="control-chip" onClick={() => removeVar(v.id)}>
              {t("unitCheckerRemove")}
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="control-button secondary" onClick={addVar}>
        {t("unitCheckerAdd")}
      </button>
      <div className="demo-output">
        <div className="inline-kv">
          <span className={`pill ${result.valid ? "pill-good" : "pill-bad"}`}>
            {t("unitCheckerDimension")} {dimToString(result.dim)}
          </span>
          {target ? <span className="pill">{t("unitCheckerTargetLabel")} {target}</span> : null}
          {target && result.targetErrors.length === 0 ? (
            <span className={`pill ${result.diffs.length === 0 ? "pill-good" : "pill-bad"}`}>
              {result.diffs.length === 0 ? t("unitCheckerTargetMatch") : t("unitCheckerTargetMismatch")}
            </span>
          ) : null}
        </div>
        {!result.valid ? <div className="demo-note">{result.error}</div> : null}
        {target && result.targetErrors.length ? (
          <div className="demo-note">
            {t("unitCheckerTargetInvalid")} {result.targetErrors.join(", ")}
          </div>
        ) : null}
        {target && result.diffs.length ? (
          <div className="demo-note">
            {t("unitCheckerMismatchDetail")}{" "}
            {result.diffs
              .map((diff) => `${diff.key}: ${diff.got.toFixed(2)} → ${diff.expected.toFixed(2)}`)
              .join(" | ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
