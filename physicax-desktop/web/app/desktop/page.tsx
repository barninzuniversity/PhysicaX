"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FeatureChecklist } from "../components/FeatureChecklist";
import { ScenarioPlanner, type PlannerScenario } from "../components/ScenarioPlanner";

type DesktopSettings = {
  gpuMode: "high" | "low";
  autoUpdate: boolean;
  updateDir?: string;
};

type BackendHealth = "checking" | "ready" | "offline";
type BackendStatusPayload = {
  status?: string;
  openfoam?: string;
  fluidx3d?: string;
};
type ReleaseVerifiedFile = {
  path: string;
  fileName?: string;
  relativePath?: string;
  size: number;
  sha256: string;
  actualPath?: string;
  actualSize?: number;
  exists?: boolean;
  sizeMatches?: boolean;
};
type ReleaseVerificationPayload = {
  releaseDir?: string;
  summaryPath?: string;
  summaryExists?: boolean;
  version?: string;
  generatedAt?: string;
  verifiedFiles?: ReleaseVerifiedFile[];
  missingFiles?: string[];
  availableFiles?: string[];
  error?: string;
};
type RuntimeGpuAuxAttributes = {
  glRenderer?: string;
  glVendor?: string;
  directRendering?: boolean;
  optimus?: boolean;
  amdSwitchable?: boolean;
  inProcessGpu?: boolean;
};
type RuntimeGpuDevice = {
  active: boolean;
  deviceString: string;
  vendorId?: number | string;
  deviceId?: number | string;
  driverVendor?: string;
  driverVersion?: string;
};
type RuntimeDiagnosticsPayload = {
  platform?: string;
  sessionType?: string;
  isWsl?: boolean;
  gpuMode?: "high" | "low";
  commandProfile?: "native-hardware" | "compatibility-software";
  hardwareAccelerationEnabled?: boolean;
  gpuFeatures?: Record<string, string>;
  gpuDevices?: RuntimeGpuDevice[];
  auxAttributes?: RuntimeGpuAuxAttributes;
  notes?: string[];
  collectedAt?: string;
};
type CommandGuide = {
  id: string;
  title: string;
  body: string;
  command: string;
  badge: string;
  note: string;
  expect: string;
};

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

const linuxSetupCommands = `cd "/path/to/PhysicaX"
bash scripts/setup-linux.sh`;

const linuxDesktopCommands = `cd "/path/to/PhysicaX"
bash scripts/run-desktop-linux.sh`;

const linuxDesktopGpuCommands = `cd "/path/to/PhysicaX"
bash scripts/run-desktop-linux-gpu.sh`;

const linuxDesktopDiscreteGpuCommands = `cd "/path/to/PhysicaX"
PHYSICAX_GPU_VENDOR=discrete bash scripts/run-desktop-linux-gpu.sh`;

const linuxWebCommands = `cd "/path/to/PhysicaX"
bash scripts/run-web-linux.sh`;

const linuxDoctorCommands = `cd /path/to/PhysicaX/physicax-desktop
npm run desktop:doctor:linux`;

const linuxReleaseCommands = `cd /path/to/downloaded/PhysicaX-linux-release
chmod +x run-PhysicaX-linux.sh
./run-PhysicaX-linux.sh`;

const linuxDebCommands = `cd /path/to/downloaded/PhysicaX-linux-release
chmod +x install-PhysicaX-deb.sh
./install-PhysicaX-deb.sh`;

const linuxBackendCommands = `cd "/path/to/PhysicaX"
bash scripts/run-cfd-backend-linux.sh`;

const linuxVerifyCommands = `cd "/path/to/PhysicaX"
env PHYSICAX_SKIP_SETUP=1 bash scripts/verify-linux.sh`;

