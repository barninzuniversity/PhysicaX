"use client";

import { useEffect, useState } from "react";

type Status = {
  status: string;
  backend?: string;
  openfoam?: string;
  openfoamPath?: string;
  openfoamMtime?: number | null;
  openfoamSize?: number | null;
  openfoamPressurePath?: string | null;
  fluidx3d?: string;
  fluidx3dPath?: string;
  fluidx3dMtime?: number | null;
  fluidx3dSize?: number | null;
  backendUrl?: string | null;
};

export function CFDStatusCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      setChecking(true);
      try {
        const res = await fetch("/api/cfd");
        if (!res.ok) {
          setError("CFD backend not reachable.");
          return;
        }
        const data = (await res.json()) as Status;
        setStatus(data);
        setError(null);
        setLastChecked(new Date());
      } catch {
        setError("CFD backend not reachable.");
      } finally {
        setChecking(false);
      }
    };
    load();
  }, []);

  const refresh = async () => {
    setError(null);
    setTestResult(null);
    setChecking(true);
    try {
      const res = await fetch("/api/cfd", { cache: "no-store" });
      if (!res.ok) {
        setError("CFD backend not reachable.");
        return;
      }
      const data = (await res.json()) as Status;
      setStatus(data);
      setLastChecked(new Date());
    } catch {
      setError("CFD backend not reachable.");
    } finally {
      setChecking(false);
    }
  };

  const runTest = async () => {
    setTestBusy(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/cfd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: "lbm", flowSpeed: 1.2, radius: 0.35, resolution: 24, steps: 40, requireBackend: false })
      });
      if (!res.ok) {
        setTestResult("LBM test failed.");
        return;
      }
      const payload = await res.json();
      const field = payload?.field;
      const nx = field?.nx ?? "?";
      const ny = field?.ny ?? "?";
      const nz = field?.nz ?? "?";
      setTestResult(`LBM test ok - source=${payload?.source ?? "unknown"} - grid=${nx}x${ny}x${nz}`);
    } catch {
      setTestResult("LBM test failed.");
    } finally {
      setTestBusy(false);
    }
  };

  const formatBytes = (value?: number | null) => {
    if (!value || !Number.isFinite(value)) return "n/a";
    const mb = value / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatTime = (value?: number | null) => {
    if (!value || !Number.isFinite(value)) return "n/a";
    return new Date(value * 1000).toLocaleString();
  };

  const backendReady = status?.status === "ready";
  const openfoamReady = status?.openfoam === "ready";
  const fluidx3dReady = status?.fluidx3d === "ready";

  const nextStep = error
    ? "Launch the packaged desktop app or start the FastAPI backend manually, then refresh status before running a CFD test."
    : !status
      ? "Wait for the first diagnostics response so PhysicaX can decide whether the local runtime is healthy."
      : !backendReady
        ? "The backend is not fully ready yet. Fix the runtime first, then use the quick LBM smoke test before promoting to OpenFOAM."
        : openfoamReady
          ? "You are ready for the full workflow: run the quick LBM test, then inspect the OpenFOAM sample CSV and streamline outputs."
          : "The backend is healthy. Start with the quick LBM test now, then wire in OpenFOAM export when you need sampled fields.";

  const capabilities = [
    { label: "Interactive backend", ready: backendReady },
    { label: "OpenFOAM artifacts", ready: openfoamReady },
    { label: "GPU solver binary", ready: fluidx3dReady }
  ];

  return (
    <div className="demo-panel">
      <div className="demo-title">CFD Diagnostics</div>
      {error ? <div className="pill pill-bad">{error}</div> : null}
      {!error && !status ? <div className="demo-note">Checking status...</div> : null}
      {status ? (
        <>
          <div className="inline-kv">
            <span className={`pill ${status.status === "ready" ? "pill-good" : ""}`}>status: {status.status}</span>
            <span className="pill">backend: {status.backend ?? "analytic"}</span>
            <span className={`pill ${status.openfoam === "ready" ? "pill-good" : ""}`}>
              openfoam: {status.openfoam ?? "unknown"}
            </span>
            <span className={`pill ${status.fluidx3d === "ready" ? "pill-good" : ""}`}>
              fluidx3d: {status.fluidx3d ?? "unknown"}
            </span>
          </div>
          <div className="mini-table">
            <div className="mini-row header">
              <span>signal</span>
              <span>value</span>
              <span>notes</span>
            </div>
            <div className="mini-row">
              <span>backend url</span>
              <span className="mono">{status.backendUrl ?? "not set"}</span>
              <span>{status.backendUrl ? "connected" : "configure CFD_BACKEND_URL"}</span>
            </div>
            <div className="mini-row">
              <span>openfoam</span>
              <span className="mono">{status.openfoamPath ?? "missing"}</span>
              <span>{formatBytes(status.openfoamSize)} - {formatTime(status.openfoamMtime)}</span>
            </div>
            <div className="mini-row">
              <span>openfoam p</span>
              <span className="mono">{status.openfoamPressurePath ?? "missing"}</span>
              <span>pressure field</span>
            </div>
            <div className="mini-row">
              <span>fluidx3d</span>
              <span className="mono">{status.fluidx3dPath ?? "missing"}</span>
              <span>{formatBytes(status.fluidx3dSize)} - {formatTime(status.fluidx3dMtime)}</span>
            </div>
          </div>
        </>
      ) : null}
      <div className="details-block">
        <strong>Recommended next step</strong>
        <p className="demo-note">{nextStep}</p>
        <div className="pill-grid">
          {capabilities.map((item) => (
            <span key={item.label} className={`pill ${item.ready ? "pill-good" : ""}`}>
              {item.label}: {item.ready ? "ready" : "pending"}
            </span>
          ))}
        </div>
      </div>
      <div className="demo-note">
        Set <span className="mono">CFD_BACKEND_URL</span> (or{" "}
        <span className="mono">NEXT_PUBLIC_CFD_BACKEND_URL</span>) in <span className="mono">.env</span> to connect.
      </div>
      <div className="nav-row">
        <button type="button" className="control-chip" onClick={refresh} disabled={checking}>
          {checking ? "Refreshing..." : "Refresh status"}
        </button>
        <button type="button" className="control-chip" onClick={runTest} disabled={testBusy}>
          {testBusy ? "Running..." : "Run LBM test"}
        </button>
        {lastChecked ? <span className="demo-note">Last checked: {lastChecked.toLocaleTimeString()}</span> : null}
      </div>
      {testResult ? <div className="pill pill-good">{testResult}</div> : null}
    </div>
  );
}
