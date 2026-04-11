"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ScenarioPlanner, type PlannerScenario } from "../components/ScenarioPlanner";

type DesktopSettings = {
  gpuMode: "high" | "low";
  autoUpdate: boolean;
  updateDir?: string;
};

type BackendHealth = "checking" | "ready" | "offline";

const operatingTracks = [
  {
    title: "Teaching / Demo",
    body: "Use the desktop app to keep the runtime stable in classrooms or demos where you want predictable local behavior and fewer moving parts."
  },
  {
    title: "Research / Build",
    body: "Use it when you want a packaged local stack, clearer backend visibility, and a more reliable path into exports, captures, and heavier workflows."
  },
  {
    title: "WSL / Compatibility",
    body: "Use compatibility mode on WSL or virtualized environments first, then move to higher-performance settings only after validation."
  }
];

const operatingScenarios = [
  {
    id: "native",
    label: "Native performance",
    accent: "Renderer-first",
    title: "Use the high-performance profile when the machine is a validated native Linux or Windows runtime.",
    summary: "Maximum renderer throughput when the GPU stack is already known to be stable.",
    body: "This profile is the right fit for workstations and validated laptops where Electron rendering, local services, and packaging are all behaving normally.",
    bullets: [
      "Prefer this when the backend is healthy and the renderer has already proven stable.",
      "Use it for demos or research sessions where performance matters more than defensive compatibility.",
      "Treat it as the default only after you have validated the hardware path once."
    ],
    metrics: [
      { label: "GPU policy", value: "High" },
      { label: "Best on", value: "Native GPU stacks" },
      { label: "Tradeoff", value: "Speed over caution" }
    ],
    links: [
      { href: "/desktop", label: "Review controls" },
      { href: "/labs", label: "Open labs", variant: "secondary" },
      { href: "/cfd", label: "Inspect CFD state", variant: "chip" }
    ],
    note: "If the renderer or driver stack is uncertain, start one step safer and promote to this profile after validation."
  },
  {
    id: "compatibility",
    label: "Compatibility mode",
    accent: "WSL-safe",
    title: "Use the compatibility profile when the runtime is inside WSL, a VM, or an unstable graphics environment.",
    summary: "Safer renderer behavior that protects reliability on less predictable stacks.",
    body: "This profile reduces surprises when GPU acceleration is the least trustworthy part of the environment. It is the safer starting point on WSL and other layered runtimes.",
    bullets: [
      "Choose this first on WSL, virtualized desktops, and older drivers.",
      "Prioritize repeatable launches and readable diagnostics over raw rendering speed.",
      "Promote back to high performance only after the local stack is demonstrably stable."
    ],
    metrics: [
      { label: "GPU policy", value: "Low" },
      { label: "Best on", value: "WSL + VMs" },
      { label: "Tradeoff", value: "Stability over speed" }
    ],
    links: [
      { href: "/desktop", label: "Desktop guide" },
      { href: "/cfd", label: "Backend checks", variant: "secondary" },
      { href: "/research/workflows", label: "Ops notes", variant: "chip" }
    ],
    note: "This should feel like the calm, predictable operating mode rather than a downgrade."
  },
  {
    id: "handoff",
    label: "Release handoff",
    accent: "Package-ready",
    title: "Use the release handoff path when you are validating builds, packaging Linux artifacts, or preparing an offline drop.",
    summary: "A practical operating lane for packaging, update folders, and controlled deployment.",
    body: "This profile is about operational completeness: you are less concerned with interactive exploration and more concerned with whether the packaged runtime is ready for someone else to install and use.",
    bullets: [
      "Check runtime state, backend health, and update-folder behavior before packaging.",
      "Use the WSL launcher when Linux packaging needs a safer startup story.",
      "Treat packaged artifacts as outputs to inspect, not just files to assume are correct."
    ],
    metrics: [
      { label: "Focus", value: "Packaging" },
      { label: "Best outcome", value: "Repeatable release" },
      { label: "Ideal for", value: "Local handoff" }
    ],
    links: [
      { href: "/desktop", label: "Open desktop page" },
      { href: "/platform", label: "Platform overview", variant: "secondary" },
      { href: "/cfd", label: "Artifact checklist", variant: "chip" }
    ],
    note: "This is the right lane when the question is 'can another machine run this cleanly?' rather than 'can I click through it right now?'"
  }
] satisfies PlannerScenario[];