const linuxCommandGuides: CommandGuide[] = [
  {
    id: "setup",
    title: "Bootstrap the repo once",
    body: "Use this first when you want the root folder to prepare Python and JavaScript dependencies without making you step through each package manually.",
    command: linuxSetupCommands,
    badge: "Recommended first step",
    note: "This script creates the virtualenv, installs root Python requirements, and makes sure both npm workspaces are ready.",
    expect: "The terminal should finish with Linux setup ready and point you to the desktop and web launch helpers."
  },
  {
    id: "desktop",
    title: "Launch the desktop app",
    body: "Use this when you want the full Linux desktop path from the repository root with the doctor check, runtime preparation, and Electron launch in one command.",
    command: linuxDesktopCommands,
    badge: "One-command desktop",
    note: "This is the cleanest path when the app already lives on your machine and you want the real packaged-style runtime.",
    expect: "The Linux doctor runs first, the runtime prepares, and then the Electron window opens on the desktop control surface."
  },
  {
    id: "desktop-gpu",
    title: "Force native GPU mode",
    body: "Use this on native Linux after you have validated the machine's real graphics driver and want the desktop app to prefer hardware acceleration explicitly.",
    command: linuxDesktopGpuCommands,
    badge: "Native GPU launch",
    note: "This helper forces PHYSICAX_GPU_MODE=high and overrides a previously saved low-GPU desktop setting for that launch. On hybrid laptops, it stays on the active hardware GPU by default and lets you opt into discrete offload only when you really want it.",
    expect: "The Electron app opens with the hardware-preferred renderer path, while the doctor/runtime diagnostics stay visible in the terminal and desktop UI."
  },
  {
    id: "desktop-gpu-discrete",
    title: "Try the dedicated GPU on a hybrid laptop",
    body: "Use this only when you intentionally want to test discrete-GPU offload on a hybrid Linux machine. It is optional and not required for normal GPU acceleration.",
    command: linuxDesktopDiscreteGpuCommands,
    badge: "Optional discrete offload",
    note: "Most Linux laptops should stay on the active hardware GPU first. This command is for the narrower case where you specifically want to test dedicated NVIDIA-style offload.",
    expect: "The app should still open normally, but now you can verify whether the renderer moved from the integrated GPU to the discrete one."
  },
  {
    id: "web",
    title: "Launch the web workspace",
    body: "Use this when you want the browser experience only and prefer to skip Electron while still running the production standalone server.",
    command: linuxWebCommands,
    badge: "One-command web",
    note: "This path builds the standalone Next.js output and serves it locally on port 3000.",
    expect: "A local production web server should answer on http://127.0.0.1:3000."
  },
  {
    id: "doctor",
    title: "Check the machine first",
    body: "Use the Linux doctor before launching when you want a quick read on missing tools, build outputs, and release artifacts.",
    command: linuxDoctorCommands,
    badge: "Self-check",
    note: "The doctor reports missing prerequisites and points you toward the next command instead of making you guess.",
    expect: "You should see a pass/fail checklist for tools, builds, release artifacts, and renderer diagnostics."
  },
  {
    id: "release",
    title: "Run after downloading a release",
    body: "Use the Linux launcher when you downloaded the packaged release folder from GitHub or received it from another machine.",
    command: linuxReleaseCommands,
    badge: "Portable release",
    note: "This is the easiest handoff path for a finished Linux package.",
    expect: "The downloaded Linux release should open as the packaged desktop app without needing the source checkout."
  },
  {
    id: "deb",
    title: "Install the Debian package",
    body: "Use the helper installer if you prefer a system install instead of running the AppImage-style release launcher directly.",
    command: linuxDebCommands,
    badge: "System install",
    note: "Good for Debian and Ubuntu machines where you want the package registered with the desktop environment.",
    expect: "The helper should install the package, after which you can launch PhysicaX from the system menu or the installed desktop entry."
  },
  {
    id: "backend",
    title: "Start the CFD backend only",
    body: "Use this when you want to drive the browser workflow with a standalone backend or debug the CFD service separately from the desktop shell.",
    command: linuxBackendCommands,
    badge: "Service-only",
    note: "Best for browser-based CFD debugging and manual backend verification.",
    expect: "The backend should answer on http://127.0.0.1:8000/status with a ready or inspectable runtime payload."
  },
  {
    id: "verify",
    title: "Run the full Linux verification pass",
    body: "Use this when you want the repo to stress-test itself by running the doctor, preparing the runtime, smoke-testing the app, and rebuilding the Linux release bundle.",
    command: linuxVerifyCommands,
    badge: "Confidence pass",
    note: "This is the strongest local check before you hand off the app or trust a fresh Linux package.",
    expect: "Doctor, prep, smoke, packaging, and release-verification steps should complete without hidden runtime surprises."
  }
];

