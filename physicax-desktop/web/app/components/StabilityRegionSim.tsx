"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Method = "euler" | "heun" | "rk4";

const methods: { id: Method; label: string }[] = [
  { id: "euler", label: "Euler (RK1)" },
  { id: "heun", label: "Heun (RK2)" },
  { id: "rk4", label: "RK4" }
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function StabilityRegionSim() {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [method, setMethod] = useState<Method>("rk4");
  const [xMin, setXMin] = useState("-4");
  const [xMax, setXMax] = useState("4");
  const [yMin, setYMin] = useState("-4");
  const [yMax, setYMax] = useState("4");
  const [resolution, setResolution] = useState("220");

  const view = useMemo(() => {
    const x0 = Number(xMin);
    const x1 = Number(xMax);
    const y0 = Number(yMin);
    const y1 = Number(yMax);
    if (![x0, x1, y0, y1].every(Number.isFinite) || x0 >= x1 || y0 >= y1) {
      return { x0: -4, x1: 4, y0: -4, y1: 4 };
    }
    return { x0, x1, y0, y1 };
  }, [xMin, xMax, yMin, yMax]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth || 720;
    const height = 520;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "520px";

    const res = clamp(Math.floor(Number(resolution) || 220), 120, 420);
    const dx = (view.x1 - view.x0) / res;
    const dy = (view.y1 - view.y0) / res;

    const R = (x: number, y: number) => {
      const z = { re: x, im: y };
      const mult = (a: { re: number; im: number }, b: { re: number; im: number }) => ({
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re
      });
      const add = (a: { re: number; im: number }, b: { re: number; im: number }) => ({
        re: a.re + b.re,
        im: a.im + b.im
      });

      const z2 = mult(z, z);
      if (method === "euler") {
        return add({ re: 1, im: 0 }, z);
      }
      if (method === "heun") {
        return add(add({ re: 1, im: 0 }, z), { re: 0.5 * z2.re, im: 0.5 * z2.im });
      }
      const z3 = mult(z2, z);
      const z4 = mult(z3, z);
      return {
        re: 1 + z.re + 0.5 * z2.re + (1 / 6) * z3.re + (1 / 24) * z4.re,
        im: z.im + 0.5 * z2.im + (1 / 6) * z3.im + (1 / 24) * z4.im
      };
    };

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.fillRect(0, 0, width, height);

    for (let iy = 0; iy < res; iy += 1) {
      for (let ix = 0; ix < res; ix += 1) {
        const x = view.x0 + ix * dx;
        const y = view.y0 + (res - 1 - iy) * dy;
        const rz = R(x, y);
        const mag = Math.hypot(rz.re, rz.im);
        if (mag <= 1) {
          ctx.fillStyle = "rgba(37, 99, 235, 0.35)";
        } else {
          const fade = clamp(1 - (mag - 1) / 4, 0, 1);
          ctx.fillStyle = `rgba(148, 163, 184, ${0.08 + fade * 0.16})`;
        }
        const sx = Math.floor((ix / res) * width);
        const sy = Math.floor((iy / res) * height);
        ctx.fillRect(sx, sy, Math.ceil(width / res), Math.ceil(height / res));
      }
    }

    const axisX = (-view.x0 / (view.x1 - view.x0)) * width;
    const axisY = (view.y1 / (view.y1 - view.y0)) * height;
    ctx.strokeStyle = "rgba(15, 23, 42, 0.3)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();
  }, [method, view, resolution]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("stabilityRegionTitle")}</div>
      <div className="demo-grid">
        <label className="field span-2">
          <span>{t("stabilityRegionMethod")}</span>
          <select value={method} onChange={(event) => setMethod(event.target.value as Method)}>
            {methods.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("stabilityRegionXmin")}</span>
          <input type="number" value={xMin} onChange={(event) => setXMin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("stabilityRegionXmax")}</span>
          <input type="number" value={xMax} onChange={(event) => setXMax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("stabilityRegionYmin")}</span>
          <input type="number" value={yMin} onChange={(event) => setYMin(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("stabilityRegionYmax")}</span>
          <input type="number" value={yMax} onChange={(event) => setYMax(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>{t("stabilityRegionResolution")}</span>
          <input type="number" value={resolution} onChange={(event) => setResolution(event.target.value)} step="1" />
        </label>
      </div>
      <div className="demo-note">{t("stabilityRegionNote")}</div>
      <div className="panel-canvas">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
