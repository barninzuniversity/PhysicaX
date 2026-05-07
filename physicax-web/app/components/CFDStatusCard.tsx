"use client";

import { useState } from "react";
import { useCfdStatus } from "./useCfdStatus";

type ArtifactState = "ready" | "not_configured" | "artifact_pending" | "binary_absent" | string;

type Status = {
  status: string;
  backend?: string;
  openfoam?: ArtifactState;
  openfoamConfigured?: boolean;
  openfoamConfiguredPath?: string;
  openfoamPath?: string;
  openfoamMtime?: number | null;
  openfoamSize?: number | null;
  openfoamPressurePath?: string | null;
  fluidx3d?: ArtifactState;
  fluidx3dBinary?: "present" | "absent";
  fluidx3dConfigured?: boolean;
  fluidx3dPath?: string;
  fluidx3dMtime?: number | null;
  fluidx3dSize?: number | null;
  backendUrl?: string | null;
};

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

const formatBytes = (value?: number | null) => {
  if (value == null || !Number.isFinite(value)) return "n/a";
  const mb = value / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

const formatTime = (value?: number | null) => {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return new Date(value * 1000).toLocaleString();
};

const formatLaneLabel = (value?: ArtifactState, kind: "openfoam" | "fluidx3d" = "openfoam") => {
  switch (value) {
    case "ready":
      return "artifact ready";
    case "artifact_pending":
      return kind === "openfoam" ? "configured, waiting for export" : "binary present, waiting for field";
    case "not_configured":
      return "optional until configured";
    case "binary_absent":
      return "binary absent";
    default:
      return value ?? "unknown";
  }
};

const laneTone = (value?: ArtifactState) => {
  if (value === "ready") return "pill-good";
  return "";
};

export function CFDStatusCard() {
  const { data: status, error, checking, lastCheckedAt, refresh } = useCfdStatus<Status>("/api/cfd", {
    intervalMs: 45000,
    timeoutMs: 5000,
    pauseWhenHidden: true
  });
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testTone, setTestTone] = useState<"good" | "bad" | null>(null);

  const runTest = async () => {
    setTestBusy(true);
    setTestResult(null);
    setTestTone(null);
    try {
      const res = await fetchWithTimeout(
        "/api/cfd",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            engine: "lbm",
            flowSpeed: 1.2,
            radius: 0.35,
            resolution: 24,
            steps: 40,
            requireBackend: false
          })
        },
        12000
      );
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

  const backendReady = status?.status === "ready";
  const openfoamReady = status?.openfoam === "ready";
  const openfoamPending = status?.openfoam === "artifact_pending";
  const fluidx3dReady = status?.fluidx3d === "ready";
  const fluidx3dPending = status?.fluidx3d === "artifact_pending";
  const fluidx3dBinaryPresent = status?.fluidx3dBinary === "present" || fluidx3dReady || fluidx3dPending;
  const pressureArtifactReady = Boolean(status?.openfoamPressurePath);

  const runtimeNote = backendReady
    ? `Connected through ${status?.backendUrl ?? "the local backend"}.`
    : "Treat this as runtime bring-up until the backend answers cleanly.";
  const quickValidationNote = backendReady
    ? "Run the cheap LBM smoke test now to confirm geometry and boundary conditions before exporting anything heavier."
    : "Wait for the runtime lane to answer before treating the issue as physics instead of setup.";
  const artifactNote = pressureArtifactReady
    ? "Pressure output is already present, so you can inspect stronger evidence now."
    : openfoamReady
      ? "The sampled OpenFOAM field is present. Add pressure or streamline review only if the question needs it."
      : openfoamPending
        ? "OpenFOAM is configured, but the sampled artifact has not shown up yet."
        : "OpenFOAM is optional until you want sampled fields and heavier exported evidence.";
  const escalationNote = !backendReady
    ? "Repair the runtime first. Do not escalate into heavier export lanes while the backend itself is still uncertain."
    : openfoamReady || pressureArtifactReady || fluidx3dReady
      ? "You already have inspectable evidence. Compare the artifacts before packaging, reporting, or promoting the run."
      : "Stay in the quick validation lane until the setup looks sensible, then promote into exports only when stronger evidence is justified.";
  const nextStep = !backendReady
    ? "Bring the backend back first, then rerun the quick validation lane."
    : openfoamReady
      ? "Inspect the sampled field now. If you need more proof, compare the pressure artifact or streamlines next."
      : openfoamPending
        ? "The export lane is wired. Run or finish the case, then refresh until the sample artifact appears."
        : "Run the quick LBM test now. Wire OpenFOAM only when you need sampled fields, pressure, or heavier review.";
  const backendEnvHint = !status?.backendUrl
    ? "Set CFD_BACKEND_URL (or NEXT_PUBLIC_CFD_BACKEND_URL) in .env when you want the web app to talk to an external backend."
    : null;

  return (
    <div className="demo-panel cfd-status-shell">
      <div className="demo-title">CFD Diagnostics</div>
      {error ? <div className="pill pill-bad">CFD backend not reachable. {error}</div> : null}
      {!error && !status ? <div className="demo-note">Checking status...</div> : null}
      {status ? (
        <>
          <div className="cfd-status-title-row">
            <div>
              <strong>Current runtime</strong>
              <p className="demo-note">
                {backendReady
                  ? "The local CFD stack is healthy. Treat the heavier artifact lanes as optional escalations, not as prerequisites for every run."
                  : "Use this panel to separate runtime health from solver evidence before you spend time chasing the wrong problem."}
              </p>
            </div>
            <div className="cfd-status-pill-row">
              <span className={`pill ${backendReady ? "pill-good" : "pill-bad"}`}>runtime: {backendReady ? "healthy" : status.status}</span>
              <span className="pill">lane: {status.backend ?? "analytic"}</span>
              <span className={`pill ${laneTone(status.openfoam)}`}>openfoam: {formatLaneLabel(status.openfoam, "openfoam")}</span>
              <span className={`pill ${laneTone(status.fluidx3d)}`}>fluidx3d: {formatLaneLabel(status.fluidx3d, "fluidx3d")}</span>
            </div>
          </div>
          <div className="cfd-status-grid">
            <div className={`status-card ${backendReady ? "is-good" : "is-bad"}`}>
              <strong>Check runtime</strong>
              <div className={`pill ${backendReady ? "pill-good" : "pill-bad"}`}>
                {backendReady ? "Backend healthy" : "Backend needs attention"}
              </div>
              <p className="demo-note">{runtimeNote}</p>
            </div>
            <div className={`status-card ${backendReady ? "is-warn" : "is-bad"}`}>
              <strong>Run quick validation</strong>
              <div className={`pill ${backendReady ? "" : "pill-bad"}`}>
                {backendReady ? "LBM lane ready" : "Blocked until runtime is healthy"}
              </div>
              <p className="demo-note">{quickValidationNote}</p>
            </div>
            <div className={`status-card ${openfoamReady || pressureArtifactReady ? "is-good" : openfoamPending ? "is-warn" : ""}`}>
              <strong>Inspect artifacts</strong>
              <div className={`pill ${openfoamReady || pressureArtifactReady ? "pill-good" : ""}`}>
                {pressureArtifactReady
                  ? "Pressure field visible"
                  : openfoamReady
                    ? "Sampled field visible"
                    : openfoamPending
                      ? "Waiting for sampled artifact"
                      : "Optional until configured"}
              </div>
              <p className="demo-note">{artifactNote}</p>
            </div>
            <div className={`status-card ${openfoamReady || fluidx3dReady ? "is-good" : "is-warn"}`}>
              <strong>Escalate to desktop/export</strong>
              <div className="pill">{openfoamReady || fluidx3dReady ? "Artifact review lane" : "Stay in quick validation"}</div>
              <p className="demo-note">{escalationNote}</p>
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
              <span className="mono">{status.backendUrl ?? "not configured"}</span>
              <span>{status.backendUrl ? "connected" : "set when using an external backend"}</span>
            </div>
            <div className="mini-row">
              <span>openfoam</span>
              <span className="mono">{formatLaneLabel(status.openfoam, "openfoam")}</span>
              <span>{status.openfoamConfiguredPath ? `configured path: ${status.openfoamConfiguredPath}` : "sampled-field lane"}</span>
            </div>
            <div className="mini-row">
              <span>sample field</span>
              <span className="mono">{status.openfoamPath ?? "not produced yet"}</span>
              <span>
                {formatBytes(status.openfoamSize)} - {formatTime(status.openfoamMtime)}
              </span>
            </div>
            <div className="mini-row">
              <span>pressure</span>
              <span className="mono">{status.openfoamPressurePath ?? "not produced yet"}</span>
              <span>{pressureArtifactReady ? "pressure field ready" : "optional heavier evidence"}</span>
            </div>
            <div className="mini-row">
              <span>fluidx3d</span>
              <span className="mono">{status.fluidx3dPath ?? formatLaneLabel(status.fluidx3d, "fluidx3d")}</span>
              <span>
                {fluidx3dBinaryPresent ? `${formatBytes(status.fluidx3dSize)} - ${formatTime(status.fluidx3dMtime)}` : "binary lane not configured"}
              </span>
            </div>
          </div>
          <div className="details-block">
            <strong>Operator guidance</strong>
            <p className="demo-note">{nextStep}</p>
            <div className="pill-grid">
              <span className={`pill ${backendReady ? "pill-good" : "pill-bad"}`}>runtime: {backendReady ? "ready" : "recover first"}</span>
              <span className={`pill ${openfoamReady ? "pill-good" : openfoamPending ? "" : ""}`}>
                openfoam lane: {openfoamReady ? "artifact ready" : openfoamPending ? "configured" : "optional"}
              </span>
              <span className={`pill ${pressureArtifactReady ? "pill-good" : ""}`}>
                pressure output: {pressureArtifactReady ? "visible" : "optional"}
              </span>
              <span className={`pill ${fluidx3dReady ? "pill-good" : ""}`}>
                fluidx3d lane: {fluidx3dReady ? "field ready" : fluidx3dBinaryPresent ? "configured" : "absent"}
              </span>
            </div>
          </div>
        </>
      ) : null}
      {backendEnvHint ? <div className="demo-note">{backendEnvHint}</div> : null}
      <div className="nav-row cfd-status-actions">
        <button type="button" className="control-chip" onClick={() => void refresh()} disabled={checking}>
          {checking ? "Refreshing..." : "Refresh status"}
        </button>
        <button type="button" className="control-chip" onClick={runTest} disabled={testBusy}>
          {testBusy ? "Running..." : "Run LBM test"}
        </button>
        {lastCheckedAt ? <span className="demo-note">Last checked: {new Date(lastCheckedAt).toLocaleTimeString()}</span> : null}
      </div>
      {testResult ? <div className={`pill ${testTone === "bad" ? "pill-bad" : "pill-good"}`}>{testResult}</div> : null}
    </div>
  );
}