const describeDesktopError = (error: unknown) => (error instanceof Error ? error.message : "Unexpected desktop runtime error.");

declare global {
  interface Window {
    physicaxDesktop?: {
      getBackendUrl: () => Promise<string>;
      getSettings: () => Promise<DesktopSettings>;
      setGpuMode: (mode: "high" | "low") => Promise<DesktopSettings>;
      checkForUpdates: () => Promise<{ available: boolean; version?: string }>;
      getVersion: () => Promise<string>;
      openUpdateFolder: () => Promise<void>;
    };
  }
}

export default function DesktopSettingsPage() {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<DesktopSettings | null>(null);
  const [version, setVersion] = useState("");
  const [backendUrl, setBackendUrl] = useState("");
  const [backendHealth, setBackendHealth] = useState<BackendHealth>("checking");
  const [message, setMessage] = useState("");
  const [runtimeBusy, setRuntimeBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [runtimeError, setRuntimeError] = useState("");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [lastBackendCheck, setLastBackendCheck] = useState<Date | null>(null);

  const syncDesktopState = async (announce = false) => {
    if (!window.physicaxDesktop) {
      if (announce) {
        setMessage("Open the packaged desktop app to refresh runtime state.");
      }
      return;
    }

    setReady(true);
    setRuntimeBusy(true);
    setRuntimeError("");

    try {
      const [setts, ver, backend] = await Promise.all([
        window.physicaxDesktop.getSettings(),
        window.physicaxDesktop.getVersion(),
        window.physicaxDesktop.getBackendUrl()
      ]);
      setSettings(setts);
      setVersion(ver);
      setBackendUrl(backend);
      setLastSynced(new Date());
      if (announce) {
        setMessage("Desktop runtime state refreshed.");
      }
    } catch (error) {
      const detail = describeDesktopError(error);
      setRuntimeError(detail);
      if (announce) {
        setMessage(`Unable to refresh runtime state: ${detail}`);
      }
    } finally {
      setRuntimeBusy(false);
    }
  };

  const refreshBackendHealth = async (announce = false) => {
    if (!ready || !backendUrl) {
      setBackendHealth(ready ? "offline" : "checking");
      if (announce) {
        setMessage(ready ? "No backend URL is configured for the packaged runtime." : "Backend checks are available inside the desktop app.");
      }
      return;
    }

    setActionBusy(announce ? "backend" : null);
    setRuntimeError("");

    try {
      setBackendHealth("checking");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 3500);
      const response = await fetch(`${backendUrl}/status`, { cache: "no-store", signal: controller.signal });
      window.clearTimeout(timeout);
      setBackendHealth(response.ok ? "ready" : "offline");
      setLastBackendCheck(new Date());
      if (announce) {
        setMessage(response.ok ? "Backend health refreshed successfully." : "Backend responded, but not with a healthy status.");
      }
    } catch (error) {
      setBackendHealth("offline");
      if (announce) {
        setMessage(`Backend check failed: ${describeDesktopError(error)}`);
      }
    } finally {
      setActionBusy(null);
    }
  };

  useEffect(() => {
    void syncDesktopState();
  }, []);

  useEffect(() => {
    if (!ready || !backendUrl) {
      setBackendHealth(ready ? "offline" : "checking");
      return;
    }

    let cancelled = false;

    const checkBackend = async () => {
      try {
        setBackendHealth("checking");
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 3500);
        const response = await fetch(`${backendUrl}/status`, { cache: "no-store", signal: controller.signal });
        window.clearTimeout(timeout);
        if (cancelled) return;
        setBackendHealth(response.ok ? "ready" : "offline");
        setLastBackendCheck(new Date());
      } catch {
        if (!cancelled) {
          setBackendHealth("offline");
        }
      }
    };

    void checkBackend();
    const interval = window.setInterval(() => {
      void checkBackend();
    }, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [ready, backendUrl]);

  const toggleGpu = async (mode: "high" | "low") => {
    if (!window.physicaxDesktop) return;
    setActionBusy(mode);
    setMessage(`Switching to ${mode === "high" ? "high performance" : "compatibility"} mode and restarting...`);
    try {
      await window.physicaxDesktop.setGpuMode(mode);
    } catch (error) {
      setMessage(`Could not change GPU mode: ${describeDesktopError(error)}`);
      setActionBusy(null);
    }
  };

  const checkUpdates = async () => {
    if (!window.physicaxDesktop) return;
    setActionBusy("updates");
    try {
      const result = await window.physicaxDesktop.checkForUpdates();
      if (!result.available) {
        setMessage("You are up to date. The packaged desktop stack already matches the current release.");
        return;
      }
      setMessage(`Update available: ${result.version ?? "latest"}. Open the update folder to inspect the package files.`);
    } catch (error) {
      setMessage(`Update check failed: ${describeDesktopError(error)}`);
    } finally {
      setActionBusy(null);
    }
  };

  const openUpdateFolder = async () => {
    if (!window.physicaxDesktop) return;
    setActionBusy("folder");
    try {
      await window.physicaxDesktop.openUpdateFolder();
      setMessage("Update folder opened. Drop package files there for offline handoff and release verification.");
    } catch (error) {
      setMessage(`Could not open the update folder: ${describeDesktopError(error)}`);
    } finally {
      setActionBusy(null);
    }
  };

  const modeGuidance = useMemo(
    () => [
      {
        title: "High Performance",
        body: "Use this on native Linux or Windows when GPU acceleration is stable and you want maximum renderer throughput.",
        active: settings?.gpuMode === "high"
      },
      {
        title: "Compatibility Mode",
        body: "Use this on WSL, virtual machines, or older GPU stacks when stability matters more than raw rendering speed.",
        active: settings?.gpuMode === "low"
      },
      {
        title: "Bundled Local Services",
        body: "The desktop app manages the web UI, backend process, update folder, and runtime paths so the workflow stays portable.",
        active: backendHealth === "ready"
      }
    ],
    [settings?.gpuMode, backendHealth]
  );

  const runtimeSnapshot = useMemo(
    () => [
      {
        label: "Runtime surface",
        value: ready ? "Desktop app" : "Browser preview",
        note: ready
          ? "You are inside the packaged runtime and can operate GPU and backend controls directly."
          : "You are seeing the desktop guide from the web surface."
      },
      {
        label: "Backend",
        value: !ready ? "Preview only" : backendHealth === "ready" ? "Ready" : backendHealth === "offline" ? "Attention needed" : "Checking",
        note:
          !ready
            ? "Backend health becomes actionable inside the packaged desktop runtime."
            : backendHealth === "ready"
            ? "The local backend answered the health endpoint."
            : backendHealth === "offline"
              ? "Check the packaged backend before assuming the CFD layer is broken."
              : "Waiting for the local runtime to report service health."
      },
      {
        label: "GPU policy",
        value: settings?.gpuMode === "low" ? "Compatibility" : settings?.gpuMode === "high" ? "High performance" : "Pending",
        note:
          !ready
            ? "The browser preview explains the desktop policy, but does not change the runtime."
            : settings?.gpuMode === "low"
            ? "Safer for WSL, older drivers, and virtualized graphics stacks."
            : "Prefer this on validated native GPU stacks."
      },
      {
        label: "Release handoff",
        value: settings?.updateDir ? "Configured" : "Local package flow",
        note: ready
          ? "Update-folder operations are visible from the runtime."
          : "The browser preview explains the packaged release path and WSL launcher."
      }
    ],
    [backendHealth, ready, settings?.gpuMode, settings?.updateDir]
  );

  return (
    <>
      <section className="section reveal hero">
        <div>
          <p className="hero-kicker">{ready ? "Desktop control center" : "Desktop-specific controls"}</p>
          <h1>
            {ready
              ? "Manage the local PhysicaX runtime without guessing what the app is doing behind the scenes."
              : "This page becomes fully interactive inside the PhysicaX desktop app."}
          </h1>
          <p className="hero-lede">
            {ready
              ? "This page explains the packaged stack, shows the current runtime state, and gives you quick controls for GPU mode, updates, and local service health. It is especially useful on WSL, where compatibility mode is often the safer default."
              : "In the browser, you can still review how the packaged app is organized, the recommended WSL workflow, and when to use each runtime mode. Open the desktop build to manage GPU mode, local backend status, and updates directly."}
          </p>
          <div className="inline-kv">
            {ready ? (
              <>
                <span className="pill">Version: {version || "unknown"}</span>
                <span className="pill">Backend URL: {backendUrl || "not set"}</span>
                <span className="pill">GPU: {settings?.gpuMode ?? "pending"}</span>
                <span className={`pill ${backendHealth === "ready" ? "pill-good" : backendHealth === "offline" ? "pill-bad" : ""}`}>
                  Backend: {backendHealth}
                </span>
                {settings?.updateDir ? <span className="pill">Updates: ready</span> : null}
                {lastSynced ? <span className="pill">Synced: {lastSynced.toLocaleTimeString()}</span> : null}
              </>
            ) : (
              <>
                <span className="pill pill-active">Browser preview</span>
                <span className="pill">Desktop runtime guide</span>
                <span className="pill">WSL-safe launch notes</span>
              </>
            )}
          </div>
          <div className="hero-actions">
            <Link className="control-button large" href="/cfd">
              Open CFD Control Center
            </Link>
            <Link className="control-button secondary" href="/labs">
              Open Labs
            </Link>
            {ready ? (
              <button type="button" className="control-chip" onClick={() => void syncDesktopState(true)} disabled={runtimeBusy}>
                {runtimeBusy ? "Refreshing..." : "Refresh runtime state"}
              </button>
            ) : null}
          </div>
          <div className="status-grid">
            {runtimeSnapshot.map((item) => (
              <div
                className={`status-card ${
                  item.label === "Backend"
                    ? backendHealth === "ready"
                      ? "is-good"
                      : backendHealth === "offline"
                        ? "is-bad"
                        : "is-warn"
                    : item.label === "GPU policy" && settings?.gpuMode === "low"
                      ? "is-warn"
                      : ""
                }`}
                key={item.label}
              >
                <div className="status-label">{item.label}</div>
                <div className="status-value">{item.value}</div>
                <div className="status-note">{item.note}</div>
              </div>
            ))}
          </div>
          {runtimeError ? (
            <div className="details-block">
              <strong>Runtime issue</strong>
              <p className="demo-note">{runtimeError}</p>
            </div>
          ) : null}
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <h3>Recommended profile</h3>
            <ul className="feature-list">
              <li>On WSL, keep GPU mode on compatibility unless you have already validated accelerated rendering.</li>
              <li>If the backend shows offline, start with status checks before assuming the CFD tools are broken.</li>
              <li>Use the update folder for offline package drops and release handoff.</li>
            </ul>
          </div>
          <div className="panel-card">
            <h3>What PhysicaX desktop manages</h3>
            <ul className="feature-list">
              <li>A packaged web UI served locally.</li>
              <li>The bundled CFD backend and local runtime paths.</li>
              <li>Release-specific update files for repeatable installs.</li>
            </ul>
          </div>
        </div>
      </section>

      {ready ? (
        <section className="section reveal">
          <div className="section-header">
            <p className="section-kicker">Action center</p>
            <h2>Runtime Controls</h2>
            <p className="section-lede">
              Each control changes one part of the local stack. The descriptions are here so you do not have to guess
              what happens after you click.
            </p>
          </div>
          <div className="inline-kv">
            <span className={`pill ${runtimeBusy ? "pill-active" : ""}`}>{runtimeBusy ? "Syncing runtime" : "Runtime ready"}</span>
            <span className={`pill ${backendHealth === "ready" ? "pill-good" : backendHealth === "offline" ? "pill-bad" : ""}`}>
              Backend health: {backendHealth}
            </span>
            {lastBackendCheck ? <span className="pill">Last backend check: {lastBackendCheck.toLocaleTimeString()}</span> : null}
          </div>
          <div className="control-row">
            <div className="control-group">
              <button type="button" className="control-button" onClick={() => void toggleGpu("high")} disabled={Boolean(actionBusy)}>
                {actionBusy === "high" ? "Restarting..." : "High Performance"}
              </button>
              <div className="control-help">Prefer this on native GPU stacks when you want maximum renderer throughput.</div>
            </div>
            <div className="control-group">
              <button type="button" className="control-button secondary" onClick={() => void toggleGpu("low")} disabled={Boolean(actionBusy)}>
                {actionBusy === "low" ? "Restarting..." : "Compatibility Mode"}
              </button>
              <div className="control-help">Prefer this on WSL, VMs, or unstable drivers when reliability matters more than speed.</div>
            </div>
            <div className="control-group">
              <button type="button" className="control-button secondary" onClick={() => void checkUpdates()} disabled={Boolean(actionBusy)}>
                {actionBusy === "updates" ? "Checking..." : "Check for Updates"}
              </button>
              <div className="control-help">Reads the current packaged release channel and reports whether a newer package is available.</div>
            </div>
            <div className="control-group">
              <button type="button" className="control-button secondary" onClick={() => void openUpdateFolder()} disabled={Boolean(actionBusy)}>
                {actionBusy === "folder" ? "Opening..." : "Open Update Folder"}
              </button>
              <div className="control-help">Shows the folder used for offline update packages and release handoff files.</div>
            </div>
            <div className="control-group">
              <button type="button" className="control-button ghost" onClick={() => void refreshBackendHealth(true)} disabled={Boolean(actionBusy)}>
                {actionBusy === "backend" ? "Refreshing..." : "Refresh Backend Health"}
              </button>
              <div className="control-help">Re-checks the packaged backend with a short timeout so hanging services do not stall the page.</div>
            </div>
            <div className="control-group">
              <button type="button" className="control-button ghost" onClick={() => void syncDesktopState(true)} disabled={runtimeBusy || Boolean(actionBusy)}>
                {runtimeBusy ? "Refreshing..." : "Reload Runtime State"}
              </button>
              <div className="control-help">Re-reads settings, backend URL, and version from the live desktop bridge.</div>
            </div>
          </div>
          {message ? <div className="details-block"><strong>Desktop message</strong><p className="demo-note">{message}</p></div> : null}
        </section>
      ) : null}

      <section className="section reveal">
        <ScenarioPlanner
          eyebrow="Operating profiles"
          title="Choose The Desktop Lane That Matches The Machine"
          lede="The desktop app is most useful when the runtime profile is explicit. These tracks turn that choice into something readable and repeatable."
          scenarios={operatingScenarios}
        />
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Operating modes</p>
          <h2>Mode Guide</h2>
          <p className="section-lede">
            These mode descriptions are meant to remove guesswork. You should be able to tell which runtime profile
            fits the machine you are on before you press anything risky.
          </p>
        </div>
        <div className="card-grid">
          {modeGuidance.map((item) => (
            <div className="card" key={item.title}>
              <div className="inline-kv">
                <span className={`pill ${item.active ? "pill-good" : ""}`}>{item.active ? "Current focus" : "Available"}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Operational model</p>
          <h2>How The Desktop Stack Works</h2>
          <p className="section-lede">
            The desktop app is designed like a small control plane for the packaged runtime, not just a separate skin
            on top of the website.
          </p>
        </div>
        <div className="workflow-strip">
          <div className="workflow-card">
            <div className="workflow-index">01</div>
            <h3>Local UI</h3>
            <p>The packaged app serves the same workspace UI locally, so the browser and desktop stay aligned.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-index">02</div>
            <h3>Backend Health</h3>
            <p>The desktop app exposes a backend URL and uses it to power CFD diagnostics, tests, and packaged workflows.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-index">03</div>
            <h3>Runtime Tuning</h3>
            <p>GPU mode is a runtime policy choice: faster rendering on stable stacks, safer compatibility paths on WSL.</p>
          </div>
          <div className="workflow-card">
            <div className="workflow-index">04</div>
            <h3>Release Operations</h3>
            <p>Updates are organized around package files and folders so you can hand off builds without rebuilding everything.</p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Recommended usage</p>
          <h2>When The Desktop App Shines</h2>
          <p className="section-lede">
            Use the desktop runtime when the job benefits from operational confidence, local services, or a clearer
            deployment story than a browser tab alone can provide.
          </p>
        </div>
        <div className="card-grid">
          {operatingTracks.map((track) => (
            <div className="card" key={track.title}>
              <h3>{track.title}</h3>
              <p>{track.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <h2>WSL / Linux Notes</h2>
        <p>
          If you are using the Linux package inside WSL, the most reliable launch path is the prepared WSL launcher. It
          extracts the AppImage once and runs the verified packaged desktop binary directly.
        </p>
        <div className="code-block">
          <pre>
            <code>{`cd /path/to/PhysicaX/physicax-desktop/dist/linux-release
chmod +x run-PhysicaX-wsl.sh
./run-PhysicaX-wsl.sh`}</code>
          </pre>
        </div>
        <p className="demo-note">
          Expected DBus warnings in WSL are usually non-fatal. What matters is that the local UI responds and the
          backend status resolves to ready.
        </p>
      </section>
    </>
  );
}
