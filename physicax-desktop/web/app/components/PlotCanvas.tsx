"use client";

import { useEffect, useMemo, useRef } from "react";

export type PlotPoint = { x: number; y: number };
export type PlotSeries = {
  id: string;
  label?: string;
  color?: string;
  points: PlotPoint[];
  mode?: "line" | "scatter";
  fill?: boolean;
  lineWidth?: number;
  dash?: number[];
};

type PlotCanvasProps = {
  series: PlotSeries[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  xTicks?: number;
  yTicks?: number;
};

function padRange(min: number, max: number, pad = 0.08) {
  if (min === max) {
    const delta = Math.abs(min || 1) * 0.5;
    return { min: min - delta, max: max + delta };
  }
  const span = max - min;
  return { min: min - span * pad, max: max + span * pad };
}

export function PlotCanvas({
  series,
  width = 560,
  height = 280,
  xLabel,
  yLabel,
  showGrid = true,
  showLegend,
  xTicks = 5,
  yTicks = 5
}: PlotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasLegend = showLegend ?? series.some((s) => s.label);

  const bounds = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    series.forEach((s) => {
      s.points.forEach((p) => {
        if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
          xs.push(p.x);
          ys.push(p.y);
        }
      });
    });
    if (!xs.length || !ys.length) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const xRange = padRange(Math.min(...xs), Math.max(...xs));
    const yMin = Math.min(...ys, 0);
    const yMax = Math.max(...ys, 0);
    const yRange = padRange(yMin, yMax);
    return { xMin: xRange.min, xMax: xRange.max, yMin: yRange.min, yMax: yRange.max };
  }, [series]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const margin = { left: 48, right: 16, top: 16, bottom: 36 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    const mapX = (x: number) =>
      margin.left + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin || 1)) * plotW;
    const mapY = (y: number) =>
      margin.top + plotH - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin || 1)) * plotH;

    const bg = ctx.createLinearGradient(margin.left, margin.top, margin.left, margin.top + plotH);
    bg.addColorStop(0, "rgba(255,255,255,0.95)");
    bg.addColorStop(1, "rgba(244,240,233,0.85)");
    ctx.fillStyle = bg;
    ctx.fillRect(margin.left, margin.top, plotW, plotH);

    ctx.strokeStyle = "rgba(16,24,32,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotW, plotH);
    ctx.stroke();

    if (showGrid) {
      ctx.strokeStyle = "rgba(16,24,32,0.06)";
      ctx.lineWidth = 1;
      const ticks = 5;
      for (let i = 1; i < ticks; i += 1) {
        const x = margin.left + (plotW * i) / ticks;
        const y = margin.top + (plotH * i) / ticks;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + plotH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + plotW, y);
        ctx.stroke();
      }
    }

    if (bounds.yMin <= 0 && bounds.yMax >= 0) {
      const y0 = mapY(0);
      ctx.strokeStyle = "rgba(11, 18, 32, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(margin.left, y0);
      ctx.lineTo(margin.left + plotW, y0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (bounds.xMin <= 0 && bounds.xMax >= 0) {
      const x0 = mapX(0);
      ctx.strokeStyle = "rgba(11, 18, 32, 0.18)";
      ctx.lineWidth = 1.1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(x0, margin.top);
      ctx.lineTo(x0, margin.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const formatTick = (value: number, span: number) => {
      const absSpan = Math.abs(span);
      if (absSpan < 0.01) {
        return value.toExponential(2);
      }
      if (absSpan < 1) {
        return value.toFixed(3);
      }
      if (absSpan < 10) {
        return value.toFixed(2);
      }
      if (absSpan < 100) {
        return value.toFixed(1);
      }
      return value.toFixed(0);
    };

    ctx.fillStyle = "#4d5b63";
    ctx.font = "12px 'Geist', sans-serif";
    const xSpan = bounds.xMax - bounds.xMin;
    const ySpan = bounds.yMax - bounds.yMin;
    const xStep = xSpan / xTicks;
    const yStep = ySpan / yTicks;
    for (let i = 0; i <= xTicks; i += 1) {
      const xVal = bounds.xMin + xStep * i;
      const x = mapX(xVal);
      ctx.fillText(formatTick(xVal, xSpan), x - 10, height - 12);
    }
    for (let i = 0; i <= yTicks; i += 1) {
      const yVal = bounds.yMin + yStep * i;
      const y = mapY(yVal);
      ctx.fillText(formatTick(yVal, ySpan), 6, y + 4);
    }

    if (xLabel) {
      ctx.fillText(xLabel, margin.left + plotW / 2 - 10, height - 8);
    }
    if (yLabel) {
      ctx.save();
      ctx.translate(12, margin.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    series.forEach((s) => {
      const color = s.color ?? "#1f8a8a";
      const mode = s.mode ?? "line";
      if (mode === "scatter") {
        ctx.fillStyle = color;
        ctx.shadowBlur = 0;
        s.points.forEach((p) => {
          const px = mapX(p.x);
          const py = mapY(p.y);
          ctx.beginPath();
          ctx.arc(px, py, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });
        return;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = s.lineWidth ?? 2;
      ctx.shadowColor = `${color}55`;
      ctx.shadowBlur = 6;
      if (s.dash) {
        ctx.setLineDash(s.dash);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      s.points.forEach((p, index) => {
        const px = mapX(p.x);
        const py = mapY(p.y);
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (s.fill) {
        ctx.lineTo(mapX(s.points[s.points.length - 1]?.x ?? 0), margin.top + plotH);
        ctx.lineTo(mapX(s.points[0]?.x ?? 0), margin.top + plotH);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + plotH);
        gradient.addColorStop(0, `${color}55`);
        gradient.addColorStop(1, `${color}10`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    });
  }, [series, bounds, width, height, xLabel, yLabel, showGrid, xTicks, yTicks]);

  return (
    <div className="plot-frame">
      <canvas ref={canvasRef} width={width} height={height} />
      {hasLegend && (
        <div className="plot-legend">
          {series
            .filter((item) => item.label)
            .map((item) => (
              <div key={item.id} className="legend-item">
                <span className="legend-swatch" style={{ background: item.color ?? "#1f8a8a" }} />
                <span>{item.label}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
