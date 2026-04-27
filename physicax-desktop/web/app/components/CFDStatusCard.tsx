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
  const [testTone, setTestTone] = useState<"good" | "bad" | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchWithTimeout = async (input: string, init?: RequestInit, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, {
        cache: "no-store",
        ...init,
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  useEffect(() => {
    const load = async () => {
      setChecking(true);
      try {
        const res = await fetchWithTimeout("/api/cfd");
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
    setTestTone(null);
    setChecking(true);
    try {
      const res = await fetchWithTimeout("/api/cfd");
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
    setTestTone(null);
    try {
      const res = await fetchWithTimeout("/api/cfd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: "lbm", flowSpeed: 1.2, radius: 0.35, resolution: 24, steps: 40, requireBackend: false })
      }, 12000);
      if (!res.ok) {
        setTestTone("bad");
        setTestResult("LBM test failed.");
        return;
      }
      const payload = await res.json();
      const field = payload?.field;
      const nx = field?.nx ?? "?";
      const ny = field?.ny ?? "?";
      const nz = field?.nz ?? "?";
      setTestTone("good");
      setTestResult(`LBM test ok - source=${payload?.source ?? "unknown"} - grid=${nx}x${ny}x${nz}`);
    } catch {
      setTestTone("bad");
      setTestResult("LBM test failed or timed out.");
    } finally {
      setTestBusy(false);
    }
  };

  const formatBytes = (value?: number | null) => {
    if (value == null || !Number.isFinite(value)) return "n/a";
    const mb = value / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatTime = (value?: number | null) => {
    if (value == null || !Number.isFinite(value)) return "n/a";
    return new Date(value * 1000).toLocaleString();
  };

  const backendReady = status?.status === "ready";
  const openfoamReady = status?.openfoam === "ready";
  const fluidx3dReady = status?.fluidx3d === "ready";
  const pressureArtifactReady = Boolean(status?.openfoamPressurePath);
  const confidenceSignals = [
    {
      label: "Backend heartbeat",
      ready: backendReady,
      note: backendReady
        ? "The status endpoint answered with a ready runtime."
        : "Fix reachability and startup issues before interpreting the physics."
    },
    {
      label: "Quick validation lane",
      ready: backendReady,
      note: backendReady
        ? "You can safely use the fast LBM path to check geometry and boundary conditions."
        : "The quick lane is blocked until the local runtime is stable."
    },
    {
      label: "Sampled field artifact",
      ready: openfoamReady,
      note: openfoamReady
        ? "OpenFOAM sampling is available for concrete field review."
        : "Promote into OpenFOAM only after the quick pass already looks sensible."
    },
    {
      label: "Pressure or streamline evidence",
      ready: pressureArtifactReady || fluidx3dReady,
      note:
        pressureArtifactReady || fluidx3dReady
          ? "The heavier export lane has started leaving inspectable evidence behind."
          : "Logs alone are not enough. Wait for pressure or streamline outputs when fidelity matters."
    }
  ];
  const confidenceReadyCount = confidenceSignals.filter((signal) => signal.ready).length;
  const confidenceLabel =
    confidenceReadyCount <= 1
      ? "Runtime bring-up"
      : confidenceReadyCount === 2
        ? "Quick validation"
        : confidenceReadyCount === 3
          ? "Artifact review"
          : "High-confidence export";
  const confidenceSummary =
    confidenceReadyCount <= 1
      ? "Treat this as runtime bring-up. Prove the service is alive before reading solver meaning into failures."
      : confidenceReadyCount === 2
        ? "You have enough confidence for the cheap validation lane. Use the quick LBM run to test the setup before heavier exports."
        : confidenceReadyCount === 3
          ? "The stack is ready for exported artifact review. Inspect the sampled field before deciding the case is trustworthy."
          : "The evidence chain looks strong: runtime, quick validation, and exported artifacts are all visible.";
  const escalationGuidance =
    confidenceReadyCount <= 1
      ? "Stay at the runtime layer: refresh status, verify the backend URL, and do not escalate into OpenFOAM yet."
      : confidenceReadyCount === 2
        ? "Move into the quick LBM test now. If the geometry and boundary conditions look sensible, then promote to OpenFOAM."
        : confidenceReadyCount === 3
          ? "You are in the export-review lane. Compare sampled fields and pressure output before packaging or reporting the run."
          : "You are ready for the strongest local CFD path in PhysicaX: artifact-backed review with portable desktop handoff when needed.";

  const nextStep = error
    ? "Launch the packaged desktop app or start the FastAPI backend manually, then refresh status before running a CFD test."
    : !status
      ? "Wait for the first diagnostics response so PhysicaX can decide whether the local runtime is healthy."
      : !backendReady
        ? "The backend is not fully ready yet. Fix the runtime first, then use the quick LBM smoke test before promoting to OpenFOAM."
        : openfoamReady
          ? "You are ready for the full workflow: run the quick LBM test, then inspect the OpenFOAM sample CSV and streamline outputs."
          : "The backend is healthy. Start with the quick LBM test now, then wire in OpenFOAM export when you need sampled fields.";
  const activeEngine = fluidx3dReady
    ? "FluidX3D export lane"
    : openfoamReady
      ? "OpenFOAM artifact lane"
      : backendReady
        ? status?.backend === "lbm"
          ? "LBM quick-validation lane"
          : `${status?.backend ?? "Local"} runtime lane`
        : "Runtime not ready";
  const artifactFreshness = openfoamReady
    ? `OpenFOAM sample ${formatTime(status?.openfoamMtime)}`
    : fluidx3dReady
      ? `FluidX3D export ${formatTime(status?.fluidx3dMtime)}`
      : "No exported artifacts yet";
  const exportedEvidence = pressureArtifactReady
    ? "Pressure output is present."
    : openfoamReady
      ? "Uniform grid sampling is present."
      : fluidx3dReady
        ? "GPU solver binary is present."
        : "Use the quick validation lane first, then promote into exports.";

  const capabilities = [
    { label: "Interactive backend", ready: backendReady },
    { label: "OpenFOAM artifacts", ready: openfoamReady },
    { label: "GPU solver binary", ready: fluidx3dReady }
  ];

  return (
    <div className="demo-panel cfd-status-shell">
      <div className="demo-title">CFD Diagnostics</div>
      {error ? <div className="pill pill-bad">{error}</div> : null}
      {!error && !status ? <div className="demo-note">Checking status...</div> : null}
      {status ? (
        <>
          <div className="cfd-status-title-row">
            <div>
              <strong>Current runtime</strong>
              <p className="demo-note">
                {backendReady
                  ? "The local CFD stack is answering and ready for the next evidence step."
                  : "Treat this as runtime bring-up until the local solver path answers cleanly."}
              </p>
            </div>
            <div className="cfd-status-pill-row">
              <span className={`pill ${status.status === "ready" ? "pill-good" : ""}`}>status: {status.status}</span>
              <span className="pill">backend: {status.backend ?? "analytic"}</span>
              <span className={`pill ${status.openfoam === "ready" ? "pill-good" : ""}`}>
                openfoam: {status.openfoam ?? "unknown"}
              </span>
              <span className={`pill ${status.fluidx3d === "ready" ? "pill-good" : ""}`}>
                fluidx3d: {status.fluidx3d ?? "unknown"}
              </span>
            </div>
          </div>
          <div className="cfd-status-grid">
            <div className="status-card">
              <strong>Reachability</strong>
              <div className={`pill ${backendReady ? "pill-good" : "pill-bad"}`}>
                {backendReady ? "Healthy local backend" : "Backend needs attention"}
              </div>
              <p className="demo-note">
                {status.backendUrl ? `Connected through ${status.backendUrl}.` : "Set CFD_BACKEND_URL to a live local backend."}
              </p>
            </div>
            <div className="status-card">
              <strong>Active engine</strong>
              <div className="pill pill-active">{activeEngine}</div>
              <p className="demo-note">
                {backendReady
                  ? "Use the current lane for quick evidence first, then promote only when stronger artifacts are justified."
                  : "Do not interpret solver behavior until the runtime lane is healthy."}
              </p>
            </div>
            <div className="status-card">
              <strong>Artifact freshness</strong>
              <div className={`pill ${openfoamReady || fluidx3dReady ? "pill-good" : ""}`}>{artifactFreshness}</div>
              <p className="demo-note">{exportedEvidence}</p>
            </div>
            <div className="status-card">
              <strong>Recommended action</strong>
              <div className="pill">{confidenceLabel}</div>
              <p className="demo-note">{nextStep}</p>
            </div>
          </div>
          <div className="mini-table cfd-mini-table">
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
      <div className="cfd-status-lanes">
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
        <div className="details-block">
          <strong>Confidence snapshot</strong>
          <p className="demo-note">
            {confidenceLabel}: {confidenceSummary}
          </p>
          <div className="pill-grid">
            {confidenceSignals.map((signal) => (
              <span key={signal.label} className={`pill ${signal.ready ? "pill-good" : ""}`}>
                {signal.label}: {signal.ready ? "ready" : "pending"}
              </span>
            ))}
          </div>
        </div>
        <div className="details-block">
          <strong>Escalation lane</strong>
          <p className="demo-note">{escalationGuidance}</p>
        </div>
      </div>
      <div className="demo-note">
        Set <span className="mono">CFD_BACKEND_URL</span> (or{" "}
        <span className="mono">NEXT_PUBLIC_CFD_BACKEND_URL</span>) in <span className="mono">.env</span> to connect.
      </div>
      <div className="nav-row cfd-status-actions">
        <button type="button" className="control-chip" onClick={refresh} disabled={checking}>
          {checking ? "Refreshing..." : "Refresh status"}
        </button>
        <button type="button" className="control-chip" onClick={runTest} disabled={testBusy}>
          {testBusy ? "Running..." : "Run LBM test"}
        </button>
        {lastChecked ? <span className="demo-note">Last checked: {lastChecked.toLocaleTimeString()}</span> : null}
      </div>
      {testResult ? <div className={`pill ${testTone === "bad" ? "pill-bad" : "pill-good"}`}>{testResult}</div> : null}
    </div>
  );
}