const portableConfidenceChecklist = [
  "Run the Linux doctor before launch so missing tools or artifacts are visible early.",
  "Prepare the runtime and confirm the backend health endpoint resolves cleanly.",
  "Smoke-test the packaged desktop flow before trusting it for demos or handoff.",
  "Package the AppImage and .deb only after the runtime path already feels stable.",
  "Keep the release verification summary with the Linux release folder when you share the build."
];

const escalationCards = [
  {
    title: "Explore in the browser",
    body: "Start here when the job is teaching, quick comparison, or concept exploration and you do not need local runtime controls yet."
  },
  {
    title: "Validate inside the desktop runtime",
    body: "Move into the desktop app when GPU policy, backend state, and local release behavior become part of the question."
  },
  {
    title: "Package for portable handoff",
    body: "Finish with the Linux release lane when another machine needs a verified runtime instead of a source checkout."
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
const formatReleaseFileSize = (value?: number) => {
  if (!value || !Number.isFinite(value)) return "size unavailable";
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} bytes`;
};

const interpretBackendStatus = (payload: BackendStatusPayload | null) => {
  const status = payload?.status?.toLowerCase();
  const openfoam = payload?.openfoam?.toLowerCase();
  const fluidx3d = payload?.fluidx3d?.toLowerCase();

  if (status === "ready") {
    if (openfoam === "ready" || fluidx3d === "ready") {
      return {
        health: "ready" as const,
        note: "The backend is ready and at least one heavier artifact lane is already visible."
      };
    }
    return {
      health: "ready" as const,
      note: "The backend is ready. Use the quick validation lane before expecting exported artifacts."
    };
  }

  if (status) {
    return {
      health: "offline" as const,
      note: `The backend answered, but reported ${status} instead of ready.`
    };
  }

  return {
    health: "offline" as const,
    note: "The backend responded without a readable readiness status."
  };
};

declare global {
  interface Window {
    physicaxDesktop?: {
      getBackendUrl: () => Promise<string>;
      getSettings: () => Promise<DesktopSettings>;
      getReleaseVerification: () => Promise<ReleaseVerificationPayload>;
      getRuntimeDiagnostics: () => Promise<RuntimeDiagnosticsPayload>;
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
  const [backendStatusNote, setBackendStatusNote] = useState("");
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);
  const [releaseVerification, setReleaseVerification] = useState<ReleaseVerificationPayload | null>(null);
  const [runtimeDiagnostics, setRuntimeDiagnostics] = useState<RuntimeDiagnosticsPayload | null>(null);

  const fetchBackendStatus = async (url: string) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(`${url}/status`, { cache: "no-store", signal: controller.signal });
      let payload: BackendStatusPayload | null = null;
      try {
        payload = (await response.json()) as BackendStatusPayload;
      } catch {
        payload = null;
      }
      return { response, payload };
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const copyCommand = async (commandId: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommandId(commandId);
      setMessage("Command copied to clipboard.");
    } catch (error) {
      setMessage(`Could not copy command: ${describeDesktopError(error)}`);
    }
  };

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
      const [setts, ver, backend, verification, diagnostics] = await Promise.all([
        window.physicaxDesktop.getSettings(),
        window.physicaxDesktop.getVersion(),
        window.physicaxDesktop.getBackendUrl(),
        window.physicaxDesktop.getReleaseVerification(),
        window.physicaxDesktop.getRuntimeDiagnostics()
      ]);
      setSettings(setts);
      setVersion(ver);
      setBackendUrl(backend);
      setReleaseVerification(verification);
      setRuntimeDiagnostics(diagnostics);
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
      setBackendStatusNote(ready ? "No backend URL is configured for the packaged runtime." : "Backend checks are available inside the desktop app.");
      if (announce) {
        setMessage(ready ? "No backend URL is configured for the packaged runtime." : "Backend checks are available inside the desktop app.");
      }
      return;
    }

    setActionBusy(announce ? "backend" : null);
    setRuntimeError("");

    try {
      setBackendHealth("checking");
      const { response, payload } = await fetchBackendStatus(backendUrl);
      const interpreted = response.ok
        ? interpretBackendStatus(payload)
        : { health: "offline" as const, note: `The backend returned HTTP ${response.status}.` };
      setBackendHealth(interpreted.health);
      setBackendStatusNote(interpreted.note);
      setLastBackendCheck(new Date());
      if (announce) {
        setMessage(
          interpreted.health === "ready"
            ? "Backend health refreshed successfully."
            : `Backend needs attention. ${interpreted.note}`
        );
      }
    } catch (error) {
      setBackendHealth("offline");
      setBackendStatusNote("The backend did not answer within the short confidence-check timeout.");
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
      setBackendStatusNote(ready ? "No backend URL is configured for the packaged runtime." : "Backend checks are available inside the desktop app.");
      return;
    }

    let cancelled = false;

    const checkBackend = async () => {
      try {
        setBackendHealth("checking");
        const { response, payload } = await fetchBackendStatus(backendUrl);
        if (cancelled) return;
        const interpreted = response.ok
          ? interpretBackendStatus(payload)
          : { health: "offline" as const, note: `The backend returned HTTP ${response.status}.` };
        setBackendHealth(interpreted.health);
        setBackendStatusNote(interpreted.note);
        setLastBackendCheck(new Date());
      } catch {
        if (!cancelled) {
          setBackendHealth("offline");
          setBackendStatusNote("The backend did not answer within the short confidence-check timeout.");
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

  useEffect(() => {
    if (!copiedCommandId) return;
    const timeout = window.setTimeout(() => setCopiedCommandId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedCommandId]);

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
  const releaseSummary = useMemo(() => {
    const files = releaseVerification?.verifiedFiles ?? [];
    const presentCount = files.filter((file) => file.exists).length;
    const missingCount = releaseVerification?.missingFiles?.length ?? 0;
    const confidenceLabel =
      !releaseVerification?.summaryExists
        ? "Summary missing"
        : missingCount > 0
          ? "Attention needed"
          : files.length > 0
            ? "Verified"
            : "Awaiting evidence";
    return {
      files,
      presentCount,
      missingCount,
      confidenceLabel
    };
  }, [releaseVerification]);

  const accelerationSummary = useMemo(() => {
    const features = runtimeDiagnostics?.gpuFeatures ?? {};
    const webgl = features.webgl ?? "";
    const compositing = features.gpu_compositing ?? "";
    const renderer =
      runtimeDiagnostics?.auxAttributes?.glRenderer || runtimeDiagnostics?.gpuDevices?.[0]?.deviceString || "Unknown renderer";
    const software = /software|swiftshader|llvmpipe|softpipe|disabled_software|unavailable_software|disabled_off|unavailable_off/i.test(
      `${webgl} ${compositing} ${renderer}`
    );
    const reduced = /enabled_readback/i.test(`${webgl} ${compositing}`);
    const enabled = Boolean(runtimeDiagnostics?.hardwareAccelerationEnabled) && !software;

    return {
      level: software ? "bad" : enabled ? "good" : "warn",
      label: software ? "Software fallback" : enabled ? (reduced ? "Accelerated (reduced)" : "Hardware accelerated") : "Pending",
      note: software
        ? "The renderer still looks software-backed. On Linux, install or repair the real GPU driver, confirm glxinfo -B is not using llvmpipe/SwiftShader, then relaunch with the native GPU helper."
        : reduced
          ? "Electron reports hardware acceleration, but Chromium is flagging reduced-performance readbacks. Keep native GPU mode on, but lower the heaviest 3D scene density if interaction still feels sticky."
          : "The runtime is using a real accelerated renderer and is the right place to use the heavier 3D labs."
    };
  }, [runtimeDiagnostics]);

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
            : backendHealth === "checking"
              ? "Waiting for the local runtime to report service health."
              : backendStatusNote || "Check the packaged backend before assuming the CFD layer is broken."
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
        label: "Renderer acceleration",
        value: accelerationSummary.label,
        note: ready
          ? accelerationSummary.note
          : "Open the packaged desktop app to inspect the live renderer, GPU feature status, and driver-backed acceleration state."
      },
      {
        label: "Release handoff",
        value: releaseSummary.confidenceLabel,
        note: ready
          ? releaseVerification?.summaryExists
            ? "The desktop runtime can read the same verification artifact that ships with the Linux release folder."
            : releaseVerification?.error || "Refresh runtime state after generating the Linux release bundle."
          : "The browser preview explains the packaged release path and WSL launcher."
      }
    ],
    [
      accelerationSummary.label,
      accelerationSummary.note,
      backendHealth,
      backendStatusNote,
      ready,
      releaseSummary.confidenceLabel,
      releaseVerification?.error,
      releaseVerification?.summaryExists,
      settings?.gpuMode
    ]
  );

  return (
    <>
      <section className="section reveal hero" id="desktop-runtime-guide">
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
              <li>On native Linux, prefer the native GPU launcher after confirming the system renderer is not llvmpipe or SwiftShader.</li>
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
          {backendStatusNote ? (
            <div className="details-block">
              <strong>Backend confidence note</strong>
              <p className="demo-note">{backendStatusNote}</p>
            </div>
          ) : null}
          {runtimeDiagnostics ? (
            <div className="status-grid">
              <div className={`status-card ${accelerationSummary.level === "good" ? "is-good" : accelerationSummary.level === "bad" ? "is-bad" : "is-warn"}`}>
                <div className="status-label">Renderer</div>
                <div className="status-value">{accelerationSummary.label}</div>
                <div className="status-note">{runtimeDiagnostics.auxAttributes?.glRenderer || runtimeDiagnostics.gpuDevices?.[0]?.deviceString || "No renderer string yet."}</div>
              </div>
              <div className="status-card">
                <div className="status-label">Graphics vendor</div>
                <div className="status-value">{runtimeDiagnostics.auxAttributes?.glVendor || runtimeDiagnostics.gpuDevices?.[0]?.driverVendor || "Unknown"}</div>
                <div className="status-note">
                  {runtimeDiagnostics.gpuDevices?.[0]?.driverVersion
                    ? `Driver ${runtimeDiagnostics.gpuDevices[0].driverVersion}`
                    : "Use glxinfo -B or nvidia-smi on Linux when you need the driver version outside the app."}
                </div>
              </div>
              <div className="status-card">
                <div className="status-label">Linux session</div>
                <div className="status-value">{runtimeDiagnostics.sessionType || "Unknown"}</div>
                <div className="status-note">
                  {runtimeDiagnostics.isWsl
                    ? "WSL defaults to compatibility mode unless you explicitly force a high-performance relaunch."
                    : "Native Linux sessions are the best fit for the accelerated desktop profile."}
                </div>
              </div>
              <div className="status-card">
                <div className="status-label">Bridge profile</div>
                <div className="status-value">{runtimeDiagnostics.commandProfile === "compatibility-software" ? "Compatibility" : "Native hardware"}</div>
                <div className="status-note">
                  {runtimeDiagnostics.commandProfile === "compatibility-software"
                    ? "Electron is in the safer software-backed launch profile."
                    : "Electron is using the native hardware-preferred Linux profile."}
                </div>
              </div>
            </div>
          ) : null}
          {runtimeDiagnostics?.notes?.length ? (
            <div className="details-block">
              <strong>Acceleration notes</strong>
              <ul className="feature-list">
                {runtimeDiagnostics.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="control-row">
            <div className="control-group">
              <button type="button" className="control-button" onClick={() => void toggleGpu("high")} disabled={Boolean(actionBusy)}>
                {actionBusy === "high" ? "Restarting..." : "High Performance"}
              </button>
              <div className="control-help">Prefer this on native Linux or Windows GPU stacks when you want maximum renderer throughput.</div>
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

      {ready ? (
        <section className="section reveal">
          <div className="section-header">
            <p className="section-kicker">Release confidence</p>
            <h2>Artifact Evidence From The Packaged Runtime</h2>
            <p className="section-lede">
              This reads the same <span className="mono">verification-summary.json</span> that ships with the Linux
              release folder, so the runtime, scripts, and handoff artifacts stay aligned.
            </p>
          </div>
          <div className="status-grid">
            <div className={`status-card ${releaseVerification?.summaryExists && !releaseSummary.missingCount ? "is-good" : "is-warn"}`}>
              <div className="status-label">Verification summary</div>
              <div className="status-value">{releaseSummary.confidenceLabel}</div>
              <div className="status-note">
                {releaseVerification?.generatedAt
                  ? `Generated ${new Date(releaseVerification.generatedAt).toLocaleString()}`
                  : releaseVerification?.error || "No verification summary is visible yet."}
              </div>
            </div>
            <div className={`status-card ${releaseSummary.missingCount === 0 ? "is-good" : "is-bad"}`}>
              <div className="status-label">Verified files</div>
              <div className="status-value">
                {releaseSummary.presentCount}/{releaseSummary.files.length || 0}
              </div>
              <div className="status-note">
                {releaseSummary.missingCount === 0
                  ? "Every file listed in the verification artifact is present."
                  : `${releaseSummary.missingCount} expected artifact(s) are missing from the release folder.`}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Release folder</div>
              <div className="status-value">{releaseVerification?.releaseDir ? "Visible" : "Unavailable"}</div>
              <div className="status-note">{releaseVerification?.releaseDir || "Generate or unpack a Linux release first."}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Runtime version</div>
              <div className="status-value">{releaseVerification?.version || version || "Unknown"}</div>
              <div className="status-note">Useful when you are matching a packaged runtime with a release handoff bundle.</div>
            </div>
          </div>
          {releaseVerification?.error ? (
            <div className="details-block">
              <strong>Release evidence note</strong>
              <p className="demo-note">{releaseVerification.error}</p>
            </div>
          ) : null}
          {releaseSummary.files.length ? (
            <div className="model-grid">
              {releaseSummary.files.map((file) => (
                <div key={`${file.fileName || file.path}-${file.sha256}`} className="model-card">
                  <h3>{file.fileName || file.relativePath || file.path.split("/").pop() || "Artifact"}</h3>
                  <div className="pill-grid">
                    <span className={`pill ${file.exists ? "pill-good" : "pill-bad"}`}>
                      {file.exists ? "present" : "missing"}
                    </span>
                    <span className={`pill ${file.sizeMatches ? "pill-good" : file.exists ? "pill-active" : ""}`}>
                      {file.sizeMatches ? "size match" : file.exists ? "size changed" : "unverified"}
                    </span>
                    <span className="pill">{formatReleaseFileSize(file.size)}</span>
                  </div>
                  <div className="demo-note">{file.actualPath || file.path}</div>
                </div>
              ))}
            </div>
          ) : null}
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
        <div className="section-header">
          <p className="section-kicker">Confidence pass</p>
          <h2>Turn a local launch into a portable, reviewable runtime</h2>
          <p className="section-lede">
            A strong desktop workflow should start simple, prove the local stack is healthy, and only then promote into
            packaging and handoff. This section keeps that escalation path visible.
          </p>
        </div>
        <div className="card-grid">
          {escalationCards.map((card) => (
            <div className="card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
        <FeatureChecklist
          title="Portable Runtime Confidence Checklist"
          description="Use this before demos, release handoff, or a long validation session. The goal is to trust the runtime because you checked it, not because it happened to launch once."
          items={portableConfidenceChecklist}
          storageKey="physicax-desktop-portable-confidence"
        />
      </section>

      <section className="section reveal" id="linux-quick-start">
        <div className="section-header">
          <p className="section-kicker">Launch matrix</p>
          <h2>Launch Matrix For Linux</h2>
          <p className="section-lede">
            These launch paths now include root helper scripts, so the repo can bootstrap itself from one place instead
            of forcing you to memorize the web, desktop, and backend commands separately.
          </p>
        </div>
        <div className="card-grid">
          {linuxCommandGuides.map((guide) => (
            <div className="card" key={guide.id}>
              <div className="inline-kv">
                <span className="pill pill-active">{guide.badge}</span>
                <button
                  type="button"
                  className="control-chip"
                  onClick={() => void copyCommand(guide.id, guide.command)}
                >
                  {copiedCommandId === guide.id ? "Copied" : "Copy command"}
                </button>
              </div>
              <h3>{guide.title}</h3>
              <p>{guide.body}</p>
              <div className="code-block compact">
                <pre>
                  <code>{guide.command}</code>
                </pre>
              </div>
              <p className="demo-note">{guide.note}</p>
              <p className="demo-note">
                <strong>Expect:</strong> {guide.expect}
              </p>
            </div>
          ))}
        </div>
        <p className="demo-note">
          The repository root now includes a top-level <span className="mono">requirements.txt</span> so the Python CFD
          backend can be installed from one place on Linux, the root <span className="mono">scripts</span> folder now
          exposes one-command launch helpers, and the desktop package still includes a Linux doctor command for quick
          preflight checks.
        </p>
        <p className="demo-note">
          If you already have the repo on your machine, replace <span className="mono">/path/to/PhysicaX</span> with your
          local checkout path and keep the quotes when that path contains spaces.
        </p>
      </section>

      <section className="section reveal" id="wsl-linux-notes">
        <h2>Linux / Kali Notes</h2>
        <p>
          If you are using the Linux package inside WSL, the most reliable launch path is the prepared WSL launcher. On
          native Linux, use the dedicated GPU launcher after you have verified that the machine is not falling back to
          llvmpipe or SwiftShader. On hybrid Linux laptops, that helper stays on the active hardware GPU by default,
          because that is the most stable path for Electron on many driver stacks. The general launcher still starts
          the AppImage in extract-and-run mode by default so it works more reliably on machines that do not have FUSE
          configured.
        </p>
        <div className="code-block">
          <pre>
            <code>{`# Native Linux hardware-preferred launch:
cd "/path/to/PhysicaX"
bash scripts/run-desktop-linux-gpu.sh

# Optional hybrid-laptop discrete GPU attempt:
cd "/path/to/PhysicaX"
PHYSICAX_GPU_VENDOR=discrete bash scripts/run-desktop-linux-gpu.sh

# Downloaded release:
cd /path/to/downloaded/PhysicaX-linux-release
chmod +x run-PhysicaX-linux.sh
./run-PhysicaX-linux.sh

# WSL:
chmod +x run-PhysicaX-wsl.sh
./run-PhysicaX-wsl.sh`}</code>
          </pre>
        </div>
        <p className="demo-note">
          Expected DBus warnings in WSL are usually non-fatal. What matters is that the local UI responds and the
          backend status resolves to ready.
        </p>
        <div className="code-block">
          <pre>
            <code>{`# Kali Linux general GPU verification:
sudo apt install -y mesa-utils vulkan-tools pciutils
glxinfo -B

# Kali Linux NVIDIA path:
sudo apt update
sudo apt -y full-upgrade
sudo apt install -y linux-headers-$(uname -r) linux-headers-amd64 mesa-utils vulkan-tools pciutils nvidia-driver nvidia-cuda-toolkit
sudo reboot
nvidia-smi
glxinfo -B
cd "/path/to/PhysicaX"
bash scripts/run-desktop-linux-gpu.sh`}</code>
          </pre>
        </div>
        <p className="demo-note">
          If <span className="mono">glxinfo -B</span> shows <span className="mono">llvmpipe</span> or <span className="mono">SwiftShader</span>,
          the renderer is still on CPU fallback. If it shows Intel or another integrated renderer while an NVIDIA GPU
          is present, the app is still GPU-accelerated, just not on the discrete GPU. Use{" "}
          <span className="mono">PHYSICAX_GPU_VENDOR=discrete bash scripts/run-desktop-linux-gpu.sh</span> only when
          you want to try dedicated offload. On NVIDIA-based Kali systems with display startup trouble, Kali's graphics
          troubleshooting guide also recommends checking{" "}
          <span className="mono">nvidia_drm.modeset=1</span>.
        </p>
      </section>
    </>
  );
}
