"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DesktopSettings = {
  gpuMode: "high" | "low";
  autoUpdate: boolean;
  updateDir?: string;
};

type BackendHealth = "checking" | "ready" | "offline";

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

  useEffect(() => {
    const load = async () => {
      if (!window.physicaxDesktop) {
        return;
      }
      setReady(true);
      const [setts, ver, backend] = await Promise.all([
        window.physicaxDesktop.getSettings(),
        window.physicaxDesktop.getVersion(),
        window.physicaxDesktop.getBackendUrl()
      ]);
      setSettings(setts);
      setVersion(ver);
      setBackendUrl(backend);
    };
    void load();
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
        const response = await fetch(`${backendUrl}/status`, { cache: "no-store" });
        if (cancelled) return;
        setBackendHealth(response.ok ? "ready" : "offline");
      } catch {
        if (!cancelled) {
          setBackendHealth("offline");
        }
      }
    };

    void checkBackend();

    return () => {
      cancelled = true;
    };
  }, [ready, backendUrl]);

  const toggleGpu = async (mode: "high" | "low") => {
    if (!window.physicaxDesktop) return;
    setMessage(`Switching to ${mode === "high" ? "high performance" : "compatibility"} mode and restarting...`);
    await window.physicaxDesktop.setGpuMode(mode);
  };

  const checkUpdates = async () => {
    if (!window.physicaxDesktop) return;
    const result = await window.physicaxDesktop.checkForUpdates();
    if (!result.available) {
      setMessage("You are up to date. The packaged desktop stack already matches the current release.");
      return;
    }
    setMessage(`Update available: ${result.version ?? "latest"}. Open the update folder to inspect the package files.`);
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
                <span className="pill">GPU: {settings?.gpuMode ?? "high"}</span>
                <span className={`pill ${backendHealth === "ready" ? "pill-good" : backendHealth === "offline" ? "pill-bad" : ""}`}>
                  Backend: {backendHealth}
                </span>
                {settings?.updateDir ? <span className="pill">Updates: ready</span> : null}
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
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <h3>Recommended profile</h3>
            <ul>
              <li>On WSL, keep GPU mode on compatibility unless you have already validated accelerated rendering.</li>
              <li>If the backend shows offline, start with status checks before assuming the CFD tools are broken.</li>
              <li>Use the update folder for offline package drops and release handoff.</li>
            </ul>
          </div>
          <div className="panel-card">
            <h3>What PhysicaX desktop manages</h3>
            <ul>
              <li>A packaged web UI served locally.</li>
              <li>The bundled CFD backend and local runtime paths.</li>
              <li>Release-specific update files for repeatable installs.</li>
            </ul>
          </div>
        </div>
      </section>

      {ready ? (
        <section className="section reveal">
          <h2>Runtime Controls</h2>
          <p>Each control changes one part of the local stack. The explanations below are there so you do not have to infer the side effects.</p>
          <div className="control-row">
            <div className="control-group">
              <button type="button" className="control-button" onClick={() => toggleGpu("high")}>
                High Performance
              </button>
              <div className="control-help">Prefer this on native GPU stacks when you want maximum renderer throughput.</div>
            </div>
            <div className="control-group">
              <button type="button" className="control-button secondary" onClick={() => toggleGpu("low")}>
                Compatibility Mode
              </button>
              <div className="control-help">Prefer this on WSL, VMs, or unstable drivers when reliability matters more than speed.</div>
            </div>
            <div className="control-group">
              <button type="button" className="control-button secondary" onClick={checkUpdates}>
                Check for Updates
              </button>
              <div className="control-help">Reads the current packaged release channel and reports whether a newer package is available.</div>
            </div>
            <div className="control-group">
              <button type="button" className="control-button secondary" onClick={() => window.physicaxDesktop?.openUpdateFolder()}>
                Open Update Folder
              </button>
              <div className="control-help">Shows the folder used for offline update packages and release handoff files.</div>
            </div>
          </div>
          {message ? <div className="details-block"><strong>Desktop message</strong><p className="demo-note">{message}</p></div> : null}
        </section>
      ) : null}

      <section className="section reveal">
        <h2>Mode Guide</h2>
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
        <h2>How The Desktop Stack Works</h2>
        <div className="card-grid">
          <div className="card">
            <h3>1. Local UI</h3>
            <p>The packaged app serves the same workspace UI locally, so the browser and desktop stay aligned.</p>
          </div>
          <div className="card">
            <h3>2. Backend Health</h3>
            <p>The desktop app exposes a backend URL and uses it to power CFD diagnostics, tests, and packaged workflows.</p>
          </div>
          <div className="card">
            <h3>3. Runtime Tuning</h3>
            <p>GPU mode is a runtime policy choice: faster rendering on stable stacks, safer software/compatibility paths on WSL.</p>
          </div>
          <div className="card">
            <h3>4. Release Operations</h3>
            <p>Updates are organized around package files and folders so you can hand off builds without rebuilding everything.</p>
          </div>
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
