import { NextResponse } from "next/server";

export const runtime = "nodejs";

const resolveBackendUrl = () => {
  const envUrl = process.env.CFD_BACKEND_URL || process.env.NEXT_PUBLIC_CFD_BACKEND_URL;
  if (envUrl) return envUrl;
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8000";
  }
  return "";
};

const BACKEND_URL = resolveBackendUrl();

const buildAnalyticField = (
  flowSpeed: number,
  radius: number,
  resolution: number,
  flowDir: [number, number, number] = [1, 0, 0]
) => {
  const grid = Math.min(64, Math.max(18, Math.floor(resolution * 0.65)));
  const nx = grid;
  const ny = Math.max(10, Math.floor(grid * 0.8));
  const nz = Math.max(8, Math.floor(grid * 0.8));
  const origin: [number, number, number] = [-4.5, -3.0, -3.0];
  const spacing = 9 / (grid - 1);
  const ux: number[] = [];
  const uy: number[] = [];
  const uz: number[] = [];
  const p: number[] = [];
  const dirLen = Math.hypot(flowDir[0], flowDir[1], flowDir[2]) || 1;
  const dirX = flowDir[0] / dirLen;
  const dirY = flowDir[1] / dirLen;
  const dirZ = flowDir[2] / dirLen;
  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const x = origin[0] + i * spacing;
        const y = origin[1] + j * spacing;
        const z = origin[2] + k * spacing;
        const r2 = x * x + y * y + z * z + 1e-5;
        const r = Math.sqrt(r2);
        const n1 = x / r;
        const n2 = y / r;
        const n3 = z / r;
        const Ux = flowSpeed * dirX;
        const Uy = flowSpeed * dirY;
        const Uz = flowSpeed * dirZ;
        const dot = Ux * n1 + Uy * n2 + Uz * n3;
        const factor = (radius * radius * radius) / (2 * r2 * r);
        let vx = Ux + factor * (3 * dot * n1 - Ux);
        let vy = Uy + factor * (3 * dot * n2 - Uy);
        let vz = Uz + factor * (3 * dot * n3 - Uz);
        const s = x * dirX + y * dirY + z * dirZ;
        if (s > radius * 0.6) {
          const wakeDist = s - radius;
          const wakeFade = Math.exp(-wakeDist * 0.6);
          vx *= 1 - 0.25 * wakeFade;
          vy *= 1 - 0.15 * wakeFade;
          vz *= 1 - 0.15 * wakeFade;
          const swirl = (radius * radius) / (r2 + radius * radius) * 0.2 * wakeFade;
          const crossX = dirY * n3 - dirZ * n2;
          const crossY = dirZ * n1 - dirX * n3;
          const crossZ = dirX * n2 - dirY * n1;
          const crossLen = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) || 1;
          vx += swirl * (crossX / crossLen);
          vy += swirl * (crossY / crossLen);
          vz += swirl * (crossZ / crossLen);
        }
        ux.push(vx);
        uy.push(vy);
        uz.push(vz);
        const speed2 = vx * vx + vy * vy + vz * vz;
        const pVal = 0.5 * (flowSpeed * flowSpeed - speed2);
        p.push(pVal);
      }
    }
  }
  return { nx, ny, nz, origin, spacing, ux, uy, uz, p };
};

export async function GET(req: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json({ status: "mock", backendUrl: null });
  }
  try {
    const url = new URL(req.url);
    const meshId = url.searchParams.get("meshId");
    const statusUrl = meshId ? `${BACKEND_URL}/status?meshId=${encodeURIComponent(meshId)}` : `${BACKEND_URL}/status`;
    const res = await fetch(statusUrl);
    if (!res.ok) {
      return NextResponse.json({ status: "error" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ ...data, backendUrl: BACKEND_URL });
  } catch {
    return NextResponse.json({ status: "error", backendUrl: BACKEND_URL }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const engine = String(body.engine ?? "lbm").toLowerCase();
  const requireBackend = Boolean(body.requireBackend);
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
      if (requireBackend) {
        const errorPayload = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorPayload?.error || "CFD backend failed to return a field." },
          { status: 502 }
        );
      }
    } catch {
      if (requireBackend) {
        return NextResponse.json({ error: "CFD backend request failed." }, { status: 502 });
      }
    }
  }
  if (requireBackend) {
    return NextResponse.json(
      { error: "CFD backend not configured. Set CFD_BACKEND_URL to enable OpenFOAM fields." },
      { status: 502 }
    );
  }
  const flowSpeed = Number(body.flowSpeed ?? 1.2);
  const radius = Number(body.radius ?? 0.35);
  const resolution = Number(body.resolution ?? 56);
  const flowDir = Array.isArray(body.flowDir) && body.flowDir.length >= 3 ? body.flowDir : [1, 0, 0];
  const field = buildAnalyticField(
    Number.isFinite(flowSpeed) ? flowSpeed : 1.2,
    Number.isFinite(radius) ? radius : 0.35,
    Number.isFinite(resolution) ? resolution : 56,
    [Number(flowDir[0]) || 1, Number(flowDir[1]) || 0, Number(flowDir[2]) || 0]
  );
  return NextResponse.json({ source: "analytic", field });
}
