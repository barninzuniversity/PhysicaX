/* eslint-disable no-restricted-globals */
let pyodideReady = null;
let pyodide = null;

const initPyodide = async () => {
  if (pyodideReady) return pyodideReady;
  pyodideReady = (async () => {
    importScripts("/pyodide/pyodide.js");
    pyodide = await self.loadPyodide({ indexURL: "/pyodide/" });
    await pyodide.loadPackage(["sympy"]);
    await pyodide.runPythonAsync(`
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr
from sympy.physics import units as u
from sympy.physics.units import convert_to

def _apply_assumptions(assumptions):
    sym_map = {}
    for name, opts in (assumptions or {}).items():
        sym_map[name] = sp.symbols(name, **opts)
    return sym_map

def _parse_equation(expr_str, local_dict):
    if "=" in expr_str:
        parts = expr_str.split("=")
        if len(parts) == 2:
            left = parse_expr(parts[0], local_dict=local_dict)
            right = parse_expr(parts[1], local_dict=local_dict)
            return sp.Eq(left, right)
    return parse_expr(expr_str, local_dict=local_dict)

def _parse_equations(expr_str, local_dict):
    if ";" in expr_str:
        items = [s.strip() for s in expr_str.split(";") if s.strip()]
        return [_parse_equation(item, local_dict) for item in items]
    return _parse_equation(expr_str, local_dict)

def _steps(label, expr):
    try:
        return {"label": label, "latex": sp.latex(expr), "text": str(expr)}
    except Exception:
        return {"label": label, "latex": "", "text": str(expr)}

def run_payload(payload):
    expr_str = payload.get("expr", "")
    op = payload.get("op", "eval")
    var = payload.get("var", "x")
    order = payload.get("order", 1)
    point = payload.get("point", 0)
    bounds = payload.get("bounds")
    target = payload.get("target")
    assumptions = payload.get("assumptions", {})
    subs = payload.get("subs", {})
    limit_dir = payload.get("limit_dir", "+")
    steps = []

    sym_map = _apply_assumptions(assumptions)
    expr = _parse_equations(expr_str, sym_map)
    sym = sym_map.get(var, sp.symbols(var))
    steps.append(_steps("input", expr))

    result = None
    if op == "simplify":
        s1 = sp.simplify(expr)
        steps.append(_steps("simplify", s1))
        s2 = sp.together(s1)
        steps.append(_steps("together", s2))
        s3 = sp.factor(s2)
        steps.append(_steps("factor", s3))
        result = s1
    elif op == "expand":
        s1 = sp.expand(expr)
        steps.append(_steps("expand", s1))
        s2 = sp.expand_trig(s1)
        steps.append(_steps("expand_trig", s2))
        result = s1
    elif op == "factor":
        s1 = sp.factor(expr)
        steps.append(_steps("factor", s1))
        s2 = sp.cancel(expr)
        steps.append(_steps("cancel", s2))
        result = s1
    elif op == "diff":
        result = sp.diff(expr, sym, order)
        steps.append(_steps("diff", result))
    elif op == "integrate":
        if bounds and len(bounds) == 2:
            a = parse_expr(str(bounds[0]), local_dict=sym_map)
            b = parse_expr(str(bounds[1]), local_dict=sym_map)
            result = sp.integrate(expr, (sym, a, b))
        else:
            result = sp.integrate(expr, sym)
        steps.append(_steps("integrate", result))
    elif op == "solve":
        vars_list = payload.get("vars")
        if vars_list:
            vars_sym = [sym_map.get(v, sp.symbols(v)) for v in vars_list]
            result = sp.solve(expr, vars_sym)
        else:
            result = sp.solve(expr, sym)
        steps.append(_steps("solve", result))
    elif op == "series":
        result = sp.series(expr, sym, point, order)
        steps.append(_steps("series", result))
    elif op == "limit":
        result = sp.limit(expr, sym, point, dir=limit_dir)
        steps.append(_steps("limit", result))
    elif op == "numeric":
        subs_map = {}
        for name, value in (subs or {}).items():
            try:
                subs_map[sym_map.get(name, sp.symbols(name))] = parse_expr(str(value), local_dict=sym_map)
            except Exception:
                continue
        try:
            result = sp.N(expr.subs(subs_map))
        except Exception:
            result = sp.N(expr)
        steps.append(_steps("numeric", result))
    elif op == "det":
        mat = sp.Matrix(expr)
        result = mat.det()
        steps.append(_steps("det", result))
    elif op == "rref":
        mat = sp.Matrix(expr)
        result = mat.rref()
        steps.append(_steps("rref", result))
    elif op == "eigenvals":
        mat = sp.Matrix(expr)
        result = mat.eigenvals()
        steps.append(_steps("eigenvals", result))
    elif op == "eigenvects":
        mat = sp.Matrix(expr)
        result = mat.eigenvects()
        steps.append(_steps("eigenvects", result))
    elif op == "inv":
        mat = sp.Matrix(expr)
        result = mat.inv()
        steps.append(_steps("inv", result))
    elif op == "transpose":
        mat = sp.Matrix(expr)
        result = mat.T
        steps.append(_steps("transpose", result))
    elif op == "trace":
        mat = sp.Matrix(expr)
        result = mat.trace()
        steps.append(_steps("trace", result))
    elif op == "rank":
        mat = sp.Matrix(expr)
        result = mat.rank()
        steps.append(_steps("rank", result))
    elif op == "units_convert":
        if target:
            target_unit = parse_expr(target, local_dict=u.__dict__)
            result = convert_to(expr, target_unit)
        else:
            result = expr
        steps.append(_steps("units_convert", result))
    else:
        result = expr
        steps.append(_steps("eval", result))

    return {
        "result": str(result),
        "latex": sp.latex(result) if result is not None else "",
        "steps": steps
    }
`);
    return pyodide;
  })();
  return pyodideReady;
};

self.onmessage = async (event) => {
  const { id, type, payload } = event.data || {};
  try {
    if (type === "init") {
      await initPyodide();
      self.postMessage({ id, type: "ready" });
      return;
    }
    await initPyodide();
    pyodide.globals.set("payload", payload || {});
    const result = await pyodide.runPythonAsync("run_payload(payload)");
    const output = result.toJs({ dict_converter: Object.fromEntries });
    result.destroy && result.destroy();
    self.postMessage({ id, type: "result", payload: output });
  } catch (error) {
    self.postMessage({ id, type: "error", error: error?.message ?? String(error) });
  }
};
