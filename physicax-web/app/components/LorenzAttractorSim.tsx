"use client";

import { useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { MathInline } from "./MathBlock";
import { PlotlyPlot } from "./PlotlyPlot";

type Projection = "xy" | "xz" | "yz";

export function LorenzAttractorSim() {
  const [sigma, setSigma] = useState("10");
  const [rho, setRho] = useState("28");
  const [beta, setBeta] = useState("2.6667");
  const [dt, setDt] = useState("0.01");
  const [steps, setSteps] = useState("2000");
  const [projection, setProjection] = useState<Projection>("xy");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  const { points2d, points3d } = useMemo(() => {
    const sigmaVal = Number(sigma);
    const rhoVal = Number(rho);
    const betaVal = Number(beta);
    const dtVal = Number(dt);
    const stepsVal = Math.min(5000, Math.max(200, Math.floor(Number(steps))));
    if (!Number.isFinite(sigmaVal) || !Number.isFinite(rhoVal) || !Number.isFinite(betaVal) || !Number.isFinite(dtVal)) {
      return { points2d: [], points3d: { x: [], y: [], z: [] } };
    }
    if (dtVal <= 0) {
      return { points2d: [], points3d: { x: [], y: [], z: [] } };
    }
    let x = 1;
    let y = 1;
    let z = 1;
    const pts2d: { x: number; y: number }[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    const zs: number[] = [];
    const deriv = (xVal: number, yVal: number, zVal: number) => ({
      dx: sigmaVal * (yVal - xVal),
      dy: xVal * (rhoVal - zVal) - yVal,
      dz: xVal * yVal - betaVal * zVal
    });

    for (let i = 0; i < stepsVal; i += 1) {
      const k1 = deriv(x, y, z);
      const k2 = deriv(x + 0.5 * dtVal * k1.dx, y + 0.5 * dtVal * k1.dy, z + 0.5 * dtVal * k1.dz);
      const k3 = deriv(x + 0.5 * dtVal * k2.dx, y + 0.5 * dtVal * k2.dy, z + 0.5 * dtVal * k2.dz);
      const k4 = deriv(x + dtVal * k3.dx, y + dtVal * k3.dy, z + dtVal * k3.dz);
      x += (dtVal / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
      y += (dtVal / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
      z += (dtVal / 6) * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz);
      if (i > 100) {
        xs.push(x);
        ys.push(y);
        zs.push(z);
        if (projection === "xy") {
          pts2d.push({ x, y });
        } else if (projection === "xz") {
          pts2d.push({ x, y: z });
        } else {
          pts2d.push({ x: y, y: z });
        }
      }
    }
    return { points2d: pts2d, points3d: { x: xs, y: ys, z: zs } };
  }, [sigma, rho, beta, dt, steps, projection]);

  return (
    <div className="demo-panel">
      <div className="demo-title">Lorenz Attractor</div>
      <div className="demo-grid">
        <label className="field">
          <span>sigma</span>
          <input type="number" value={sigma} onChange={(event) => setSigma(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>rho</span>
          <input type="number" value={rho} onChange={(event) => setRho(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>beta</span>
          <input type="number" value={beta} onChange={(event) => setBeta(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>dt</span>
          <input type="number" value={dt} onChange={(event) => setDt(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>steps</span>
          <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>projection</span>
          <select value={projection} onChange={(event) => setProjection(event.target.value as Projection)}>
            <option value="xy">x-y</option>
            <option value="xz">x-z</option>
            <option value="yz">y-z</option>
          </select>
        </label>
        <label className="field">
          <span>view</span>
          <select value={viewMode} onChange={(event) => setViewMode(event.target.value as "2d" | "3d")}>
            <option value="2d">2D projection</option>
            <option value="3d">3D attractor</option>
          </select>
        </label>
      </div>
      <div className="demo-note">
        <MathInline latex={String.raw`x'=\sigma(y-x),\; y'=x(\rho - z)-y,\; z'=xy-\beta z`} />
      </div>
      {viewMode === "3d" ? (
        <PlotlyPlot
          data={[
            {
              x: points3d.x,
              y: points3d.y,
              z: points3d.z,
              type: "scatter3d",
              mode: "lines",
              line: { color: "#2563eb", width: 2 }
            }
          ]}
          layout={{ scene: { xaxis: { title: "x" }, yaxis: { title: "y" }, zaxis: { title: "z" } } }}
        />
      ) : (
        <PlotCanvas
          series={[{ id: "lorenz", points: points2d, color: "#2563eb" }]}
          xLabel={projection[0]}
          yLabel={projection[1]}
        />
      )}
    </div>
  );
}

