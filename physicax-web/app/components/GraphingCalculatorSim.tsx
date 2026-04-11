"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
import { useLocale } from "./LocaleProvider";

const math = create(all);
math.import(
  {
    ln: (value: number) => math.log(value)
  },
  { override: true }
);

const normalizeExpr = (expr: string) => expr.replace(/\bln\s*\(/g, "log(");

type GraphFn = {
  id: string;
  expr: string;
  color: string;
  enabled: boolean;
  showDerivative: boolean;
  derivativeColor: string;
  showIntegral: boolean;
  integralColor: string;
};

type Tool = "select" | "point" | "line" | "circle" | "measure" | "pan" | "tangent";

type Point = { id: string; x: number; y: number };

type Line = { id: string; x1: number; y1: number; x2: number; y2: number };

type Circle = { id: string; x: number; y: number; r: number };

type Measurement = { id: string; x1: number; y1: number; x2: number; y2: number };

const palette = ["#2563eb", "#16a34a", "#f97316", "#7c3aed", "#0f766e", "#ef4444", "#0ea5e9"];

const safeNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function GraphingCalculatorSim() {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [exprInput, setExprInput] = useState("sin(x)");
  const [functions, setFunctions] = useState<GraphFn[]>([
    {
      id: "f1",
      expr: "sin(x)",
      color: "#2563eb",
      enabled: true,
      showDerivative: false,
      derivativeColor: "#f97316",
      showIntegral: false,
      integralColor: "#16a34a"
    },
    {
      id: "f2",
      expr: "0.3*x^2",
      color: "#16a34a",
      enabled: true,
      showDerivative: false,
      derivativeColor: "#f97316",
      showIntegral: false,
      integralColor: "#0ea5e9"
    }
  ]);
  const [xMin, setXMin] = useState("-10");
  const [xMax, setXMax] = useState("10");
  const [yMin, setYMin] = useState("-6");
  const [yMax, setYMax] = useState("6");
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridStep, setGridStep] = useState("1");
  const [tool, setTool] = useState<Tool>("select");
  const [points, setPoints] = useState<Point[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [tempPoint, setTempPoint] = useState<Point | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [tableFn, setTableFn] = useState("f1");
  const [tableStep, setTableStep] = useState("1");
  const [size, setSize] = useState({ width: 960, height: 620 });
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<"tools" | "functions" | "analysis" | "tables">("functions");
  const [intersectionA, setIntersectionA] = useState("f1");
  const [intersectionB, setIntersectionB] = useState("f2");

  const [paramA, setParamA] = useState("1");
  const [paramB, setParamB] = useState("1");
  const [paramC, setParamC] = useState("0");
  const [paramD, setParamD] = useState("0");

  const [showTangent, setShowTangent] = useState(false);
  const [tangentFn, setTangentFn] = useState("f1");
  const [tangentX, setTangentX] = useState("0");
  const [showArea, setShowArea] = useState(false);
  const [areaFn, setAreaFn] = useState("f1");
  const [areaX0, setAreaX0] = useState("-2");
  const [areaX1, setAreaX1] = useState("2");

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentRect;
      if (box.width > 0 && box.height > 0) {
        setSize({ width: box.width, height: box.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const view = useMemo(() => {
    const minX = safeNumber(xMin, -10);
    const maxX = safeNumber(xMax, 10);
    const minY = safeNumber(yMin, -6);
    const maxY = safeNumber(yMax, 6);
    return {
      x0: Math.min(minX, maxX - 0.1),
      x1: Math.max(maxX, minX + 0.1),
      y0: Math.min(minY, maxY - 0.1),
      y1: Math.max(maxY, minY + 0.1)
    };
  }, [xMin, xMax, yMin, yMax]);

  const params = useMemo(() => {
    return {
      a: safeNumber(paramA, 1),
      b: safeNumber(paramB, 1),
      c: safeNumber(paramC, 0),
      d: safeNumber(paramD, 0)
    };
  }, [paramA, paramB, paramC, paramD]);

  const compiledFns = useMemo(() => {
    return functions.map((fn) => {
      const normalized = normalizeExpr(fn.expr);
      let compiled: any = null;
      let derivative: any = null;
      try {
        compiled = math.compile(normalized);
      } catch {
        compiled = null;
      }
      try {
        derivative = math.derivative(normalized, "x").compile();
      } catch {
        derivative = null;
      }
      return { ...fn, compiled, derivative };
    });
  }, [functions]);

  const sampleData = useMemo(() => {
    const samples = 360;
    const dx = (view.x1 - view.x0) / (samples - 1);
    const xs = Array.from({ length: samples }, (_, i) => view.x0 + i * dx);

    const series = compiledFns.map((fn) => {
      const values = xs.map((x) => {
        if (!fn.compiled) return NaN;
        try {
          const v = fn.compiled.evaluate({ x, ...params });
          return Number.isFinite(v) ? Number(v) : NaN;
        } catch {
          return NaN;
        }
      });

      const derivativeValues = xs.map((x, i) => {
        if (!fn.showDerivative) return NaN;
        if (fn.derivative) {
          try {
            const v = fn.derivative.evaluate({ x, ...params });
            return Number.isFinite(v) ? Number(v) : NaN;
          } catch {
            return NaN;
          }
        }
        const left = i > 0 ? values[i - 1] : values[i];
        const right = i < values.length - 1 ? values[i + 1] : values[i];
        return (right - left) / (2 * dx);
      });

      let integralValues: number[] = [];
      if (fn.showIntegral) {
        let acc = 0;
        integralValues = values.map((val, i) => {
          if (!Number.isFinite(val)) return NaN;
          if (i === 0) return 0;
          const prev = values[i - 1];
          if (!Number.isFinite(prev)) return NaN;
          acc += (prev + val) * 0.5 * dx;
          return acc;
        });
      } else {
        integralValues = xs.map(() => NaN);
      }

      return { xs, values, derivativeValues, integralValues };
    });
    return { xs, dx, series };
  }, [compiledFns, params, view]);

  const areaValue = useMemo(() => {
    if (!showArea) return null;
    const target = compiledFns.find((fn) => fn.id === areaFn);
    if (!target?.compiled) return null;
    const a = safeNumber(areaX0, -1);
    const b = safeNumber(areaX1, 1);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null;
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const steps = 320;
    const dx = (max - min) / steps;
    let acc = 0;
    for (let i = 0; i <= steps; i += 1) {
      const x = min + i * dx;
      let v = NaN;
      try {
        v = target.compiled.evaluate({ x, ...params });
      } catch {
        v = NaN;
      }
      if (!Number.isFinite(v)) continue;
      const weight = i === 0 || i === steps ? 0.5 : 1;
      acc += weight * v * dx;
    }
    return acc;
  }, [showArea, areaFn, areaX0, areaX1, compiledFns, params]);

  const intersections = useMemo(() => {
    const fnA = compiledFns.find((fn) => fn.id === intersectionA);
    const fnB = compiledFns.find((fn) => fn.id === intersectionB);
    if (!fnA?.compiled || !fnB?.compiled) return [] as { x: number; y: number }[];
    const xs = sampleData.xs;
    const out: { x: number; y: number }[] = [];
    for (let i = 1; i < xs.length; i += 1) {
      const x0 = xs[i - 1];
      const x1 = xs[i];
      let f0 = NaN;
      let f1 = NaN;
      let g0 = NaN;
      let g1 = NaN;
      try {
        f0 = fnA.compiled.evaluate({ x: x0, ...params });
        f1 = fnA.compiled.evaluate({ x: x1, ...params });
        g0 = fnB.compiled.evaluate({ x: x0, ...params });
        g1 = fnB.compiled.evaluate({ x: x1, ...params });
      } catch {
        continue;
      }
      if (![f0, f1, g0, g1].every((v) => Number.isFinite(v))) continue;
      const diff0 = f0 - g0;
      const diff1 = f1 - g1;
      if (diff0 === 0) {
        out.push({ x: x0, y: f0 });
      }
      if (diff0 * diff1 < 0) {
        const t = diff0 / (diff0 - diff1);
        const xi = x0 + (x1 - x0) * t;
        const yi = f0 + (f1 - f0) * t;
        out.push({ x: xi, y: yi });
      }
    }
    return out.slice(0, 8);
  }, [compiledFns, intersectionA, intersectionB, sampleData.xs, params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);

    const toCanvasX = (x: number) => ((x - view.x0) / (view.x1 - view.x0)) * size.width;
    const toCanvasY = (y: number) => size.height - ((y - view.y0) / (view.y1 - view.y0)) * size.height;

    if (showGrid) {
      const step = Math.max(0.1, safeNumber(gridStep, 1));
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 1;
      for (let x = Math.ceil(view.x0 / step) * step; x <= view.x1; x += step) {
        const cx = toCanvasX(x);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, size.height);
        ctx.stroke();
      }
      for (let y = Math.ceil(view.y0 / step) * step; y <= view.y1; y += step) {
        const cy = toCanvasY(y);
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(size.width, cy);
        ctx.stroke();
      }
    }

    if (showAxes) {
      ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
      ctx.lineWidth = 1.5;
      const xAxis = toCanvasY(0);
      const yAxis = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(0, xAxis);
      ctx.lineTo(size.width, xAxis);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(yAxis, 0);
      ctx.lineTo(yAxis, size.height);
      ctx.stroke();
    }

    compiledFns.forEach((fn, idx) => {
      if (!fn.enabled) return;
      const series = sampleData.series[idx];
      if (!series) return;
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = fn.color;
      ctx.beginPath();
      series.xs.forEach((x, i) => {
        const y = series.values[i];
        if (!Number.isFinite(y)) return;
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      if (fn.showDerivative) {
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = fn.derivativeColor;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        series.xs.forEach((x, i) => {
          const y = series.derivativeValues[i];
          if (!Number.isFinite(y)) return;
          const cx = toCanvasX(x);
          const cy = toCanvasY(y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (fn.showIntegral) {
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = fn.integralColor;
        ctx.beginPath();
        series.xs.forEach((x, i) => {
          const y = series.integralValues[i];
          if (!Number.isFinite(y)) return;
          const cx = toCanvasX(x);
          const cy = toCanvasY(y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        });
        ctx.stroke();
      }
    });

    if (showArea) {
      const target = compiledFns.find((fn) => fn.id === areaFn);
      if (target?.compiled) {
        const a = safeNumber(areaX0, -2);
        const b = safeNumber(areaX1, 2);
        const min = Math.min(a, b);
        const max = Math.max(a, b);
        const steps = 120;
        ctx.fillStyle = "rgba(59, 130, 246, 0.18)";
        ctx.beginPath();
        for (let i = 0; i <= steps; i += 1) {
          const x = min + (max - min) * (i / steps);
          let y = NaN;
          try {
            y = target.compiled.evaluate({ x, ...params });
          } catch {
            y = NaN;
          }
          if (!Number.isFinite(y)) continue;
          const cx = toCanvasX(x);
          const cy = toCanvasY(y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.lineTo(toCanvasX(max), toCanvasY(0));
        ctx.lineTo(toCanvasX(min), toCanvasY(0));
        ctx.closePath();
        ctx.fill();
      }
    }

    if (showTangent) {
      const target = compiledFns.find((fn) => fn.id === tangentFn);
      if (target?.compiled) {
        const x0Val = safeNumber(tangentX, 0);
        let y0Val = NaN;
        try {
          y0Val = target.compiled.evaluate({ x: x0Val, ...params });
        } catch {
          y0Val = NaN;
        }
        if (Number.isFinite(y0Val)) {
          let slope = 0;
          if (target.derivative) {
            try {
              slope = target.derivative.evaluate({ x: x0Val, ...params });
            } catch {
              slope = 0;
            }
          } else {
            const h = (view.x1 - view.x0) / 300;
            try {
              const yl = target.compiled.evaluate({ x: x0Val - h, ...params });
              const yr = target.compiled.evaluate({ x: x0Val + h, ...params });
              slope = (yr - yl) / (2 * h);
            } catch {
              slope = 0;
            }
          }
          const xLeft = view.x0;
          const xRight = view.x1;
          const yLeft = y0Val + slope * (xLeft - x0Val);
          const yRight = y0Val + slope * (xRight - x0Val);
          ctx.strokeStyle = "rgba(15, 118, 110, 0.85)";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(toCanvasX(xLeft), toCanvasY(yLeft));
          ctx.lineTo(toCanvasX(xRight), toCanvasY(yRight));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    ctx.strokeStyle = "rgba(15, 23, 42, 0.55)";
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    points.forEach((pt) => {
      const cx = toCanvasX(pt.x);
      const cy = toCanvasY(pt.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.lineWidth = 1.4;
    lines.forEach((ln) => {
      ctx.strokeStyle = "rgba(37, 99, 235, 0.7)";
      ctx.beginPath();
      ctx.moveTo(toCanvasX(ln.x1), toCanvasY(ln.y1));
      ctx.lineTo(toCanvasX(ln.x2), toCanvasY(ln.y2));
      ctx.stroke();
    });

    circles.forEach((c) => {
      ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
      ctx.beginPath();
      const r = (c.r / (view.x1 - view.x0)) * size.width;
      ctx.arc(toCanvasX(c.x), toCanvasY(c.y), Math.abs(r), 0, Math.PI * 2);
      ctx.stroke();
    });

    measurements.forEach((m) => {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.8)";
      ctx.beginPath();
      ctx.moveTo(toCanvasX(m.x1), toCanvasY(m.y1));
      ctx.lineTo(toCanvasX(m.x2), toCanvasY(m.y2));
      ctx.stroke();
      const dist = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.font = "12px var(--font-geist, 'Segoe UI', sans-serif)";
      ctx.fillText(dist.toFixed(3), toCanvasX((m.x1 + m.x2) / 2) + 6, toCanvasY((m.y1 + m.y2) / 2) - 6);
    });

    intersections.forEach((pt) => {
      ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
      ctx.beginPath();
      ctx.arc(toCanvasX(pt.x), toCanvasY(pt.y), 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [
    size,
    view,
    showGrid,
    showAxes,
    gridStep,
    compiledFns,
    sampleData,
    points,
    lines,
    circles,
    measurements,
    intersections,
    showTangent,
    tangentFn,
    tangentX,
    showArea,
    areaFn,
    areaX0,
    areaX1,
    params
  ]);

  const worldFromEvent = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * (view.x1 - view.x0) + view.x0;
    const y = (1 - (event.clientY - rect.top) / rect.height) * (view.y1 - view.y0) + view.y0;
    return { x, y };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = worldFromEvent(event);
    const step = Math.max(0.1, safeNumber(gridStep, 1));
    const px = snapToGrid ? Math.round(x / step) * step : x;
    const py = snapToGrid ? Math.round(y / step) * step : y;

    if (tool === "select") {
      const threshold = 12;
      const rect = event.currentTarget.getBoundingClientRect();
      const cx = ((px - view.x0) / (view.x1 - view.x0)) * rect.width;
      const cy = (1 - (py - view.y0) / (view.y1 - view.y0)) * rect.height;
      const candidate = points.find((pt) => {
        const pcx = ((pt.x - view.x0) / (view.x1 - view.x0)) * rect.width;
        const pcy = (1 - (pt.y - view.y0) / (view.y1 - view.y0)) * rect.height;
        return Math.hypot(pcx - cx, pcy - cy) < threshold;
      });
      if (candidate) {
        setDragId(candidate.id);
      }
      return;
    }

    if (tool === "pan") {
      setPanAnchor({
        x: event.clientX,
        y: event.clientY,
        view: { ...view }
      });
      return;
    }

    if (tool === "tangent") {
      setShowTangent(true);
      setTangentX(px.toFixed(3));
      return;
    }

    if (tool === "point") {
      setPoints((prev) => [...prev, { id: `p${Date.now()}`, x: px, y: py }]);
      return;
    }

    if (tool === "line") {
      if (!tempPoint) {
        setTempPoint({ id: "temp", x: px, y: py });
      } else {
        setLines((prev) => [...prev, { id: `l${Date.now()}`, x1: tempPoint.x, y1: tempPoint.y, x2: px, y2: py }]);
        setTempPoint(null);
      }
      return;
    }

    if (tool === "circle") {
      if (!tempPoint) {
        setTempPoint({ id: "temp", x: px, y: py });
      } else {
        const radius = Math.hypot(px - tempPoint.x, py - tempPoint.y);
        setCircles((prev) => [...prev, { id: `c${Date.now()}`, x: tempPoint.x, y: tempPoint.y, r: radius }]);
        setTempPoint(null);
      }
      return;
    }

    if (tool === "measure") {
      if (!tempPoint) {
        setTempPoint({ id: "temp", x: px, y: py });
      } else {
        setMeasurements((prev) => [...prev, { id: `m${Date.now()}`, x1: tempPoint.x, y1: tempPoint.y, x2: px, y2: py }]);
        setTempPoint(null);
      }
    }
  };

  const [panAnchor, setPanAnchor] = useState<{
    x: number;
    y: number;
    view: { x0: number; x1: number; y0: number; y1: number };
  } | null>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = worldFromEvent(event);
    setCursor({ x, y });
    if (dragId) {
      const step = Math.max(0.1, safeNumber(gridStep, 1));
      const px = snapToGrid ? Math.round(x / step) * step : x;
      const py = snapToGrid ? Math.round(y / step) * step : y;
      setPoints((prev) => prev.map((pt) => (pt.id === dragId ? { ...pt, x: px, y: py } : pt)));
    }
    if (panAnchor) {
      const dx = (event.clientX - panAnchor.x) / size.width;
      const dy = (event.clientY - panAnchor.y) / size.height;
      const spanX = panAnchor.view.x1 - panAnchor.view.x0;
      const spanY = panAnchor.view.y1 - panAnchor.view.y0;
      const newX0 = panAnchor.view.x0 - dx * spanX;
      const newX1 = panAnchor.view.x1 - dx * spanX;
      const newY0 = panAnchor.view.y0 + dy * spanY;
      const newY1 = panAnchor.view.y1 + dy * spanY;
      setXMin(newX0.toFixed(3));
      setXMax(newX1.toFixed(3));
      setYMin(newY0.toFixed(3));
      setYMax(newY1.toFixed(3));
    }
  };

  const handleMouseUp = () => {
    setDragId(null);
    setPanAnchor(null);
  };

  const zoom = (factor: number) => {
    const cx = (view.x0 + view.x1) / 2;
    const cy = (view.y0 + view.y1) / 2;
    const spanX = (view.x1 - view.x0) * factor;
    const spanY = (view.y1 - view.y0) * factor;
    setXMin((cx - spanX / 2).toFixed(3));
    setXMax((cx + spanX / 2).toFixed(3));
    setYMin((cy - spanY / 2).toFixed(3));
    setYMax((cy + spanY / 2).toFixed(3));
  };

  const resetView = () => {
    setXMin("-10");
    setXMax("10");
    setYMin("-6");
    setYMax("6");
  };

  const addFunction = () => {
    if (!exprInput.trim()) return;
    const id = `f${Date.now()}`;
    const color = palette[functions.length % palette.length];
    setFunctions((prev) => [
      ...prev,
      {
        id,
        expr: exprInput.trim(),
        color,
        enabled: true,
        showDerivative: false,
        derivativeColor: "#f97316",
        showIntegral: false,
        integralColor: "#0ea5e9"
      }
    ]);
    setExprInput("");
  };

  const togglePanel = (tab: "tools" | "functions" | "analysis" | "tables") => {
    setPanelTab(tab);
    setPanelOpen(true);
  };

  return (
    <div className="graphing-shell">
      <div className="graphing-header">
        <div>
          <h3>{t("graphingCalculatorTitle")}</h3>
          <p className="muted">{t("graphingPageIntro")}</p>
        </div>
        <div className="graphing-actions">
          <button className="ghost" onClick={() => togglePanel("functions")}>{t("graphingFunctions")}</button>
          <button className="ghost" onClick={() => togglePanel("tools")}>{t("graphingToolsLabel")}</button>
          <button className="ghost" onClick={() => togglePanel("analysis")}>{t("graphingAnalysis")}</button>
          <button className="ghost" onClick={() => togglePanel("tables")}>{t("graphingFunctionTable")}</button>
        </div>
      </div>

      <div className="graphing-stage" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="graphing-canvas-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="graphing-overlay">
          <div className="graphing-overlay-row">
            <button className="pill" onClick={() => zoom(0.8)}>{t("graphingZoomIn")}</button>
            <button className="pill" onClick={() => zoom(1.25)}>{t("graphingZoomOut")}</button>
            <button className="pill" onClick={resetView}>{t("graphingReset")}</button>
          </div>
          <div className="graphing-overlay-row">
            <label className="chip">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              {t("graphingGrid")}
            </label>
            <label className="chip">
              <input type="checkbox" checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)} />
              {t("graphingAxes")}
            </label>
            <label className="chip">
              <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
              {t("graphingSnap")}
            </label>
          </div>
          <div className="graphing-cursor">
            {t("graphingCursor")}: {cursor ? `${cursor.x.toFixed(2)}, ${cursor.y.toFixed(2)}` : t("graphingCursorIdle")}
          </div>
        </div>
      </div>

      {panelOpen && (
        <div className="graphing-modal">
          <div className="graphing-modal-overlay" onClick={() => setPanelOpen(false)} />
          <div className="graphing-modal-content">
            <div className="graphing-modal-header">
              <div className="graphing-modal-title">{t("graphingCalculatorTitle")}</div>
              <button className="ghost" onClick={() => setPanelOpen(false)}>
                {t("graphingClosePanel")}
              </button>
            </div>
            <div className="graphing-modal-tabs">
              {[
                { id: "functions", label: t("graphingFunctions") },
                { id: "tools", label: t("graphingToolsLabel") },
                { id: "analysis", label: t("graphingAnalysis") },
                { id: "tables", label: t("graphingFunctionTable") }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-pill ${panelTab === tab.id ? "active" : ""}`}
                  onClick={() => setPanelTab(tab.id as typeof panelTab)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="graphing-modal-body">
              {panelTab === "functions" && (
                <div className="graphing-panel-grid">
                  <div className="panel-block">
                    <h4>{t("graphingFunctions")}</h4>
                    <label className="field">
                      {t("graphingFunctionInput")}
                      <input value={exprInput} onChange={(e) => setExprInput(e.target.value)} />
                    </label>
                    <button className="primary" onClick={addFunction}>{t("graphingAdd")}</button>
                    <p className="muted">{t("graphingSyntaxNote")}</p>
                  </div>
                  <div className="panel-block">
                    <h4>{t("graphingFunctions")}</h4>
                    {functions.map((fn) => (
                      <div key={fn.id} className="function-row">
                        <input
                          value={fn.expr}
                          onChange={(e) =>
                            setFunctions((prev) =>
                              prev.map((item) => (item.id === fn.id ? { ...item, expr: e.target.value } : item))
                            )
                          }
                        />
                        <div className="function-row-actions">
                          <label className="color-chip">
                            {t("graphingColor")}
                            <input
                              type="color"
                              value={fn.color}
                              onChange={(e) =>
                                setFunctions((prev) =>
                                  prev.map((item) => (item.id === fn.id ? { ...item, color: e.target.value } : item))
                                )
                              }
                            />
                          </label>
                          <button
                            className={fn.enabled ? "pill" : "pill ghost"}
                            onClick={() =>
                              setFunctions((prev) =>
                                prev.map((item) => (item.id === fn.id ? { ...item, enabled: !item.enabled } : item))
                              )
                            }
                          >
                            {fn.enabled ? t("graphingVisible") : t("graphingHidden")}
                          </button>
                          <button
                            className="pill ghost"
                            onClick={() => setFunctions((prev) => prev.filter((item) => item.id !== fn.id))}
                          >
                            {t("graphingRemove")}
                          </button>
                        </div>
                        <div className="function-row-sub">
                          <label className="chip">
                            <input
                              type="checkbox"
                              checked={fn.showDerivative}
                              onChange={(e) =>
                                setFunctions((prev) =>
                                  prev.map((item) =>
                                    item.id === fn.id ? { ...item, showDerivative: e.target.checked } : item
                                  )
                                )
                              }
                            />
                            {t("graphingDerivative")}
                          </label>
                          <input
                            type="color"
                            value={fn.derivativeColor}
                            onChange={(e) =>
                              setFunctions((prev) =>
                                prev.map((item) =>
                                  item.id === fn.id ? { ...item, derivativeColor: e.target.value } : item
                                )
                              )
                            }
                          />
                          <label className="chip">
                            <input
                              type="checkbox"
                              checked={fn.showIntegral}
                              onChange={(e) =>
                                setFunctions((prev) =>
                                  prev.map((item) =>
                                    item.id === fn.id ? { ...item, showIntegral: e.target.checked } : item
                                  )
                                )
                              }
                            />
                            {t("graphingIntegral")}
                          </label>
                          <input
                            type="color"
                            value={fn.integralColor}
                            onChange={(e) =>
                              setFunctions((prev) =>
                                prev.map((item) =>
                                  item.id === fn.id ? { ...item, integralColor: e.target.value } : item
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {panelTab === "tools" && (
                <div className="graphing-panel-grid">
                  <div className="panel-block">
                    <h4>{t("graphingToolsLabel")}</h4>
                    {["select", "point", "line", "circle", "measure", "pan", "tangent"].map((key) => (
                      <button
                        key={key}
                        className={`pill ${tool === key ? "active" : ""}`}
                        onClick={() => setTool(key as Tool)}
                      >
                        {t(`graphingTool${key.charAt(0).toUpperCase()}${key.slice(1)}` as any)}
                      </button>
                    ))}
                    <p className="muted">{t("graphingToolNote")}</p>
                  </div>
                  <div className="panel-block">
                    <h4>{t("graphingViewLabel")}</h4>
                    <label className="field">
                      {t("graphingGridStep")}
                      <input value={gridStep} onChange={(e) => setGridStep(e.target.value)} />
                    </label>
                    <label className="field">x min<input value={xMin} onChange={(e) => setXMin(e.target.value)} /></label>
                    <label className="field">x max<input value={xMax} onChange={(e) => setXMax(e.target.value)} /></label>
                    <label className="field">y min<input value={yMin} onChange={(e) => setYMin(e.target.value)} /></label>
                    <label className="field">y max<input value={yMax} onChange={(e) => setYMax(e.target.value)} /></label>
                  </div>
                  <div className="panel-block">
                    <h4>{t("graphingGeometry")}</h4>
                    <div className="meta-grid">
                      <span>{t("graphingPointsLabel")} {points.length}</span>
                      <span>{t("graphingLinesLabel")} {lines.length}</span>
                      <span>{t("graphingCirclesLabel")} {circles.length}</span>
                      <span>{t("graphingMeasurementsLabel")} {measurements.length}</span>
                    </div>
                    <button className="ghost" onClick={() => { setPoints([]); setLines([]); setCircles([]); setMeasurements([]); }}>
                      {t("graphingReset")}
                    </button>
                  </div>
                </div>
              )}

              {panelTab === "analysis" && (
                <div className="graphing-panel-grid">
                  <div className="panel-block">
                    <h4>{t("graphingParameters")}</h4>
                    <label className="field">a<input value={paramA} onChange={(e) => setParamA(e.target.value)} /></label>
                    <label className="field">b<input value={paramB} onChange={(e) => setParamB(e.target.value)} /></label>
                    <label className="field">c<input value={paramC} onChange={(e) => setParamC(e.target.value)} /></label>
                    <label className="field">d<input value={paramD} onChange={(e) => setParamD(e.target.value)} /></label>
                    <p className="muted">{t("graphingParamsNote")}</p>
                  </div>
                  <div className="panel-block">
                    <h4>{t("graphingAnalysis")}</h4>
                    <label className="field">
                      {t("graphingTangentFn")}
                      <select value={tangentFn} onChange={(e) => setTangentFn(e.target.value)}>
                        {functions.map((fn) => (
                          <option key={fn.id} value={fn.id}>{fn.expr}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      {t("graphingTangentX")}
                      <input value={tangentX} onChange={(e) => setTangentX(e.target.value)} />
                    </label>
                    <label className="chip">
                      <input type="checkbox" checked={showTangent} onChange={(e) => setShowTangent(e.target.checked)} />
                      {t("graphingTangent")}
                    </label>

                    <label className="field">
                      {t("graphingAreaFn")}
                      <select value={areaFn} onChange={(e) => setAreaFn(e.target.value)}>
                        {functions.map((fn) => (
                          <option key={fn.id} value={fn.id}>{fn.expr}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      {t("graphingAreaX0")}
                      <input value={areaX0} onChange={(e) => setAreaX0(e.target.value)} />
                    </label>
                    <label className="field">
                      {t("graphingAreaX1")}
                      <input value={areaX1} onChange={(e) => setAreaX1(e.target.value)} />
                    </label>
                    <label className="chip">
                      <input type="checkbox" checked={showArea} onChange={(e) => setShowArea(e.target.checked)} />
                      {t("graphingArea")}
                    </label>
                    {areaValue !== null && (
                      <div className="metric">{t("graphingAreaValue")} {areaValue.toFixed(4)}</div>
                    )}
                  </div>
                  <div className="panel-block">
                    <h4>{t("graphingIntersections")}</h4>
                    <label className="field">
                      {t("graphingFunctionA")}
                      <select value={intersectionA} onChange={(e) => setIntersectionA(e.target.value)}>
                        {functions.map((fn) => (
                          <option key={fn.id} value={fn.id}>{fn.expr}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      {t("graphingFunctionB")}
                      <select value={intersectionB} onChange={(e) => setIntersectionB(e.target.value)}>
                        {functions.map((fn) => (
                          <option key={fn.id} value={fn.id}>{fn.expr}</option>
                        ))}
                      </select>
                    </label>
                    <div className="meta-grid">
                      {intersections.length === 0 ? (
                        <span className="muted">{t("graphingIntersectionsFound")} 0</span>
                      ) : (
                        intersections.map((pt, idx) => (
                          <span key={`${pt.x}-${idx}`}>{pt.x.toFixed(2)}, {pt.y.toFixed(2)}</span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {panelTab === "tables" && (
                <div className="graphing-panel-grid">
                  <div className="panel-block">
                    <h4>{t("graphingFunctionTable")}</h4>
                    <label className="field">
                      {t("graphingFunction")}
                      <select value={tableFn} onChange={(e) => setTableFn(e.target.value)}>
                        {functions.map((fn) => (
                          <option key={fn.id} value={fn.id}>{fn.expr}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      {t("graphingStep")}
                      <input value={tableStep} onChange={(e) => setTableStep(e.target.value)} />
                    </label>
                    <div className="table-grid">
                      {(() => {
                        const target = compiledFns.find((fn) => fn.id === tableFn);
                        if (!target?.compiled) return <span className="muted">-</span>;
                        const step = Math.max(0.1, safeNumber(tableStep, 1));
                        const rows = [] as React.ReactNode[];
                        for (let x = view.x0; x <= view.x1; x += step) {
                          let y = NaN;
                          try {
                            y = target.compiled.evaluate({ x, ...params });
                          } catch {
                            y = NaN;
                          }
                          rows.push(
                            <div key={`row-${x}`} className="table-row">
                              <span>{x.toFixed(2)}</span>
                              <span>{Number.isFinite(y) ? y.toFixed(3) : "-"}</span>
                            </div>
                          );
                          if (rows.length > 28) break;
                        }
                        return rows;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
