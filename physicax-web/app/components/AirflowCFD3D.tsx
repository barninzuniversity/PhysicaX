"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createNoise3D } from "simplex-noise";
import { MeshBVH, acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";

type BodyShape = "sphere" | "capsule" | "teardrop" | "box" | "cylinder" | "car" | "custom";
type ColorMap = "thermal" | "viridis";
type FluidPreset = "custom" | "air_20c" | "water_20c" | "seawater_20c" | "glycerin_20c";

type FlowConfig = {
  flowSpeed: number;
  radius: number;
  turbulence: number;
  turbulenceModel?: "noise" | "smagorinsky" | "sst";
  particleCount: number;
  spread: number;
  kinematicViscosity: number;
  density: number;
  dragCoefficient: number;
  referenceArea: number;
  wakeStrength: number;
  vortexStrength: number;
  angleOfAttack: number;
  bodyPitch: number;
  bodyRoll: number;
};

type FlowDirectionPreset = "x+" | "x-" | "y+" | "y-" | "z+" | "z-" | "custom";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const toRadians = (value: number) => (value * Math.PI) / 180;
const formatBytes = (value?: number) => {
  if (!value || !Number.isFinite(value)) return "not available";
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${value} bytes`;
};
const formatArtifactTime = (value?: number) => {
  if (!value || !Number.isFinite(value)) return "No artifact timestamp yet";
  return new Date(value * 1000).toLocaleString();
};
const normalizeVec3 = (x: number, y: number, z: number): [number, number, number] => {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
};
const directionFromPreset = (preset: FlowDirectionPreset, yawDeg: number, pitchDeg: number): [number, number, number] => {
  if (preset === "x+") return [1, 0, 0];
  if (preset === "x-") return [-1, 0, 0];
  if (preset === "y+") return [0, 1, 0];
  if (preset === "y-") return [0, -1, 0];
  if (preset === "z+") return [0, 0, 1];
  if (preset === "z-") return [0, 0, -1];
  const yaw = toRadians(yawDeg || 0);
  const pitch = toRadians(pitchDeg || 0);
  const c = Math.cos(pitch);
  return normalizeVec3(Math.cos(yaw) * c, Math.sin(pitch), Math.sin(yaw) * c);
};
const basisFromDirection = (dir: [number, number, number]) => {
  const up: [number, number, number] = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = normalizeVec3(dir[1] * up[2] - dir[2] * up[1], dir[2] * up[0] - dir[0] * up[2], dir[0] * up[1] - dir[1] * up[0]);
  const v = normalizeVec3(u[1] * dir[2] - u[2] * dir[1], u[2] * dir[0] - u[0] * dir[2], u[0] * dir[1] - u[1] * dir[0]);
  return { u, v };
};

let bvhPatched = false;
const ensureBvhPatched = () => {
  if (bvhPatched) {
    return;
  }
  (THREE.BufferGeometry.prototype as unknown as { computeBoundsTree?: typeof computeBoundsTree }).computeBoundsTree =
    computeBoundsTree;
  (THREE.BufferGeometry.prototype as unknown as { disposeBoundsTree?: typeof disposeBoundsTree }).disposeBoundsTree =
    disposeBoundsTree;
  (THREE.Mesh.prototype as unknown as { raycast?: typeof acceleratedRaycast }).raycast = acceleratedRaycast;
  bvhPatched = true;
};
ensureBvhPatched();

const CFD_SESSION_KEY = "physicax:cfd-session-v1";

const FLUID_PRESETS: Record<FluidPreset, { label: string; density?: number; nu?: number }> = {
  custom: { label: "Custom" },
  air_20c: { label: "Air (20C)", density: 1.204, nu: 1.5e-5 },
  water_20c: { label: "Water (20C)", density: 998, nu: 1.004e-6 },
  seawater_20c: { label: "Sea water (20C)", density: 1025, nu: 1.05e-6 },
  glycerin_20c: { label: "Glycerin (20C)", density: 1260, nu: 1.18e-3 }
};

const sampleColorMap = (t: number, map: ColorMap) => {
  const stops =
    map === "viridis"
      ? [
          { t: 0, c: [0.267, 0.005, 0.329] },
          { t: 0.25, c: [0.283, 0.141, 0.458] },
          { t: 0.5, c: [0.254, 0.265, 0.53] },
          { t: 0.75, c: [0.207, 0.372, 0.553] },
          { t: 1, c: [0.993, 0.906, 0.144] }
        ]
      : [
          { t: 0, c: [0.1, 0.25, 0.95] },
          { t: 0.25, c: [0.1, 0.8, 0.95] },
          { t: 0.5, c: [0.2, 0.9, 0.35] },
          { t: 0.75, c: [0.95, 0.85, 0.2] },
          { t: 1, c: [0.92, 0.2, 0.2] }
        ];
  const clamped = clamp(t, 0, 1);
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const localT = (clamped - a.t) / (b.t - a.t || 1);
      return [
        lerp(a.c[0], b.c[0], localT),
        lerp(a.c[1], b.c[1], localT),
        lerp(a.c[2], b.c[2], localT)
      ];
    }
  }
  return stops[stops.length - 1].c;
};

type BackendField = {
  nx: number;
  ny: number;
  nz: number;
  origin: [number, number, number];
  spacing: number;
  ux: number[];
  uy: number[];
  uz: number[];
  p?: number[];
  pMin?: number;
  pMax?: number;
};

type WakeFrame = {
  center: THREE.Vector3;
  flowDir: THREE.Vector3;
  uAxis: THREE.Vector3;
  vAxis: THREE.Vector3;
  rearOffset: number;
  radiusU: number;
  radiusV: number;
};

type MeshMeta = {
  meshId: string;
  filename?: string;
  path?: string;
  sampleDict?: string;
  sampleDictPath?: string;
  bounds?: { min: number[]; max: number[] };
  size?: number[];
  center?: number[];
  suggestedGrid?: { start: number[]; end: number[]; nPoints: number[] };
  error?: string;
};

type CfdSessionSnapshot = {
  version: number;
  meshId?: string;
  dataSource?: "analytic" | "backend";
  backendEngine?: "lbm" | "openfoam" | "fluidx3d";
  renderMode?: "three" | "vtk";
  cfdOnly?: boolean;
  flowSpeed?: string;
  flowDirectionPreset?: FlowDirectionPreset;
  flowYaw?: string;
  flowPitch?: string;
  flowRelativeToBody?: boolean;
  radius?: string;
  turbulence?: string;
  turbulenceModel?: "noise" | "smagorinsky" | "sst";
  particleCount?: string;
  spread?: string;
  density?: string;
  viscosity?: string;
  dragCoefficient?: string;
  referenceArea?: string;
  wakeStrength?: string;
  vortexStrength?: string;
  angleOfAttack?: string;
  bodyPitch?: string;
  bodyRoll?: string;
  showParticles?: boolean;
  showStreamlines?: boolean;
  streamlineCount?: string;
  streamlineSteps?: string;
  streamlineStep?: string;
  streamlineOpacity?: string;
  streamlineSeedJitter?: string;
  streamlineStyle?: "line" | "tube";
  streamlineRadius?: string;
  streamlineContactOnly?: boolean;
  streamlineContactMargin?: string;
  showContextFlow?: boolean;
  contextOpacity?: string;
  contextRadiusScale?: string;
  objectOffsetX?: string;
  objectOffsetY?: string;
  objectOffsetZ?: string;
  showBoundaryLayer?: boolean;
  boundaryLayerMargin?: string;
  boundaryLayerRadius?: string;
  showSurfacePressure?: boolean;
  surfaceMode?: "pressure" | "speed" | "cp" | "separation";
  surfaceBanding?: boolean;
  surfaceBands?: string;
  showVortexCores?: boolean;
  showVorticityField?: boolean;
  vorticityDensity?: string;
  vorticityOpacity?: string;
  showSlice?: boolean;
  sliceAxis?: "x" | "y" | "z";
  slicePosition?: string;
  sliceResolution?: string;
  sliceOpacity?: string;
  sliceMode?: "speed" | "wake" | "vorticity" | "pressure" | "qcriterion";
  sliceStack?: string;
  sliceSpacing?: string;
  showGlyphs?: boolean;
  glyphDensity?: string;
  glyphScale?: string;
  showFlowSheet?: boolean;
  flowSheetOpacity?: string;
  rearWing?: boolean;
  frontWing?: boolean;
  wingAngle?: string;
  wingSpan?: string;
  wingChord?: string;
  bodyShape?: BodyShape;
  colorMap?: ColorMap;
  backendResolution?: string;
  backendSteps?: string;
  exportPath?: string;
  autoSwapFinal?: boolean;
  autoRefresh?: boolean;
  autoRefreshInterval?: string;
};

export function AirflowCFD3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const configRef = useRef<FlowConfig>({
    flowSpeed: 1.2,
    radius: 0.35,
    turbulence: 0.35,
    turbulenceModel: "smagorinsky",
    particleCount: 1400,
    spread: 1.6,
    kinematicViscosity: 1.5e-5,
    density: 1.225,
    dragCoefficient: 0.42,
    referenceArea: 0.12,
    wakeStrength: 0.6,
    vortexStrength: 0.35,
    angleOfAttack: 0,
    bodyPitch: 0,
    bodyRoll: 0
  });
  const playingRef = useRef(true);

  const [flowSpeed, setFlowSpeed] = useState("1.2");
  const [flowDirectionPreset, setFlowDirectionPreset] = useState<FlowDirectionPreset>("x+");
  const [flowYaw, setFlowYaw] = useState("0");
  const [flowPitch, setFlowPitch] = useState("0");
  const [flowRelativeToBody, setFlowRelativeToBody] = useState(false);
  const [radius, setRadius] = useState("0.35");
  const [turbulence, setTurbulence] = useState("0.35");
  const [turbulenceModel, setTurbulenceModel] = useState<"noise" | "smagorinsky" | "sst">("smagorinsky");
  const [particleCount, setParticleCount] = useState("1400");
  const [spread, setSpread] = useState("1.6");
  const [cfdOnly, setCfdOnly] = useState(true);
  const [density, setDensity] = useState("1.225");
  const [fluidPreset, setFluidPreset] = useState<FluidPreset>("air_20c");
  const [dragCoefficient, setDragCoefficient] = useState("0.42");
  const [referenceArea, setReferenceArea] = useState("0.12");
  const [wakeStrength, setWakeStrength] = useState("0.6");
  const [vortexStrength, setVortexStrength] = useState("0.35");
  const [angleOfAttack, setAngleOfAttack] = useState("0");
  const [bodyPitch, setBodyPitch] = useState("0");
  const [bodyRoll, setBodyRoll] = useState("0");
  const [showParticles, setShowParticles] = useState(true);
  const [showStreamlines, setShowStreamlines] = useState(true);
  const [streamlineCount, setStreamlineCount] = useState("520");
  const [streamlineSteps, setStreamlineSteps] = useState("240");
  const [streamlineStep, setStreamlineStep] = useState("0.07");
  const [streamlineOpacity, setStreamlineOpacity] = useState("0.85");
  const [streamlineSeedJitter, setStreamlineSeedJitter] = useState("0.08");
  const [streamlineStyle, setStreamlineStyle] = useState<"line" | "tube">("tube");
  const [streamlineRadius, setStreamlineRadius] = useState("0.009");
  const [streamlineContactOnly, setStreamlineContactOnly] = useState(true);
  const [streamlineContactMargin, setStreamlineContactMargin] = useState("0.02");
  const [showContextFlow, setShowContextFlow] = useState(false);
  const [contextOpacity, setContextOpacity] = useState("0.2");
  const [contextRadiusScale, setContextRadiusScale] = useState("0.7");
  const [objectOffsetX, setObjectOffsetX] = useState("0");
  const [objectOffsetY, setObjectOffsetY] = useState("0");
  const [objectOffsetZ, setObjectOffsetZ] = useState("0");
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true);
  const [boundaryLayerMargin, setBoundaryLayerMargin] = useState("0.06");
  const [boundaryLayerRadius, setBoundaryLayerRadius] = useState("0.006");
  const [showSurfacePressure, setShowSurfacePressure] = useState(true);
  const [surfaceMode, setSurfaceMode] = useState<"pressure" | "speed" | "cp" | "separation">("pressure");
  const [surfaceBanding, setSurfaceBanding] = useState(true);
  const [surfaceBands, setSurfaceBands] = useState("9");
  const [showVortexCores, setShowVortexCores] = useState(true);
  const [showVorticityField, setShowVorticityField] = useState(false);
  const [vorticityDensity, setVorticityDensity] = useState("8");
  const [vorticityOpacity, setVorticityOpacity] = useState("0.28");
  const [showSlice, setShowSlice] = useState(false);
  const [sliceAxis, setSliceAxis] = useState<"x" | "y" | "z">("y");
  const [slicePosition, setSlicePosition] = useState("0");
  const [sliceResolution, setSliceResolution] = useState("36");
  const [sliceOpacity, setSliceOpacity] = useState("0.55");
  const [sliceMode, setSliceMode] = useState<"speed" | "wake" | "vorticity" | "pressure" | "qcriterion">("vorticity");
  const [sliceStack, setSliceStack] = useState("0");
  const [sliceSpacing, setSliceSpacing] = useState("0.45");
  const [showGlyphs, setShowGlyphs] = useState(false);
  const [glyphDensity, setGlyphDensity] = useState("6");
  const [glyphScale, setGlyphScale] = useState("0.45");
  const [showFlowSheet, setShowFlowSheet] = useState(false);
  const [flowSheetOpacity, setFlowSheetOpacity] = useState("0.25");
  const [rearWing, setRearWing] = useState(true);
  const [frontWing, setFrontWing] = useState(false);
  const [wingAngle, setWingAngle] = useState("8");
  const [wingSpan, setWingSpan] = useState("0.8");
  const [wingChord, setWingChord] = useState("0.2");
  const [bodyShape, setBodyShape] = useState<BodyShape>("sphere");
  const [colorMap, setColorMap] = useState<ColorMap>("thermal");
  const [importedLabel, setImportedLabel] = useState("");
  const [importError, setImportError] = useState("");
  const [viscosity, setViscosity] = useState("1.5e-5");
  const [backendResolution, setBackendResolution] = useState("56");
  const [backendSteps, setBackendSteps] = useState("220");
  const [backendEngine, setBackendEngine] = useState<"lbm" | "openfoam" | "fluidx3d">("lbm");
  const [exportPath, setExportPath] = useState("");
  const [colorize, setColorize] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dataSource, setDataSource] = useState<"analytic" | "backend">("analytic");
  const [backendStatus, setBackendStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [backendError, setBackendError] = useState("");
  const [meshMeta, setMeshMeta] = useState<MeshMeta | null>(null);
  const [meshUploadStatus, setMeshUploadStatus] = useState<"idle" | "uploading" | "ready" | "error">("idle");
  const [meshUploadError, setMeshUploadError] = useState("");
  const [caseTemplates, setCaseTemplates] = useState<Record<string, string> | null>(null);
  const [caseStatus, setCaseStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [queueJobs, setQueueJobs] = useState<{ id: string; status: string; notes: string; meshId: string }[]>([]);
  const [queueNote, setQueueNote] = useState("");
  const [queueStatus, setQueueStatus] = useState<"idle" | "loading" | "error">("idle");
  const [renderMode, setRenderMode] = useState<"three" | "vtk">("three");
  const [vtkMessage, setVtkMessage] = useState("");
  const [caseBuildStatus, setCaseBuildStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [caseBuildError, setCaseBuildError] = useState("");
  const [caseInfo, setCaseInfo] = useState<{
    casePath?: string;
    runScript?: string;
    zipPath?: string;
    command?: string | string[];
  } | null>(null);
  const [overwriteCase, setOverwriteCase] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "error">("idle");
  const [runError, setRunError] = useState("");
  const [runLogStatus, setRunLogStatus] = useState<"idle" | "loading" | "error">("idle");
  const [runLogLines, setRunLogLines] = useState<string[]>([]);
  const [autoSwapFinal, setAutoSwapFinal] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState("6");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [backendMeta, setBackendMeta] = useState<{
    openfoam?: string;
    openfoamPath?: string;
    openfoamPressurePath?: string;
    openfoamMtime?: number;
    openfoamSize?: number;
    fluidx3d?: string;
    fluidx3dPath?: string;
    fluidx3dMtime?: number;
    fluidx3dSize?: number;
    status?: string;
  } | null>(null);
  const [fluidx3dFieldLabel, setFluidx3dFieldLabel] = useState("");
  const [fluidx3dFieldError, setFluidx3dFieldError] = useState("");
  const [fluidx3dFieldMeta, setFluidx3dFieldMeta] = useState<{ nx: number; ny: number; nz: number } | null>(null);
  const applyProPreset = () => {
    setDataSource("backend");
    setBackendEngine("openfoam");
    setRenderMode("vtk");
    setShowParticles(false);
    setShowStreamlines(true);
    setStreamlineCount("900");
    setStreamlineSteps("420");
    setStreamlineStep("0.05");
    setStreamlineOpacity("0.92");
    setStreamlineStyle("tube");
    setStreamlineRadius("0.0075");
    setStreamlineContactOnly(true);
    setStreamlineContactMargin("0.02");
    setShowContextFlow(false);
    setContextOpacity("0.2");
    setContextRadiusScale("0.7");
    setShowBoundaryLayer(true);
    setBoundaryLayerMargin("0.05");
    setBoundaryLayerRadius("0.0055");
    setShowSurfacePressure(true);
    setShowVortexCores(true);
    setShowSlice(false);
    setSliceMode("vorticity");
    setSliceStack("0");
    setSliceSpacing("0.5");
    setShowGlyphs(false);
    setColorMap("thermal");
    setSurfaceMode("pressure");
    setSurfaceBanding(true);
    setSurfaceBands("9");
    setShowFlowSheet(false);
    setFluidPreset("air_20c");
    setCfdOnly(true);
    setFlowRelativeToBody(false);
    setBodyPitch("0");
    setBodyRoll("0");
    void ensureBackendReachable("openfoam");
  };
  const applyUltraAnalyticPreset = () => {
    setDataSource("analytic");
    setRenderMode("three");
    setCfdOnly(false);
    setShowParticles(true);
    setParticleCount("9000");
    setShowStreamlines(true);
    setStreamlineCount("1100");
    setStreamlineSteps("360");
    setStreamlineStep("0.06");
    setStreamlineOpacity("0.9");
    setStreamlineStyle("tube");
    setStreamlineRadius("0.008");
    setStreamlineContactOnly(true);
    setStreamlineContactMargin("0.02");
    setWakeStrength("1.0");
    setVortexStrength("0.8");
    setTurbulence("0.55");
    setShowBoundaryLayer(true);
    setBoundaryLayerMargin("0.05");
    setBoundaryLayerRadius("0.006");
    setShowSurfacePressure(true);
    setShowVortexCores(true);
    setShowSlice(false);
    setShowGlyphs(false);
    setColorMap("thermal");
    setSurfaceMode("pressure");
    setSurfaceBanding(true);
    setSurfaceBands("9");
    setShowFlowSheet(false);
    setFlowRelativeToBody(false);
    setBodyPitch("0");
    setBodyRoll("0");
  };
  const clearSavedSession = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(CFD_SESSION_KEY);
      } catch {
        // ignore
      }
    }
    sessionSnapshotRef.current = null;
    setSessionError("");
    setMeshMeta(null);
    setMeshUploadStatus("idle");
    setMeshUploadError("");
    setBackendStatus("idle");
    setBackendError("");
    setDataSource("analytic");
    setBackendEngine("lbm");
    setRenderMode("three");
    setCfdOnly(false);
    setShowVorticityField(false);
    setVorticityDensity("8");
    setVorticityOpacity("0.28");
  };
  const sourceRef = useRef<"analytic" | "backend">("analytic");
  const colorizeRef = useRef(true);
  const colorMapRef = useRef<ColorMap>("thermal");
  const backendFieldRef = useRef<BackendField | null>(null);
  const fluidx3dFieldRef = useRef<BackendField | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const streamGroupRef = useRef<THREE.Group | null>(null);
  const vortexGroupRef = useRef<THREE.Group | null>(null);
  const vorticityFieldRef = useRef<THREE.Points | null>(null);
  const rebuildVorticityFieldRef = useRef<(() => void) | null>(null);
  const lastVortUpdateRef = useRef(0);
  const rebuildStreamlinesRef = useRef<(() => void) | null>(null);
  const sliceRef = useRef<THREE.Mesh | null>(null);
  const sliceMeshesRef = useRef<THREE.Mesh[]>([]);
  const rebuildSliceRef = useRef<(() => void) | null>(null);
  const vorticityConfigRef = useRef({
    show: false,
    density: 8,
    opacity: 0.28
  });
  const sliceConfigRef = useRef({
    show: false,
    axis: "y" as "x" | "y" | "z",
    position: 0,
    resolution: 36,
    opacity: 0.55,
    mode: "vorticity" as "speed" | "wake" | "vorticity" | "pressure" | "qcriterion",
    stack: 0,
    spacing: 0.4
  });
  const surfaceConfigRef = useRef({
    mode: "pressure" as "pressure" | "speed" | "cp" | "separation",
    banding: true,
    bands: 9
  });
  const objectOffsetRef = useRef(new THREE.Vector3());
  const glyphGroupRef = useRef<THREE.Group | null>(null);
  const rebuildGlyphsRef = useRef<(() => void) | null>(null);
  const glyphConfigRef = useRef({
    show: false,
    density: 6,
    scale: 0.45
  });
  const flowSheetRef = useRef<THREE.Mesh | null>(null);
  const flowSheetConfigRef = useRef({
    show: true,
    opacity: 0.35
  });
  const streamlineRef = useRef({
    show: true,
    count: 320,
    steps: 180,
    step: 0.07,
    opacity: 0.75,
    jitter: 0.08,
    style: "tube" as "line" | "tube",
    radius: 0.015,
    contactOnly: true,
    contactMargin: 0.02
  });
  const flowDirectionRef = useRef(new THREE.Vector3(1, 0, 0));
  const flowBasisRef = useRef({
    dir: new THREE.Vector3(1, 0, 0),
    u: new THREE.Vector3(0, 1, 0),
    v: new THREE.Vector3(0, 0, 1)
  });
  const surfaceRef = useRef(true);
  const vortexRef = useRef(true);
  const baseRadiusRef = useRef(0.35);
  const importedObjectRef = useRef<THREE.Object3D | null>(null);
  const importedBaseRadiusRef = useRef<number | null>(null);
  const bvhMeshesRef = useRef<THREE.Mesh[]>([]);
  const bvhReadyRef = useRef(false);
  const lastOpenfoamMtimeRef = useRef<number | null>(null);
  const lastFluidx3dMtimeRef = useRef<number | null>(null);
  const vtkContainerRef = useRef<HTMLDivElement | null>(null);
  const sessionSnapshotRef = useRef<CfdSessionSnapshot | null>(null);
  const lastVtkMeshRef = useRef<any>(null);
  const wakeFrameRef = useRef<WakeFrame | null>(null);
  const bodyBoundsRef = useRef<THREE.Box3 | null>(null);

  useEffect(() => {
    configRef.current.flowSpeed = clamp(Number(flowSpeed), -6, 6);
  }, [flowSpeed]);
  useEffect(() => {
    let dir = directionFromPreset(flowDirectionPreset, Number(flowYaw), Number(flowPitch));
    if (flowRelativeToBody) {
      const aoa = (Number(angleOfAttack) || 0) * (Math.PI / 180);
      const pitch = (Number(bodyPitch) || 0) * (Math.PI / 180);
      const roll = (Number(bodyRoll) || 0) * (Math.PI / 180);
      const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, aoa, roll));
      const rotated = new THREE.Vector3(dir[0], dir[1], dir[2]).applyQuaternion(rot);
      dir = normalizeVec3(rotated.x, rotated.y, rotated.z);
    }
    const basis = basisFromDirection(dir);
    flowDirectionRef.current.set(dir[0], dir[1], dir[2]);
    flowBasisRef.current.dir.set(dir[0], dir[1], dir[2]);
    flowBasisRef.current.u.set(basis.u[0], basis.u[1], basis.u[2]);
    flowBasisRef.current.v.set(basis.v[0], basis.v[1], basis.v[2]);
  }, [flowDirectionPreset, flowYaw, flowPitch, flowRelativeToBody, angleOfAttack, bodyPitch, bodyRoll]);
  useEffect(() => {
    if (!cfdOnly) {
      return;
    }
    if (dataSource !== "backend") {
      setDataSource("backend");
    }
    if (backendEngine !== "openfoam" && backendEngine !== "fluidx3d") {
      setBackendEngine("openfoam");
    }
    if (backendStatus !== "ready") {
      return;
    }
    if (renderMode !== "vtk") {
      setRenderMode("vtk");
    }
    if (showContextFlow) {
      setShowContextFlow(false);
    }
  }, [cfdOnly, dataSource, backendEngine, renderMode, showContextFlow, backendStatus]);
  useEffect(() => {
    configRef.current.radius = clamp(Number(radius), 0.15, 1.2);
  }, [radius]);
  useEffect(() => {
    configRef.current.turbulence = clamp(Number(turbulence), 0, 2);
  }, [turbulence]);
  useEffect(() => {
    configRef.current.turbulenceModel = turbulenceModel;
  }, [turbulenceModel]);
  useEffect(() => {
    const maxParticles = dataSource === "backend" ? 3200 : 9000;
    configRef.current.particleCount = clamp(Math.floor(Number(particleCount)), 200, maxParticles);
  }, [particleCount, dataSource]);
  useEffect(() => {
    configRef.current.spread = clamp(Number(spread), 0.6, 3.2);
  }, [spread]);
  useEffect(() => {
    configRef.current.density = clamp(Number(density), 0.1, 2000);
  }, [density]);
  useEffect(() => {
    const nuVal = Number(viscosity);
    configRef.current.kinematicViscosity = clamp(Number.isFinite(nuVal) ? nuVal : 1.5e-5, 1e-8, 10);
  }, [viscosity]);
  useEffect(() => {
    if (fluidPreset === "custom") {
      return;
    }
    const preset = FLUID_PRESETS[fluidPreset];
    if (preset?.density) {
      setDensity(String(preset.density));
    }
    if (preset?.nu) {
      setViscosity(String(preset.nu));
    }
  }, [fluidPreset]);
  useEffect(() => {
    configRef.current.dragCoefficient = clamp(Number(dragCoefficient), 0.05, 2.4);
  }, [dragCoefficient]);
  useEffect(() => {
    configRef.current.referenceArea = clamp(Number(referenceArea), 0.01, 2);
  }, [referenceArea]);
  useEffect(() => {
    configRef.current.wakeStrength = clamp(Number(wakeStrength), 0, 2.5);
  }, [wakeStrength]);
  useEffect(() => {
    configRef.current.vortexStrength = clamp(Number(vortexStrength), 0, 2);
  }, [vortexStrength]);
  useEffect(() => {
    configRef.current.angleOfAttack = clamp(Number(angleOfAttack), -25, 25);
  }, [angleOfAttack]);
  useEffect(() => {
    configRef.current.bodyPitch = clamp(Number(bodyPitch), -25, 25);
  }, [bodyPitch]);
  useEffect(() => {
    configRef.current.bodyRoll = clamp(Number(bodyRoll), -25, 25);
  }, [bodyRoll]);
  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    colorizeRef.current = colorize;
  }, [colorize]);
  useEffect(() => {
    colorMapRef.current = colorMap;
  }, [colorMap]);
  useEffect(() => {
    sourceRef.current = dataSource;
  }, [dataSource]);
  useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.visible = showParticles;
    }
  }, [showParticles]);
  useEffect(() => {
    streamlineRef.current = {
      show: showStreamlines,
      count: Number(streamlineCount),
      steps: Number(streamlineSteps),
      step: Number(streamlineStep),
      opacity: Number(streamlineOpacity),
      jitter: Number(streamlineSeedJitter),
      style: streamlineStyle,
      radius: Number(streamlineRadius),
      contactOnly: streamlineContactOnly,
      contactMargin: Number(streamlineContactMargin)
    };
  }, [
    showStreamlines,
    streamlineCount,
    streamlineSteps,
    streamlineStep,
    streamlineOpacity,
    streamlineSeedJitter,
    streamlineStyle,
    streamlineRadius,
    streamlineContactOnly,
    streamlineContactMargin
  ]);

  useEffect(() => {
    if (streamlineContactOnly && showContextFlow) {
      setShowContextFlow(false);
    }
  }, [streamlineContactOnly, showContextFlow]);
  useEffect(() => {
    surfaceRef.current = showSurfacePressure;
  }, [showSurfacePressure]);
  useEffect(() => {
    surfaceConfigRef.current = {
      mode: surfaceMode,
      banding: surfaceBanding,
      bands: clamp(Math.floor(Number(surfaceBands) || 9), 3, 16)
    };
  }, [surfaceMode, surfaceBanding, surfaceBands]);
  useEffect(() => {
    vortexRef.current = showVortexCores;
  }, [showVortexCores]);
  useEffect(() => {
    vorticityConfigRef.current = {
      show: showVorticityField,
      density: clamp(Math.floor(Number(vorticityDensity) || 8), 4, 22),
      opacity: clamp(Number(vorticityOpacity) || 0.28, 0.05, 0.7)
    };
    if (vorticityFieldRef.current) {
      vorticityFieldRef.current.visible = showVorticityField;
    }
    if (rebuildVorticityFieldRef.current) {
      rebuildVorticityFieldRef.current();
    }
  }, [showVorticityField, vorticityDensity, vorticityOpacity]);
  useEffect(() => {
    sliceConfigRef.current = {
      show: showSlice,
      axis: sliceAxis,
      position: clamp(Number(slicePosition), -4, 4),
      resolution: Math.max(8, Math.min(90, Math.floor(Number(sliceResolution) || 36))),
      opacity: clamp(Number(sliceOpacity), 0.1, 0.9),
      mode: sliceMode,
      stack: clamp(Math.floor(Number(sliceStack)), 0, 6),
      spacing: clamp(Number(sliceSpacing), 0.2, 2.0)
    };
    if (sliceRef.current) {
      sliceRef.current.visible = showSlice;
    }
    sliceMeshesRef.current.forEach((mesh) => {
      mesh.visible = showSlice;
    });
    if (rebuildSliceRef.current) {
      rebuildSliceRef.current();
    }
  }, [showSlice, sliceAxis, slicePosition, sliceResolution, sliceOpacity, sliceMode, sliceStack, sliceSpacing]);
  useEffect(() => {
    glyphConfigRef.current = {
      show: showGlyphs,
      density: Math.max(3, Math.min(12, Math.floor(Number(glyphDensity) || 6))),
      scale: clamp(Number(glyphScale), 0.1, 1.5)
    };
    if (glyphGroupRef.current) {
      glyphGroupRef.current.visible = showGlyphs;
    }
    if (rebuildGlyphsRef.current) {
      rebuildGlyphsRef.current();
    }
  }, [showGlyphs, glyphDensity, glyphScale]);
  useEffect(() => {
    flowSheetConfigRef.current = {
      show: showFlowSheet,
      opacity: clamp(Number(flowSheetOpacity), 0.1, 0.8)
    };
    if (flowSheetRef.current) {
      flowSheetRef.current.visible = showFlowSheet;
    }
  }, [showFlowSheet, flowSheetOpacity]);
  useEffect(() => {
    objectOffsetRef.current.set(Number(objectOffsetX) || 0, Number(objectOffsetY) || 0, Number(objectOffsetZ) || 0);
  }, [objectOffsetX, objectOffsetY, objectOffsetZ]);
  useEffect(() => {
    if (rebuildStreamlinesRef.current) {
      rebuildStreamlinesRef.current();
    }
    if (rebuildVorticityFieldRef.current) {
      rebuildVorticityFieldRef.current();
    }
  }, [
    showStreamlines,
    streamlineCount,
    streamlineSteps,
    streamlineStep,
    streamlineOpacity,
    streamlineSeedJitter,
    flowSpeed,
    flowDirectionPreset,
    flowYaw,
    flowPitch,
    flowRelativeToBody,
    radius,
    turbulence,
    wakeStrength,
    vortexStrength,
    angleOfAttack,
    bodyPitch,
    bodyRoll,
    objectOffsetX,
    objectOffsetY,
    objectOffsetZ,
    dataSource,
    backendStatus,
    bodyShape,
    importedLabel,
    colorMap,
    streamlineStyle,
    streamlineRadius,
    streamlineContactOnly,
    streamlineContactMargin,
    showContextFlow,
    contextOpacity,
    contextRadiusScale,
    showBoundaryLayer,
    boundaryLayerMargin,
    boundaryLayerRadius,
    showVortexCores,
    wingAngle,
    wingSpan,
    wingChord,
    rearWing,
    frontWing
  ]);

  const resetBvh = () => {
    bvhMeshesRef.current = [];
    bvhReadyRef.current = false;
  };

  const buildBvhForObject = (root: THREE.Object3D) => {
    const meshes: THREE.Mesh[] = [];
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      const geom = child.geometry as THREE.BufferGeometry | undefined;
      if (!geom || !geom.attributes?.position) {
        return;
      }
      try {
        if (!(geom as unknown as { boundsTree?: MeshBVH }).boundsTree) {
          (geom as unknown as { computeBoundsTree?: () => void }).computeBoundsTree?.();
        }
        meshes.push(child);
      } catch {
        // Ignore BVH build errors and fall back to bounds.
      }
    });
    bvhMeshesRef.current = meshes;
    bvhReadyRef.current = meshes.length > 0;
  };

  const applyStandardMaterial = (root: THREE.Object3D) => {
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.4,
          metalness: 0.25,
          vertexColors: true
        });
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  };

  const centerAndMeasure = (root: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    root.position.sub(center);
    const radius = Math.max(size.x, size.y, size.z) * 0.5 || 0.5;
    importedBaseRadiusRef.current = radius;
    setRadius(radius.toFixed(3));
    const area = Math.max(size.x * size.y, size.x * size.z, size.y * size.z);
    if (Number.isFinite(area) && area > 0) {
      setReferenceArea(area.toFixed(3));
    }
  };

  const parseLegacyVtk = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8");
    let offset = 0;
    const readLine = () => {
      const start = offset;
      while (offset < bytes.length && bytes[offset] !== 10 && bytes[offset] !== 13) {
        offset += 1;
      }
      const line = decoder.decode(bytes.slice(start, offset)).trim();
      while (offset < bytes.length && (bytes[offset] === 10 || bytes[offset] === 13)) {
        offset += 1;
      }
      return line;
    };
    const skipWhitespace = () => {
      while (offset < bytes.length && bytes[offset] <= 32) {
        offset += 1;
      }
    };
    const parseNumbers = (line: string) =>
      line
        .split(/\s+/)
        .filter(Boolean)
        .map((val) => Number(val));

    readLine();
    readLine();
    const formatLine = readLine().toUpperCase();
    const isBinary = formatLine.includes("BINARY");
    let nx = 0;
    let ny = 0;
    let nz = 0;
    let origin: [number, number, number] = [0, 0, 0];
    let spacing: [number, number, number] = [1, 1, 1];
    let pointCount = 0;
    let vectors: number[] = [];
    let scalars: number[] | undefined;
    const readBinaryValues = (count: number, type: string) => {
      const view = new DataView(buffer);
      const values = new Array<number>(count);
      for (let i = 0; i < count; i += 1) {
        if (type === "double") {
          values[i] = view.getFloat64(offset, false);
          offset += 8;
        } else {
          values[i] = view.getFloat32(offset, false);
          offset += 4;
        }
      }
      return values;
    };

    while (offset < bytes.length) {
      const line = readLine();
      if (!line) {
        continue;
      }
      const upper = line.toUpperCase();
      if (upper.startsWith("DIMENSIONS")) {
        const nums = parseNumbers(line);
        nx = nums[1] ?? 0;
        ny = nums[2] ?? 0;
        nz = nums[3] ?? 0;
        pointCount = nx * ny * nz;
      } else if (upper.startsWith("ORIGIN")) {
        const nums = parseNumbers(line);
        origin = [nums[1] ?? 0, nums[2] ?? 0, nums[3] ?? 0];
      } else if (upper.startsWith("SPACING") || upper.startsWith("ASPECT_RATIO")) {
        const nums = parseNumbers(line);
        spacing = [nums[1] ?? 1, nums[2] ?? 1, nums[3] ?? 1];
      } else if (upper.startsWith("POINT_DATA")) {
        const nums = parseNumbers(line);
        pointCount = nums[1] ?? pointCount;
      } else if (upper.startsWith("VECTORS")) {
        const parts = line.split(/\s+/);
        const type = (parts[2] ?? "float").toLowerCase();
        if (isBinary) {
          skipWhitespace();
          vectors = readBinaryValues(pointCount * 3, type);
        } else {
          const values: number[] = [];
          while (values.length < pointCount * 3 && offset < bytes.length) {
            const dataLine = readLine();
            if (!dataLine) {
              continue;
            }
            values.push(...parseNumbers(dataLine));
          }
          vectors = values.slice(0, pointCount * 3);
        }
      } else if (upper.startsWith("SCALARS")) {
        const parts = line.split(/\s+/);
        const type = (parts[2] ?? "float").toLowerCase();
        const lookupLine = readLine();
        if (!lookupLine.toUpperCase().startsWith("LOOKUP_TABLE")) {
          continue;
        }
        if (isBinary) {
          skipWhitespace();
          scalars = readBinaryValues(pointCount, type);
        } else {
          const values: number[] = [];
          while (values.length < pointCount && offset < bytes.length) {
            const dataLine = readLine();
            if (!dataLine) {
              continue;
            }
            values.push(...parseNumbers(dataLine));
          }
          scalars = values.slice(0, pointCount);
        }
      }
    }

    if (!nx || !ny || !nz || !vectors.length) {
      throw new Error("VTK field missing dimensions or vectors.");
    }
    const ux: number[] = new Array(pointCount);
    const uy: number[] = new Array(pointCount);
    const uz: number[] = new Array(pointCount);
    for (let i = 0; i < pointCount; i += 1) {
      const base = i * 3;
      ux[i] = vectors[base] ?? 0;
      uy[i] = vectors[base + 1] ?? 0;
      uz[i] = vectors[base + 2] ?? 0;
    }
    return {
      nx,
      ny,
      nz,
      origin,
      spacing: (spacing[0] + spacing[1] + spacing[2]) / 3,
      ux,
      uy,
      uz,
      p: scalars
    } as BackendField;
  };

  const handleImport = async (file: File | null) => {
    if (!file) {
      return;
    }
    setImportError("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (ext === "glb" || ext === "gltf") {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
        const loader = new GLTFLoader();
        const buffer = await file.arrayBuffer();
        const gltf = await new Promise<{ scene: THREE.Object3D }>((resolve, reject) => {
          loader.parse(buffer, "", (result: { scene: THREE.Object3D }) => resolve(result), reject);
        });
        const scene = gltf.scene;
        if (!scene) {
          throw new Error("No scene found in file.");
        }
        applyStandardMaterial(scene);
        centerAndMeasure(scene);
        importedObjectRef.current = scene;
        buildBvhForObject(scene);
        setBodyShape("custom");
        setImportedLabel(file.name);
      } else if (ext === "obj") {
        const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader");
        const loader = new OBJLoader();
        const text = await file.text();
        const obj = loader.parse(text);
        applyStandardMaterial(obj);
        centerAndMeasure(obj);
        importedObjectRef.current = obj;
        buildBvhForObject(obj);
        setBodyShape("custom");
        setImportedLabel(file.name);
      } else if (ext === "stl") {
        const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader");
        const loader = new STLLoader();
        const buffer = await file.arrayBuffer();
        const geometry = loader.parse(buffer);
        const mesh = new THREE.Mesh(geometry);
        const group = new THREE.Group();
        group.add(mesh);
        applyStandardMaterial(group);
        centerAndMeasure(group);
        importedObjectRef.current = group;
        buildBvhForObject(group);
        setBodyShape("custom");
        setImportedLabel(file.name);
      } else {
        setImportError("Unsupported format. Use .glb, .gltf, .obj, or .stl");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      setImportError(message);
    }
  };

  const handleFluidx3dFieldImport = async (file: File | null) => {
    if (!file) {
      return;
    }
    setFluidx3dFieldError("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const buffer = await file.arrayBuffer();
      let data: any = null;
      if (ext === "vti") {
        const { vtkXMLImageDataReader } = await import("@kitware/vtk.js/IO/XML/XMLImageDataReader");
        const reader = vtkXMLImageDataReader.newInstance();
        reader.parseAsArrayBuffer(buffer);
        data = reader.getOutputData(0);
      } else if (ext === "vtk") {
        data = parseLegacyVtk(buffer);
      } else {
        throw new Error("Use a .vtk or .vti field file exported from FluidX3D.");
      }
      let field: BackendField;
      if (ext === "vtk") {
        field = data as BackendField;
      } else {
        if (!data?.getDimensions || !data?.getPointData) {
          throw new Error("Unsupported VTK dataset. Please export as image data.");
        }
        const dims = data.getDimensions();
        if (!dims || dims.length < 3) {
          throw new Error("Field dimensions missing.");
        }
        const origin = data.getOrigin?.() ?? [0, 0, 0];
        const spacingVec = data.getSpacing?.() ?? [1, 1, 1];
        const spacing = (spacingVec[0] + spacingVec[1] + spacingVec[2]) / 3;
        const pointData = data.getPointData();
        const velocityArray =
          pointData.getArrayByName?.("U") ??
          pointData.getArrayByName?.("velocity") ??
          pointData.getArrayByName?.("Velocity") ??
          pointData.getVectors?.();
        if (!velocityArray) {
          throw new Error("No velocity vector field found. Expect array named 'U' or active vectors.");
        }
        const tuples = velocityArray.getNumberOfTuples();
        if (!tuples || tuples <= 0) {
          throw new Error("Velocity field is empty.");
        }
        const comp = velocityArray.getNumberOfComponents?.() ?? 3;
        if (comp < 3) {
          throw new Error("Velocity field must have 3 components.");
        }
        const raw = velocityArray.getData();
        const ux: number[] = new Array(tuples);
        const uy: number[] = new Array(tuples);
        const uz: number[] = new Array(tuples);
        for (let i = 0; i < tuples; i += 1) {
          const base = i * comp;
          ux[i] = raw[base] ?? 0;
          uy[i] = raw[base + 1] ?? 0;
          uz[i] = raw[base + 2] ?? 0;
        }
        const pArray =
          pointData.getArrayByName?.("p") ??
          pointData.getArrayByName?.("pressure") ??
          pointData.getArrayByName?.("Pressure");
        let p: number[] | undefined;
        if (pArray) {
          const pRaw = pArray.getData();
          if (pRaw && pRaw.length >= tuples) {
            p = new Array(tuples);
            for (let i = 0; i < tuples; i += 1) {
              p[i] = pRaw[i] ?? 0;
            }
          }
        }
        field = {
          nx: dims[0],
          ny: dims[1],
          nz: dims[2],
          origin: [origin[0], origin[1], origin[2]],
          spacing: Number.isFinite(spacing) && spacing > 0 ? spacing : 1,
          ux,
          uy,
          uz,
          p
        };
      }
      fluidx3dFieldRef.current = field;
      backendFieldRef.current = field;
      setFluidx3dFieldLabel(file.name);
      setFluidx3dFieldMeta({ nx: field.nx, ny: field.ny, nz: field.nz });
      setBackendStatus("ready");
      setBackendError("");
      setDataSource("backend");
      setBackendEngine("fluidx3d");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import field.";
      setFluidx3dFieldError(message);
    }
  };

  const requestBackendField = async (meshIdOverride?: string) => {
    setBackendStatus("loading");
    setBackendError("");
    try {
      const meshId = meshIdOverride ?? meshMeta?.meshId;
      const dir = flowDirectionRef.current;
      const res = await fetch("/api/cfd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: backendEngine,
          flowSpeed: Number(flowSpeed),
          flowDir: [dir.x, dir.y, dir.z],
          radius: Number(radius),
          resolution: Number(backendResolution),
          steps: Number(backendSteps),
          exportPath: exportPath || undefined,
          requireBackend: cfdOnly,
          meshId: backendEngine === "openfoam" || backendEngine === "fluidx3d" ? meshId : undefined
        })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.error) {
        if (backendEngine === "fluidx3d" && fluidx3dFieldRef.current) {
          backendFieldRef.current = fluidx3dFieldRef.current;
          setBackendStatus("ready");
          setBackendError("");
          return;
        }
        setBackendStatus("error");
        setBackendError(payload?.error || "CFD backend failed to return a field.");
        return;
      }
      if (payload?.field) {
        const field = payload.field as BackendField;
        if (field.p && field.p.length) {
          let minP = Infinity;
          let maxP = -Infinity;
          field.p.forEach((val) => {
            if (!Number.isFinite(val)) {
              return;
            }
            minP = Math.min(minP, val);
            maxP = Math.max(maxP, val);
          });
          field.pMin = minP;
          field.pMax = maxP;
        }
        backendFieldRef.current = field;
        if (backendEngine === "fluidx3d") {
          fluidx3dFieldRef.current = field;
          setFluidx3dFieldLabel(payload?.path ? String(payload.path) : "FluidX3D preview");
          setFluidx3dFieldMeta({ nx: field.nx, ny: field.ny, nz: field.nz });
        }
        setBackendStatus("ready");
      } else {
        setBackendStatus("error");
        setBackendError("CFD backend returned an empty field.");
      }
    } catch {
      if (backendEngine === "fluidx3d" && fluidx3dFieldRef.current) {
        backendFieldRef.current = fluidx3dFieldRef.current;
        setBackendStatus("ready");
        setBackendError("");
        return;
      }
      setBackendStatus("error");
      setBackendError("CFD backend request failed.");
    }
  };

  const backendUrl = (() => {
    const envUrl = process.env.NEXT_PUBLIC_CFD_BACKEND_URL;
    if (envUrl) return envUrl;
    if (typeof window === "undefined") return "";
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8000";
    }
    return "";
  })();

  const ensureBackendReachable = async (engineOverride?: "lbm" | "openfoam" | "fluidx3d") => {
    const engine = engineOverride ?? backendEngine;
    if (engine === "fluidx3d" && fluidx3dFieldRef.current) {
      setBackendStatus("ready");
      setBackendError("");
      return true;
    }
    if (!backendUrl) {
      setBackendStatus("error");
      setBackendError("CFD backend not configured. Set NEXT_PUBLIC_CFD_BACKEND_URL or start http://localhost:8000.");
      backendFieldRef.current = null;
      setBackendMeta(null);
      return false;
    }
    try {
      const res = await fetch(`${backendUrl}/status`);
      if (!res.ok) {
        throw new Error("Backend status failed");
      }
      const payload = await res.json().catch(() => null);
      if (payload) {
        setBackendMeta(payload);
      }
      setBackendStatus("idle");
      setBackendError("");
      return true;
    } catch {
      setBackendStatus("error");
      setBackendError(`CFD backend not reachable at ${backendUrl}. Start the backend or update the URL.`);
      backendFieldRef.current = null;
      setBackendMeta(null);
      return false;
    }
  };

  const activateBackendMode = async (engineOverride?: "lbm" | "openfoam" | "fluidx3d") => {
    setDataSource("backend");
    setRenderMode("vtk");
    setShowStreamlines(true);
    if (showContextFlow) {
      setShowContextFlow(false);
    }
    await ensureBackendReachable(engineOverride);
  };

  const handleDataSourceChange = (nextSource: "analytic" | "backend") => {
    if (nextSource === "backend") {
      void activateBackendMode(backendEngine);
      return;
    }
    setDataSource("analytic");
    setCfdOnly(false);
    setBackendError("");
    setBackendStatus("idle");
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let active = true;
    const restore = async () => {
      setSessionError("");
      const raw = window.localStorage.getItem(CFD_SESSION_KEY);
      if (!raw) {
        if (active) {
          setSessionReady(true);
        }
        return;
      }
      try {
        const snapshot = JSON.parse(raw) as CfdSessionSnapshot;
        if (!snapshot || snapshot.version !== 1) {
          window.localStorage.removeItem(CFD_SESSION_KEY);
          if (active) {
            setSessionReady(true);
          }
          return;
        }
        sessionSnapshotRef.current = snapshot;
        if (snapshot.dataSource) setDataSource(snapshot.dataSource);
        if (snapshot.backendEngine) setBackendEngine(snapshot.backendEngine);
        if (snapshot.renderMode) setRenderMode(snapshot.renderMode);
        if (typeof snapshot.cfdOnly === "boolean") setCfdOnly(snapshot.cfdOnly);
        if (snapshot.flowSpeed) setFlowSpeed(snapshot.flowSpeed);
        if (snapshot.flowDirectionPreset) setFlowDirectionPreset(snapshot.flowDirectionPreset);
        if (snapshot.flowYaw) setFlowYaw(snapshot.flowYaw);
        if (snapshot.flowPitch) setFlowPitch(snapshot.flowPitch);
        if (typeof snapshot.flowRelativeToBody === "boolean") setFlowRelativeToBody(snapshot.flowRelativeToBody);
        if (snapshot.radius) setRadius(snapshot.radius);
        if (snapshot.turbulence) setTurbulence(snapshot.turbulence);
        if (snapshot.turbulenceModel) setTurbulenceModel(snapshot.turbulenceModel);
        if (snapshot.particleCount) setParticleCount(snapshot.particleCount);
        if (snapshot.spread) setSpread(snapshot.spread);
        if (snapshot.density) setDensity(snapshot.density);
        if (snapshot.viscosity) setViscosity(snapshot.viscosity);
        if (snapshot.dragCoefficient) setDragCoefficient(snapshot.dragCoefficient);
        if (snapshot.referenceArea) setReferenceArea(snapshot.referenceArea);
        if (snapshot.wakeStrength) setWakeStrength(snapshot.wakeStrength);
        if (snapshot.vortexStrength) setVortexStrength(snapshot.vortexStrength);
        if (snapshot.angleOfAttack) setAngleOfAttack(snapshot.angleOfAttack);
        if (snapshot.bodyPitch) setBodyPitch(snapshot.bodyPitch);
        if (snapshot.bodyRoll) setBodyRoll(snapshot.bodyRoll);
        if (typeof snapshot.showParticles === "boolean") setShowParticles(snapshot.showParticles);
        if (typeof snapshot.showStreamlines === "boolean") setShowStreamlines(snapshot.showStreamlines);
        if (snapshot.streamlineCount) setStreamlineCount(snapshot.streamlineCount);
        if (snapshot.streamlineSteps) setStreamlineSteps(snapshot.streamlineSteps);
        if (snapshot.streamlineStep) setStreamlineStep(snapshot.streamlineStep);
        if (snapshot.streamlineOpacity) setStreamlineOpacity(snapshot.streamlineOpacity);
        if (snapshot.streamlineSeedJitter) setStreamlineSeedJitter(snapshot.streamlineSeedJitter);
        if (snapshot.streamlineStyle) setStreamlineStyle(snapshot.streamlineStyle);
        if (snapshot.streamlineRadius) setStreamlineRadius(snapshot.streamlineRadius);
        if (typeof snapshot.streamlineContactOnly === "boolean") setStreamlineContactOnly(snapshot.streamlineContactOnly);
        if (snapshot.streamlineContactMargin) setStreamlineContactMargin(snapshot.streamlineContactMargin);
        if (typeof snapshot.showContextFlow === "boolean") setShowContextFlow(snapshot.showContextFlow);
        if (snapshot.contextOpacity) setContextOpacity(snapshot.contextOpacity);
        if (snapshot.contextRadiusScale) setContextRadiusScale(snapshot.contextRadiusScale);
        if (snapshot.objectOffsetX) setObjectOffsetX(snapshot.objectOffsetX);
        if (snapshot.objectOffsetY) setObjectOffsetY(snapshot.objectOffsetY);
        if (snapshot.objectOffsetZ) setObjectOffsetZ(snapshot.objectOffsetZ);
        if (typeof snapshot.showBoundaryLayer === "boolean") setShowBoundaryLayer(snapshot.showBoundaryLayer);
        if (snapshot.boundaryLayerMargin) setBoundaryLayerMargin(snapshot.boundaryLayerMargin);
        if (snapshot.boundaryLayerRadius) setBoundaryLayerRadius(snapshot.boundaryLayerRadius);
        if (typeof snapshot.showSurfacePressure === "boolean") setShowSurfacePressure(snapshot.showSurfacePressure);
        if (snapshot.surfaceMode) setSurfaceMode(snapshot.surfaceMode);
        if (typeof snapshot.surfaceBanding === "boolean") setSurfaceBanding(snapshot.surfaceBanding);
        if (snapshot.surfaceBands) setSurfaceBands(snapshot.surfaceBands);
        if (typeof snapshot.showVortexCores === "boolean") setShowVortexCores(snapshot.showVortexCores);
        if (typeof snapshot.showVorticityField === "boolean") setShowVorticityField(snapshot.showVorticityField);
        if (snapshot.vorticityDensity) setVorticityDensity(snapshot.vorticityDensity);
        if (snapshot.vorticityOpacity) setVorticityOpacity(snapshot.vorticityOpacity);
        if (typeof snapshot.showSlice === "boolean") setShowSlice(snapshot.showSlice);
        if (snapshot.sliceAxis) setSliceAxis(snapshot.sliceAxis);
        if (snapshot.slicePosition) setSlicePosition(snapshot.slicePosition);
        if (snapshot.sliceResolution) setSliceResolution(snapshot.sliceResolution);
        if (snapshot.sliceOpacity) setSliceOpacity(snapshot.sliceOpacity);
        if (snapshot.sliceMode) setSliceMode(snapshot.sliceMode);
        if (snapshot.sliceStack) setSliceStack(snapshot.sliceStack);
        if (snapshot.sliceSpacing) setSliceSpacing(snapshot.sliceSpacing);
        if (typeof snapshot.showGlyphs === "boolean") setShowGlyphs(snapshot.showGlyphs);
        if (snapshot.glyphDensity) setGlyphDensity(snapshot.glyphDensity);
        if (snapshot.glyphScale) setGlyphScale(snapshot.glyphScale);
        if (typeof snapshot.showFlowSheet === "boolean") setShowFlowSheet(snapshot.showFlowSheet);
        if (snapshot.flowSheetOpacity) setFlowSheetOpacity(snapshot.flowSheetOpacity);
        if (typeof snapshot.rearWing === "boolean") setRearWing(snapshot.rearWing);
        if (typeof snapshot.frontWing === "boolean") setFrontWing(snapshot.frontWing);
        if (snapshot.wingAngle) setWingAngle(snapshot.wingAngle);
        if (snapshot.wingSpan) setWingSpan(snapshot.wingSpan);
        if (snapshot.wingChord) setWingChord(snapshot.wingChord);
        if (snapshot.bodyShape) setBodyShape(snapshot.bodyShape);
        if (snapshot.colorMap) setColorMap(snapshot.colorMap);
        if (snapshot.backendResolution) setBackendResolution(snapshot.backendResolution);
        if (snapshot.backendSteps) setBackendSteps(snapshot.backendSteps);
        if (snapshot.exportPath) setExportPath(snapshot.exportPath);
        if (typeof snapshot.autoSwapFinal === "boolean") setAutoSwapFinal(snapshot.autoSwapFinal);
        if (typeof snapshot.autoRefresh === "boolean") setAutoRefresh(snapshot.autoRefresh);
        if (snapshot.autoRefreshInterval) setAutoRefreshInterval(snapshot.autoRefreshInterval);

        if (snapshot.meshId && backendUrl) {
          try {
            const res = await fetch(`${backendUrl}/mesh/${snapshot.meshId}/meta`);
            const meta = (await res.json()) as MeshMeta;
            if (active) {
              if (res.ok && !meta?.error) {
                setMeshMeta(meta);
              } else {
                window.localStorage.removeItem(CFD_SESSION_KEY);
                sessionSnapshotRef.current = null;
              }
            }
          } catch {
            if (active) {
              window.localStorage.removeItem(CFD_SESSION_KEY);
              sessionSnapshotRef.current = null;
            }
          }
        }
      } catch (error) {
        window.localStorage.removeItem(CFD_SESSION_KEY);
        sessionSnapshotRef.current = null;
        if (active) {
          setSessionError(error instanceof Error ? error.message : "Failed to restore session.");
        }
      }
      if (active) {
        setSessionReady(true);
      }
    };
    restore();
    return () => {
      active = false;
    };
  }, [backendUrl]);

  useEffect(() => {
    if (typeof window === "undefined" || !sessionReady) {
      return;
    }
    const snapshot: CfdSessionSnapshot = {
      version: 1,
      meshId: meshMeta?.meshId,
      dataSource,
      backendEngine,
      renderMode,
      cfdOnly,
      flowSpeed,
      flowDirectionPreset,
      flowYaw,
      flowPitch,
      flowRelativeToBody,
      radius,
      turbulence,
      turbulenceModel,
      particleCount,
      spread,
      density,
      viscosity,
      dragCoefficient,
      referenceArea,
      wakeStrength,
      vortexStrength,
      angleOfAttack,
      bodyPitch,
      bodyRoll,
      showParticles,
      showStreamlines,
      streamlineCount,
      streamlineSteps,
      streamlineStep,
      streamlineOpacity,
      streamlineSeedJitter,
      streamlineStyle,
      streamlineRadius,
      streamlineContactOnly,
      streamlineContactMargin,
      showContextFlow,
      contextOpacity,
      contextRadiusScale,
      objectOffsetX,
      objectOffsetY,
      objectOffsetZ,
      showBoundaryLayer,
      boundaryLayerMargin,
      boundaryLayerRadius,
      showSurfacePressure,
      surfaceMode,
      surfaceBanding,
      surfaceBands,
      showVortexCores,
      showVorticityField,
      vorticityDensity,
      vorticityOpacity,
      showSlice,
      sliceAxis,
      slicePosition,
      sliceResolution,
      sliceOpacity,
      sliceMode,
      sliceStack,
      sliceSpacing,
      showGlyphs,
      glyphDensity,
      glyphScale,
      showFlowSheet,
      flowSheetOpacity,
      rearWing,
      frontWing,
      wingAngle,
      wingSpan,
      wingChord,
      bodyShape,
      colorMap,
      backendResolution,
      backendSteps,
      exportPath,
      autoSwapFinal,
      autoRefresh,
      autoRefreshInterval
    };
    try {
      window.localStorage.setItem(CFD_SESSION_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage errors (quota or disabled).
    }
  }, [
    sessionReady,
    meshMeta?.meshId,
    dataSource,
    backendEngine,
    renderMode,
    cfdOnly,
    flowSpeed,
    flowDirectionPreset,
    flowYaw,
    flowPitch,
    flowRelativeToBody,
    radius,
    turbulence,
    turbulenceModel,
    particleCount,
    spread,
    density,
    viscosity,
    dragCoefficient,
    referenceArea,
    wakeStrength,
    vortexStrength,
    angleOfAttack,
    bodyPitch,
    bodyRoll,
    showParticles,
    showStreamlines,
    streamlineCount,
    streamlineSteps,
    streamlineStep,
    streamlineOpacity,
    streamlineSeedJitter,
    streamlineStyle,
    streamlineRadius,
    streamlineContactOnly,
    streamlineContactMargin,
    showContextFlow,
    contextOpacity,
    contextRadiusScale,
    objectOffsetX,
    objectOffsetY,
    objectOffsetZ,
    showBoundaryLayer,
    boundaryLayerMargin,
    boundaryLayerRadius,
    showSurfacePressure,
    surfaceMode,
    surfaceBanding,
    surfaceBands,
    showVortexCores,
    showVorticityField,
    vorticityDensity,
    vorticityOpacity,
    showSlice,
    sliceAxis,
    slicePosition,
    sliceResolution,
    sliceOpacity,
    sliceMode,
    sliceStack,
    sliceSpacing,
    showGlyphs,
    glyphDensity,
    glyphScale,
    showFlowSheet,
    flowSheetOpacity,
    rearWing,
    frontWing,
    wingAngle,
    wingSpan,
    wingChord,
    bodyShape,
    colorMap,
    backendResolution,
    backendSteps,
    exportPath,
    autoSwapFinal,
    autoRefresh,
    autoRefreshInterval
  ]);

  const handleMeshUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    if (!backendUrl) {
      setMeshUploadStatus("error");
      setMeshUploadError("Set NEXT_PUBLIC_CFD_BACKEND_URL to enable mesh upload.");
      return;
    }
    setMeshUploadStatus("uploading");
    setMeshUploadError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${backendUrl}/mesh`, { method: "POST", body: form });
      const payload = (await res.json()) as MeshMeta;
      if (!res.ok || payload?.error) {
        setMeshUploadStatus("error");
        setMeshUploadError(payload?.error ?? "Mesh upload failed.");
        return;
      }
      setMeshMeta(payload);
      setMeshUploadStatus("ready");
      setBackendError("");
      setDataSource("backend");
      setRenderMode("vtk");
      setBackendEngine("fluidx3d");
      setAutoRefresh(true);
      await requestBackendField(payload.meshId);
      await runFullPipelineWithMesh(payload.meshId);
    } catch (error) {
      setMeshUploadStatus("error");
      setMeshUploadError(error instanceof Error ? error.message : "Mesh upload failed.");
    }
  };

  const loadCaseTemplates = async () => {
    if (!backendUrl || !meshMeta?.meshId) {
      setCaseStatus("error");
      return;
    }
    setCaseStatus("loading");
    try {
      const res = await fetch(`${backendUrl}/case/${meshMeta.meshId}`);
      const payload = (await res.json()) as { templates?: Record<string, string>; error?: string };
      if (!res.ok || payload.error || !payload.templates) {
        setCaseStatus("error");
        return;
      }
      setCaseTemplates(payload.templates);
      setCaseStatus("ready");
    } catch {
      setCaseStatus("error");
    }
  };

  const loadQueue = async () => {
    if (!backendUrl) {
      return;
    }
    setQueueStatus("loading");
    try {
      const res = await fetch(`${backendUrl}/queue`);
      const payload = (await res.json()) as { jobs?: { id: string; status: string; notes: string; meshId: string }[] };
      setQueueJobs(payload.jobs ?? []);
      setQueueStatus("idle");
    } catch {
      setQueueStatus("error");
    }
  };

  const createQueueJob = async () => {
    if (!backendUrl || !meshMeta?.meshId) {
      return;
    }
    setQueueStatus("loading");
    try {
      const res = await fetch(`${backendUrl}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meshId: meshMeta.meshId, notes: queueNote })
      });
      const payload = await res.json();
      if (!res.ok || payload?.error) {
        setQueueStatus("error");
        return;
      }
      setQueueNote("");
      await loadQueue();
      setQueueStatus("idle");
    } catch {
      setQueueStatus("error");
    }
  };

  const updateQueueJob = async (jobId: string, status: string) => {
    if (!backendUrl) {
      return;
    }
    setQueueStatus("loading");
    try {
      const res = await fetch(`${backendUrl}/queue/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = await res.json();
      if (!res.ok || payload?.error) {
        setQueueStatus("error");
        return;
      }
      await loadQueue();
      setQueueStatus("idle");
    } catch {
      setQueueStatus("error");
    }
  };

  const fetchBackendStatus = async () => {
    try {
      const statusUrl = meshMeta?.meshId ? `/api/cfd?meshId=${encodeURIComponent(meshMeta.meshId)}` : "/api/cfd";
      const res = await fetch(statusUrl);
      if (!res.ok) {
        return null;
      }
      const payload = (await res.json()) as {
        openfoam?: string;
        openfoamPath?: string;
        openfoamPressurePath?: string;
        openfoamMtime?: number;
        openfoamSize?: number;
        fluidx3d?: string;
        fluidx3dPath?: string;
        fluidx3dMtime?: number;
        fluidx3dSize?: number;
        status?: string;
      };
      setBackendMeta(payload);
      return payload;
    } catch {
      return null;
    }
  };

  const generateCase = async (meshIdOverride?: string): Promise<boolean> => {
    const targetMeshId = meshIdOverride ?? meshMeta?.meshId;
    if (!backendUrl || !targetMeshId) {
      setCaseBuildStatus("error");
      setCaseBuildError("Upload a mesh to the CFD backend first.");
      return false;
    }
    const dir = flowDirectionRef.current;
    setCaseBuildStatus("loading");
    setCaseBuildError("");
    try {
      const res = await fetch(`${backendUrl}/case/${targetMeshId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowSpeed: Number(flowSpeed),
          nu: Number(viscosity),
          overwrite: overwriteCase,
          zip: true,
          flowDir: [dir.x, dir.y, dir.z],
          angleOfAttack: Number(angleOfAttack),
          bodyPitch: Number(bodyPitch),
          bodyRoll: Number(bodyRoll),
          density: Number(density),
          referenceArea: Number(referenceArea),
          turbulenceModel: turbulenceModel === "sst" ? "sst" : undefined
        })
      });
      const payload = await res.json();
      if (!res.ok || payload?.error) {
        setCaseBuildStatus("error");
        setCaseBuildError(payload?.error ?? "Case generation failed.");
        return false;
      }
      setCaseInfo(payload);
      setCaseBuildStatus("ready");
      return true;
    } catch (error) {
      setCaseBuildStatus("error");
      setCaseBuildError(error instanceof Error ? error.message : "Case generation failed.");
      return false;
    }
  };

  const runCase = async (meshIdOverride?: string): Promise<boolean> => {
    const targetMeshId = meshIdOverride ?? meshMeta?.meshId;
    if (!backendUrl || !targetMeshId) {
      setRunStatus("error");
      setRunError("Upload a mesh to the CFD backend first.");
      return false;
    }
    const dir = flowDirectionRef.current;
    setRunStatus("running");
    setRunError("");
    try {
      const res = await fetch(`${backendUrl}/case/${targetMeshId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solver: "simpleFoam",
          useWsl: true,
          flowSpeed: Number(flowSpeed),
          nu: Number(viscosity),
          overwrite: overwriteCase,
          flowDir: [dir.x, dir.y, dir.z],
          angleOfAttack: Number(angleOfAttack),
          bodyPitch: Number(bodyPitch),
          bodyRoll: Number(bodyRoll),
          density: Number(density),
          referenceArea: Number(referenceArea),
          turbulenceModel: turbulenceModel === "sst" ? "sst" : undefined
        })
      });
      const payload = await res.json();
      if (!res.ok || payload?.error) {
        setRunStatus("error");
        setRunError(payload?.error ?? "Run request failed.");
        setCaseInfo((prev) => ({ ...prev, command: payload?.command }));
        return false;
      }
      setCaseInfo((prev) => ({ ...prev, command: payload?.command }));
      setRunStatus("idle");
      return true;
    } catch (error) {
      setRunStatus("error");
      setRunError(error instanceof Error ? error.message : "Run request failed.");
      return false;
    }
  };

  const fetchRunLog = async (meshIdOverride?: string) => {
    const targetMeshId = meshIdOverride ?? meshMeta?.meshId;
    if (!backendUrl || !targetMeshId) {
      return;
    }
    setRunLogStatus("loading");
    try {
      const res = await fetch(`${backendUrl}/case/${targetMeshId}/log?tail=200`);
      const payload = await res.json();
      if (!res.ok || payload?.error) {
        setRunLogStatus("error");
        return;
      }
      setRunLogLines(Array.isArray(payload?.lines) ? payload.lines : []);
      setRunLogStatus("idle");
    } catch {
      setRunLogStatus("error");
    }
  };

  const runFullPipeline = async () => {
    if (!backendUrl || !meshMeta?.meshId) {
      return;
    }
    const built = await generateCase();
    if (!built) {
      return;
    }
    const started = await runCase();
    if (started) {
      setAutoRefresh(true);
      await fetchBackendStatus();
    }
  };

  const runFullPipelineWithMesh = async (meshId: string) => {
    if (!backendUrl || !meshId) {
      return;
    }
    const built = await generateCase(meshId);
    if (!built) {
      return;
    }
    const started = await runCase(meshId);
    if (started) {
      setAutoRefresh(true);
      await fetchBackendStatus();
    }
  };

  useEffect(() => {
    if (!sessionReady) {
      return;
    }
    if (dataSource === "backend" && (backendEngine === "openfoam" || backendEngine === "fluidx3d")) {
      fetchBackendStatus();
    }
  }, [sessionReady, dataSource, backendEngine, exportPath, meshMeta?.meshId]);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }
    if (!autoSwapFinal || dataSource !== "backend") {
      return;
    }
    if (backendMeta?.openfoam === "ready" && backendEngine !== "openfoam") {
      setBackendEngine("openfoam");
      setRenderMode("vtk");
    }
  }, [sessionReady, autoSwapFinal, dataSource, backendMeta?.openfoam, backendEngine]);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }
    if (!autoRefresh || dataSource !== "backend") {
      return;
    }
    if (backendEngine !== "openfoam" && backendEngine !== "fluidx3d") {
      return;
    }
    let active = true;
    const intervalSeconds = Math.max(2, Number(autoRefreshInterval) || 6);
    const tick = async () => {
      if (!active) {
        return;
      }
      const status = await fetchBackendStatus();
      const mtime = backendEngine === "fluidx3d" ? status?.fluidx3dMtime : status?.openfoamMtime;
      if (!mtime) {
        return;
      }
      const lastRef = backendEngine === "fluidx3d" ? lastFluidx3dMtimeRef : lastOpenfoamMtimeRef;
      if (mtime !== lastRef.current) {
        lastRef.current = mtime;
        await requestBackendField();
      }
    };
    tick();
    const id = window.setInterval(tick, intervalSeconds * 1000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [autoRefresh, autoRefreshInterval, dataSource, backendEngine, meshMeta?.meshId]);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }
    if (dataSource !== "backend") {
      setBackendStatus("idle");
      backendFieldRef.current = null;
      return;
    }
    if ((backendEngine === "openfoam" || backendEngine === "fluidx3d") && !meshMeta?.meshId) {
      return;
    }
    requestBackendField();
  }, [
    sessionReady,
    dataSource,
    flowSpeed,
    radius,
    backendResolution,
    backendSteps,
    backendEngine,
    exportPath,
    meshMeta?.meshId,
    flowDirectionPreset,
    flowYaw,
    flowPitch,
    flowRelativeToBody,
    angleOfAttack,
    bodyPitch,
    bodyRoll
  ]);

  useEffect(() => {
    if (renderMode !== "vtk") {
      return;
    }
    const container = vtkContainerRef.current;
    if (!container) {
      return;
    }
    let cleanup = () => {};
    let canceled = false;

    const build = async () => {
      try {
      setVtkMessage("");
      let field = backendFieldRef.current;
      const wantsOpenfoam = dataSource === "backend" && backendEngine === "openfoam";
      const strictOpenfoam = cfdOnly && wantsOpenfoam;
      let streamPolyData: any = null;
      let streamScalarName = "velocity";
      let maxSpeed = 0;
      let vtkNote = "";
      let meshErrorNote = "";
      let meshBounds: number[] | null = null;
      let surfaceDistance: ((x: number, y: number, z: number) => number) | null = null;
      const offsetVec: [number, number, number] = [
        Number(objectOffsetX) || 0,
        Number(objectOffsetY) || 0,
        Number(objectOffsetZ) || 0
      ];
      const yawDeg = Number(angleOfAttack) || 0;
      const pitchDeg = Number(bodyPitch) || 0;
      const rollDeg = Number(bodyRoll) || 0;
      const bodyRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler((pitchDeg * Math.PI) / 180, (yawDeg * Math.PI) / 180, (rollDeg * Math.PI) / 180)
      );
      const bodyInvRotation = bodyRotation.clone().invert();
      const bodyOffset = new THREE.Vector3(offsetVec[0], offsetVec[1], offsetVec[2]);
      const buildProxyField = (): BackendField | null => {
        const radiusVal = clamp(Number(radius) || 0.35, 0.15, 2.5);
        const boundsMin = meshMeta?.bounds?.min;
        const boundsMax = meshMeta?.bounds?.max;
        const fallbackSpan = Math.max(radiusVal * 3.2, 1.6);
        const center = boundsMin && boundsMax
          ? [
              (boundsMin[0] + boundsMax[0]) * 0.5 + offsetVec[0],
              (boundsMin[1] + boundsMax[1]) * 0.5 + offsetVec[1],
              (boundsMin[2] + boundsMax[2]) * 0.5 + offsetVec[2]
            ]
          : [offsetVec[0], offsetVec[1], offsetVec[2]];
        const span =
          boundsMin && boundsMax
            ? Math.max(boundsMax[0] - boundsMin[0], boundsMax[1] - boundsMin[1], boundsMax[2] - boundsMin[2]) * 0.9
            : fallbackSpan;
        const extent = Math.max(span, fallbackSpan);
        const res = clamp(Math.floor(Number(backendResolution) || 32), 18, 48);
        const spacing = (extent * 2) / Math.max(1, res - 1);
        const origin: [number, number, number] = [center[0] - extent, center[1] - extent, center[2] - extent];
        const count = res * res * res;
        if (!Number.isFinite(count) || count <= 0) {
          return null;
        }
        const ux = new Array<number>(count);
        const uy = new Array<number>(count);
        const uz = new Array<number>(count);
        const dirVec = flowDirectionRef.current;
        const Ux = dirVec.x * (Number(flowSpeed) || 0);
        const Uy = dirVec.y * (Number(flowSpeed) || 0);
        const Uz = dirVec.z * (Number(flowSpeed) || 0);
        let idx = 0;
        for (let k = 0; k < res; k += 1) {
          const z = origin[2] + k * spacing;
          for (let j = 0; j < res; j += 1) {
            const y = origin[1] + j * spacing;
            for (let i = 0; i < res; i += 1) {
              const x = origin[0] + i * spacing;
              const cx = x - center[0];
              const cy = y - center[1];
              const cz = z - center[2];
              const r2 = cx * cx + cy * cy + cz * cz + 1e-5;
              const r = Math.sqrt(r2);
              const n1 = cx / r;
              const n2 = cy / r;
              const n3 = cz / r;
              const dot = Ux * n1 + Uy * n2 + Uz * n3;
              const factor = (radiusVal * radiusVal * radiusVal) / (2 * r2 * r);
              ux[idx] = Ux + factor * (3 * dot * n1 - Ux);
              uy[idx] = Uy + factor * (3 * dot * n2 - Uy);
              uz[idx] = Uz + factor * (3 * dot * n3 - Uz);
              idx += 1;
            }
          }
        }
        return {
          nx: res,
          ny: res,
          nz: res,
          origin,
          spacing,
          ux,
          uy,
          uz
        };
      };
      if (!field) {
        const proxy = buildProxyField();
        if (proxy) {
          field = proxy;
          vtkNote = "No CFD field yet. Using analytic proxy flow for preview.";
        }
      }

      const [
        _vtkGeometryProfile,
        vtkRenderWindow,
        vtkOpenGLRenderWindow,
        vtkRenderer,
        vtkRenderWindowInteractor,
        vtkImageData,
        vtkPolyData,
        vtkDataArray,
        vtkPoints,
        vtkCellArray,
        vtkImageStreamline,
        vtkTubeFilter,
        vtkMapper,
        vtkActor,
        vtkColorTransferFunction,
        vtkPlaneSource,
        vtkSphereSource,
        vtkCubeSource,
        vtkCylinderSource,
        vtkInteractorStyleTrackballCamera,
        vtkSTLReader,
        vtkPLYReader,
        vtkLegacyPolyDataReader,
        vtkXMLPolyDataReader
      ] = await Promise.all([
        import("@kitware/vtk.js/Rendering/Profiles/Geometry"),
        import("@kitware/vtk.js/Rendering/Core/RenderWindow").then((m) => m.default),
        import("@kitware/vtk.js/Rendering/OpenGL/RenderWindow").then((m) => m.default),
        import("@kitware/vtk.js/Rendering/Core/Renderer").then((m) => m.default),
        import("@kitware/vtk.js/Rendering/Core/RenderWindowInteractor").then((m) => m.default),
        import("@kitware/vtk.js/Common/DataModel/ImageData").then((m) => m.default),
        import("@kitware/vtk.js/Common/DataModel/PolyData").then((m) => m.default),
        import("@kitware/vtk.js/Common/Core/DataArray").then((m) => m.default),
        import("@kitware/vtk.js/Common/Core/Points").then((m) => m.default),
        import("@kitware/vtk.js/Common/Core/CellArray").then((m) => m.default),
        import("@kitware/vtk.js/Filters/General/ImageStreamline").then((m) => m.default),
        import("@kitware/vtk.js/Filters/General/TubeFilter").then((m) => m.default),
        import("@kitware/vtk.js/Rendering/Core/Mapper").then((m) => m.default),
        import("@kitware/vtk.js/Rendering/Core/Actor").then((m) => m.default),
        import("@kitware/vtk.js/Rendering/Core/ColorTransferFunction").then((m) => m.default),
        import("@kitware/vtk.js/Filters/Sources/PlaneSource").then((m) => m.default),
        import("@kitware/vtk.js/Filters/Sources/SphereSource").then((m) => m.default),
        import("@kitware/vtk.js/Filters/Sources/CubeSource").then((m) => m.default),
        import("@kitware/vtk.js/Filters/Sources/CylinderSource").then((m) => m.default),
        import("@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera").then((m) => m.default),
        import("@kitware/vtk.js/IO/Geometry/STLReader").then((m) => m.default),
        import("@kitware/vtk.js/IO/Geometry/PLYReader").then((m) => m.default),
        import("@kitware/vtk.js/IO/Legacy/PolyDataReader").then((m) => m.default),
        import("@kitware/vtk.js/IO/XML/XMLPolyDataReader").then((m) => m.default)
      ]);
      if (canceled) {
        return;
      }
      const flowSpeedVal = Number(flowSpeed) || 0;
      const baseDirVec = flowDirectionRef.current;
      const flowSign = flowSpeedVal >= 0 ? 1 : -1;
      const fallbackDir = normalizeVec3(baseDirVec.x * flowSign, baseDirVec.y * flowSign, baseDirVec.z * flowSign);
      const pickFieldDir = (source: BackendField | null) => {
        if (!source) {
          return null;
        }
        const total = source.ux.length;
        if (!total) {
          return null;
        }
        const sampleCount = Math.min(1200, total);
        const step = Math.max(1, Math.floor(total / sampleCount));
        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;
        let count = 0;
        for (let i = 0; i < total; i += step) {
          const vx = source.ux[i] ?? 0;
          const vy = source.uy[i] ?? 0;
          const vz = source.uz[i] ?? 0;
          const mag = Math.sqrt(vx * vx + vy * vy + vz * vz);
          if (mag < 1e-6) {
            continue;
          }
          sumX += vx;
          sumY += vy;
          sumZ += vz;
          count += 1;
        }
        if (!count) {
          return null;
        }
        const dir = normalizeVec3(sumX, sumY, sumZ);
        return dir;
      };
      const fieldDir = pickFieldDir(field);
      const flowDir = fieldDir ?? fallbackDir;
      const flowBasis = basisFromDirection(flowDir);

      if (wantsOpenfoam && backendUrl && meshMeta?.meshId) {
        try {
          const infoRes = await fetch(`${backendUrl}/case/${meshMeta.meshId}/streamlines`);
          if (infoRes.ok) {
            const info = await infoRes.json();
            if (info && !info.error && info.filename) {
              const ext = String(info.filename).split(".").pop()?.toLowerCase() ?? "vtk";
              const fileRes = await fetch(`${backendUrl}/case/${meshMeta.meshId}/streamlines/download`);
              if (fileRes.ok) {
                const buffer = await fileRes.arrayBuffer();
                if (ext === "vtp") {
                  const reader = vtkXMLPolyDataReader.newInstance();
                  reader.parseAsArrayBuffer(buffer);
                  streamPolyData = reader.getOutputData(0);
                } else {
                  const reader = vtkLegacyPolyDataReader.newInstance();
                  reader.parseAsArrayBuffer(buffer);
                  streamPolyData = reader.getOutputData(0);
                }
              }
            }
          }
        } catch {
          streamPolyData = null;
        }
      }

      if (streamPolyData?.getPoints?.() && streamPolyData.getPoints().getNumberOfPoints() > 0) {
        const points = streamPolyData.getPoints();
        const pointCount = points.getNumberOfPoints();
        const vectors =
          streamPolyData.getPointData().getArrayByName("U") ||
          streamPolyData.getPointData().getArrayByName("velocity") ||
          streamPolyData.getPointData().getVectors();
        let speeds = new Float32Array(pointCount);
        if (vectors && typeof vectors.getData === "function") {
          const data = vectors.getData() as Float32Array;
          const comps = vectors.getNumberOfComponents ? vectors.getNumberOfComponents() : 3;
          for (let i = 0; i < pointCount; i += 1) {
            const idx = i * comps;
            const vx = data[idx] ?? 0;
            const vy = data[idx + 1] ?? 0;
            const vz = data[idx + 2] ?? 0;
            const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
            speeds[i] = speed;
            if (speed > maxSpeed) {
              maxSpeed = speed;
            }
          }
        } else {
          speeds = new Float32Array(pointCount).fill(1);
          maxSpeed = 1;
        }
        const speedArray = vtkDataArray.newInstance({
          name: "speed",
          numberOfComponents: 1,
          values: speeds
        });
        streamPolyData.getPointData().addArray(speedArray);
        streamPolyData.getPointData().setScalars(speedArray);
        streamScalarName = "speed";
        vtkNote = "Using OpenFOAM streamlines output.";
      } else {
        streamPolyData = null;
      }

      let streamTracer: any = null;
      const contactMarginFactor = clamp(Number(streamlineContactMargin), 0.01, 0.6);
      const filterStreamlinesByContact = (
        polyData: any,
        bounds: number[] | null,
        marginFactor = contactMarginFactor,
        force = false,
        distanceFn: ((x: number, y: number, z: number) => number) | null = null
      ) => {
        if ((!streamlineContactOnly && !force) || !polyData || !bounds) {
          return polyData;
        }
        const lines = polyData.getLines?.().getData?.() as Uint32Array | undefined;
        const points = polyData.getPoints?.().getData?.() as Float32Array | undefined;
        if (!lines || !points) {
          return polyData;
        }
        const maxDim = Math.max(bounds[1] - bounds[0], bounds[3] - bounds[2], bounds[5] - bounds[4], 1e-3);
        const marginAbs = maxDim * marginFactor;
        const filtered: number[] = [];
        let offset = 0;
        let kept = 0;
        const trimSegments = streamlineContactOnly || force;
        const distToBounds = (x: number, y: number, z: number) => {
          const dx = Math.max(bounds[0] - x, 0, x - bounds[1]);
          const dy = Math.max(bounds[2] - y, 0, y - bounds[3]);
          const dz = Math.max(bounds[4] - z, 0, z - bounds[5]);
          if (dx > 0 || dy > 0 || dz > 0) {
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
          }
          return Math.min(x - bounds[0], bounds[1] - x, y - bounds[2], bounds[3] - y, z - bounds[4], bounds[5] - z);
        };
        while (offset < lines.length) {
          const n = lines[offset];
          if (n < 2) {
            offset += n + 1;
            continue;
          }
          const ids: number[] = [];
          for (let i = 0; i < n; i += 1) {
            ids.push(lines[offset + 1 + i]);
          }
          if (trimSegments) {
            let segment: number[] = [];
            for (let i = 0; i < ids.length; i += 1) {
              const idx = ids[i] * 3;
              const dist = distanceFn
                ? distanceFn(points[idx], points[idx + 1], points[idx + 2])
                : distToBounds(points[idx], points[idx + 1], points[idx + 2]);
              if (dist <= marginAbs) {
                segment.push(ids[i]);
              } else if (segment.length >= 2) {
                filtered.push(segment.length, ...segment);
                kept += 1;
                segment = [];
              } else {
                segment = [];
              }
            }
            if (segment.length >= 2) {
              filtered.push(segment.length, ...segment);
              kept += 1;
            }
          } else {
            let touches = false;
            for (let i = 0; i < ids.length; i += 1) {
              const idx = ids[i] * 3;
              const dist = distanceFn
                ? distanceFn(points[idx], points[idx + 1], points[idx + 2])
                : distToBounds(points[idx], points[idx + 1], points[idx + 2]);
              if (dist <= marginAbs) {
                touches = true;
                break;
              }
            }
            if (touches) {
              filtered.push(ids.length, ...ids);
              kept += 1;
            }
          }
          offset += n + 1;
        }
        if (!kept) {
          return polyData;
        }
        const output = vtkPolyData.newInstance();
        output.shallowCopy(polyData);
        output.getLines().setData(new Uint32Array(filtered));
        return output;
      };
      if (!streamPolyData) {
        let fieldReady = Boolean(field);
        if (!field) {
          setVtkMessage(
            strictOpenfoam
              ? "OpenFOAM field missing. Set OPENFOAM_EXPORT_PATH (or export path above) and refresh CFD."
              : "Waiting for CFD field. Switch to backend + OpenFOAM and click Refresh CFD."
          );
          fieldReady = false;
        }
        if (strictOpenfoam && !streamPolyData) {
          setVtkMessage(
            "OpenFOAM streamlines not found. Showing surface-seeded fallback from the sampled field."
          );
        }
        if (fieldReady) {
          const {
            nx,
            ny,
            nz,
            origin,
            spacing,
            ux: uxArr,
            uy: uyArr,
            uz: uzArr
          } = field!;
          const count = nx * ny * nz;
          if (!count || uxArr.length < count || uyArr.length < count || uzArr.length < count) {
            setVtkMessage("CFD field is incomplete.");
          } else {

            const vectors = new Float32Array(count * 3);
            for (let i = 0; i < count; i += 1) {
              const vx = uxArr[i] ?? 0;
              const vy = uyArr[i] ?? 0;
              const vz = uzArr[i] ?? 0;
              const i3 = i * 3;
              vectors[i3] = vx;
              vectors[i3 + 1] = vy;
              vectors[i3 + 2] = vz;
              const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
              if (speed > maxSpeed) {
                maxSpeed = speed;
              }
            }

            const image = vtkImageData.newInstance();
            (image as any).setOrigin(origin[0], origin[1], origin[2]);
            (image as any).setSpacing(spacing, spacing, spacing);
            (image as any).setDimensions(nx, ny, nz);
            const vectorArray = vtkDataArray.newInstance({
              name: "velocity",
              numberOfComponents: 3,
              values: vectors
            });
            image.getPointData().setVectors(vectorArray);

            const xMin = origin[0];
            const yMin = origin[1];
            const zMin = origin[2];
            const xMax = origin[0] + spacing * (nx - 1);
            const yMax = origin[1] + spacing * (ny - 1);
            const zMax = origin[2] + spacing * (nz - 1);
            const center = [(xMin + xMax) * 0.5, (yMin + yMax) * 0.5, (zMin + zMax) * 0.5];
            const halfX = (xMax - xMin) * 0.5;
            const halfY = (yMax - yMin) * 0.5;
            const halfZ = (zMax - zMin) * 0.5;
            const meshMin = meshMeta?.bounds?.min;
            const meshMax = meshMeta?.bounds?.max;
            const meshCenter = meshMin && meshMax
              ? [
                  (meshMin[0] + meshMax[0]) * 0.5 + offsetVec[0],
                  (meshMin[1] + meshMax[1]) * 0.5 + offsetVec[1],
                  (meshMin[2] + meshMax[2]) * 0.5 + offsetVec[2]
                ]
              : center;
            const meshHalfX = meshMin && meshMax ? (meshMax[0] - meshMin[0]) * 0.5 : 0;
            const meshHalfY = meshMin && meshMax ? (meshMax[1] - meshMin[1]) * 0.5 : 0;
            const meshHalfZ = meshMin && meshMax ? (meshMax[2] - meshMin[2]) * 0.5 : 0;
            const spanX = Math.max(halfX, meshHalfX);
            const spanY = Math.max(halfY, meshHalfY);
            const spanZ = Math.max(halfZ, meshHalfZ);
            const extent =
              Math.abs(flowDir[0]) * spanX +
              Math.abs(flowDir[1]) * spanY +
              Math.abs(flowDir[2]) * spanZ;
            const planeCenter = [
              meshCenter[0] - flowDir[0] * (extent * 1.08 + spacing * 2),
              meshCenter[1] - flowDir[1] * (extent * 1.08 + spacing * 2),
              meshCenter[2] - flowDir[2] * (extent * 1.08 + spacing * 2)
            ];
            const sizeU =
              (Math.abs(flowBasis.u[0]) * spanX +
                Math.abs(flowBasis.u[1]) * spanY +
                Math.abs(flowBasis.u[2]) * spanZ) *
              1.2;
            const sizeV =
              (Math.abs(flowBasis.v[0]) * spanX +
                Math.abs(flowBasis.v[1]) * spanY +
                Math.abs(flowBasis.v[2]) * spanZ) *
              1.2;
            const originPlane = [
              planeCenter[0] - flowBasis.u[0] * sizeU - flowBasis.v[0] * sizeV,
              planeCenter[1] - flowBasis.u[1] * sizeU - flowBasis.v[1] * sizeV,
              planeCenter[2] - flowBasis.u[2] * sizeU - flowBasis.v[2] * sizeV
            ] as [number, number, number];
            const point1 = [
              planeCenter[0] + flowBasis.u[0] * sizeU - flowBasis.v[0] * sizeV,
              planeCenter[1] + flowBasis.u[1] * sizeU - flowBasis.v[1] * sizeV,
              planeCenter[2] + flowBasis.u[2] * sizeU - flowBasis.v[2] * sizeV
            ] as [number, number, number];
            const point2 = [
              planeCenter[0] - flowBasis.u[0] * sizeU + flowBasis.v[0] * sizeV,
              planeCenter[1] - flowBasis.u[1] * sizeU + flowBasis.v[1] * sizeV,
              planeCenter[2] - flowBasis.u[2] * sizeU + flowBasis.v[2] * sizeV
            ] as [number, number, number];

            const seedDensity = Math.max(8, Math.min(42, Math.floor(Math.sqrt(Number(streamlineCount) || 320))));
            const seeds = vtkPlaneSource.newInstance({
              origin: originPlane,
              point1,
              point2,
              xResolution: seedDensity,
              yResolution: seedDensity
            });

            const maxSteps = clamp(Number(streamlineSteps), 40, 800);
            streamTracer = vtkImageStreamline.newInstance({
              integrationStep: spacing * 0.8,
              maximumNumberOfSteps: maxSteps
            });
            streamTracer.setInputData(image);
            streamTracer.setInputConnection(seeds.getOutputPort(), 1);
            streamTracer.update?.();
            streamPolyData = streamTracer.getOutputData?.() ?? null;
            streamScalarName = "velocity";
            vtkNote = wantsOpenfoam ? "OpenFOAM streamlines not found; using in-browser tracer." : "";
          }
        }
      }

      const sampleField = (x: number, y: number, z: number) => {
        if (!field) {
          return null;
        }
        const { nx, ny, nz, origin, spacing, ux: uxArr, uy: uyArr, uz: uzArr, p } = field;
        if (!nx || !ny || !nz) {
          return null;
        }
        const fx = (x - origin[0]) / spacing;
        const fy = (y - origin[1]) / spacing;
        const fz = (z - origin[2]) / spacing;
        if (fx < 0 || fy < 0 || fz < 0 || fx > nx - 1 || fy > ny - 1 || fz > nz - 1) {
          return null;
        }
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const z0 = Math.floor(fz);
        const x1 = Math.min(nx - 1, x0 + 1);
        const y1 = Math.min(ny - 1, y0 + 1);
        const z1 = Math.min(nz - 1, z0 + 1);
        const tx = fx - x0;
        const ty = fy - y0;
        const tz = fz - z0;
        const idx = (ix: number, iy: number, iz: number) => (iz * ny + iy) * nx + ix;
        const c000 = idx(x0, y0, z0);
        const c100 = idx(x1, y0, z0);
        const c010 = idx(x0, y1, z0);
        const c110 = idx(x1, y1, z0);
        const c001 = idx(x0, y0, z1);
        const c101 = idx(x1, y0, z1);
        const c011 = idx(x0, y1, z1);
        const c111 = idx(x1, y1, z1);
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const lerp3 = (vals: number[]) => {
          const c00 = lerp(vals[0], vals[1], tx);
          const c10 = lerp(vals[2], vals[3], tx);
          const c01 = lerp(vals[4], vals[5], tx);
          const c11 = lerp(vals[6], vals[7], tx);
          const c0 = lerp(c00, c10, ty);
          const c1 = lerp(c01, c11, ty);
          return lerp(c0, c1, tz);
        };
        const vx = lerp3([uxArr[c000], uxArr[c100], uxArr[c010], uxArr[c110], uxArr[c001], uxArr[c101], uxArr[c011], uxArr[c111]]);
        const vy = lerp3([uyArr[c000], uyArr[c100], uyArr[c010], uyArr[c110], uyArr[c001], uyArr[c101], uyArr[c011], uyArr[c111]]);
        const vz = lerp3([uzArr[c000], uzArr[c100], uzArr[c010], uzArr[c110], uzArr[c001], uzArr[c101], uzArr[c011], uzArr[c111]]);
        let pVal: number | undefined;
        if (p && p.length) {
          pVal = lerp3([p[c000], p[c100], p[c010], p[c110], p[c001], p[c101], p[c011], p[c111]]);
        }
        return { vx, vy, vz, p: pVal };
      };

      let pMin = field?.pMin ?? 0;
      let pMax = field?.pMax ?? 1;
      if (field?.p && (!Number.isFinite(pMin) || !Number.isFinite(pMax) || pMin === pMax)) {
        let minVal = Infinity;
        let maxVal = -Infinity;
        field.p.forEach((val) => {
          if (Number.isFinite(val)) {
            minVal = Math.min(minVal, val);
            maxVal = Math.max(maxVal, val);
          }
        });
        if (Number.isFinite(minVal) && Number.isFinite(maxVal) && minVal !== maxVal) {
          pMin = minVal;
          pMax = maxVal;
          field.pMin = minVal;
          field.pMax = maxVal;
        }
      }

      container.innerHTML = "";
      const renderWindow = vtkRenderWindow.newInstance();
      const renderer = vtkRenderer.newInstance();
      renderer.setBackground(0.96, 0.95, 0.93);
      renderWindow.addRenderer(renderer);
      const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
      openGLRenderWindow.setContainer(container);
      const { width, height } = container.getBoundingClientRect();
      openGLRenderWindow.setSize(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
      renderWindow.addView(openGLRenderWindow);
      const interactor = vtkRenderWindowInteractor.newInstance();
      interactor.setView(openGLRenderWindow);
      interactor.initialize();
      interactor.bindEvents(container);
      interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

      if (vtkNote) {
        setVtkMessage(vtkNote);
      }

      let meshLoaded = false;
      let meshPoly: any = null;
      let meshMapper: any = null;
      let meshActor: any = null;
      const applySurfaceScalars = (
        poly: any,
        transform?: { rot: THREE.Quaternion; offset: THREE.Vector3 },
        worldCenter?: [number, number, number]
      ) => {
        if (!showSurfacePressure || !poly?.getPoints?.()) {
          return;
        }
        const pts = poly.getPoints().getData() as Float32Array;
        if (!pts || pts.length < 3) {
          return;
        }
        const count = pts.length / 3;
        const scalars = new Float32Array(count);
        const bounds = poly.getBounds();
        const center = worldCenter ?? [
          (bounds[0] + bounds[1]) * 0.5,
          (bounds[2] + bounds[3]) * 0.5,
          (bounds[4] + bounds[5]) * 0.5
        ];
        const speedRef = Math.max(0.4, maxSpeed || Math.abs(flowSpeedVal) || 1);
        const bandCount = clamp(Math.floor(Number(surfaceBands) || 9), 3, 16);
        const tmp = new THREE.Vector3();
        for (let i = 0; i < count; i += 1) {
          const i3 = i * 3;
          let x = pts[i3];
          let y = pts[i3 + 1];
          let z = pts[i3 + 2];
          if (transform) {
            tmp.set(x, y, z).applyQuaternion(transform.rot).add(transform.offset);
            x = tmp.x;
            y = tmp.y;
            z = tmp.z;
          }
          const nx = x - center[0];
          const ny = y - center[1];
          const nz = z - center[2];
          const nLen = Math.max(1e-4, Math.sqrt(nx * nx + ny * ny + nz * nz));
          const normalTerm = clamp((-nx / nLen) * flowDir[0] + (-ny / nLen) * flowDir[1] + (-nz / nLen) * flowDir[2], 0, 1);
          let speedSample = Math.abs(flowSpeedVal);
          const sample = sampleField(x, y, z);
          if (sample) {
            speedSample = Math.sqrt(sample.vx * sample.vx + sample.vy * sample.vy + sample.vz * sample.vz);
          }
          let tCol = normalTerm;
          if (surfaceMode === "pressure" && sample && Number.isFinite(sample.p)) {
            const denom = (pMax ?? 1) - (pMin ?? 0) || 1;
            tCol = clamp(((sample.p ?? 0) - (pMin ?? 0)) / denom, 0, 1);
          } else if (surfaceMode === "speed") {
            tCol = clamp(speedSample / speedRef, 0, 1);
          } else if (surfaceMode === "cp") {
            const U = Math.max(0.1, Math.abs(flowSpeedVal));
            const cp = 1 - (speedSample / U) ** 2;
            tCol = clamp((cp + 1) * 0.5, 0, 1);
          } else if (surfaceMode === "separation") {
            const ds = Math.max(0.02, Math.abs(bounds[1] - bounds[0]) * 0.015);
            const U = Math.max(0.1, Math.abs(flowSpeedVal));
            const up = sampleField(x - flowDir[0] * ds, y - flowDir[1] * ds, z - flowDir[2] * ds);
            const dn = sampleField(x + flowDir[0] * ds, y + flowDir[1] * ds, z + flowDir[2] * ds);
            const upSpeed = up ? Math.sqrt(up.vx * up.vx + up.vy * up.vy + up.vz * up.vz) : speedSample;
            const dnSpeed = dn ? Math.sqrt(dn.vx * dn.vx + dn.vy * dn.vy + dn.vz * dn.vz) : speedSample;
            const cpUp = 1 - (upSpeed / U) ** 2;
            const cpDn = 1 - (dnSpeed / U) ** 2;
            const dCp = cpDn - cpUp;
            tCol = clamp(0.5 + dCp * 1.2, 0, 1);
          } else if (surfaceMode === "pressure") {
            tCol = clamp(0.6 * normalTerm + 0.4 * (1 - clamp(speedSample / speedRef, 0, 1)), 0, 1);
          }
          const speedHeat = clamp(Math.pow(speedSample / speedRef, 0.6), 0, 1);
          const speedBias = surfaceMode === "speed" ? 0.85 : 0.45;
          tCol = clamp(tCol * (1 - speedBias) + speedHeat * speedBias, 0, 1);
          if (surfaceBanding) {
            tCol = Math.round(tCol * (bandCount - 1)) / (bandCount - 1);
          }
          scalars[i] = clamp(tCol, 0, 1);
        }
        const scalarArray = vtkDataArray.newInstance({ name: "surfaceScalar", numberOfComponents: 1, values: scalars });
        poly.getPointData().setScalars(scalarArray);
      };
      const buildSurfaceDistance = (
        poly: any,
        transform?: { invRot: THREE.Quaternion; offset: THREE.Vector3 }
      ) => {
        if (!poly?.getPoints?.() || !poly?.getPolys?.()) {
          return null;
        }
        const pts = poly.getPoints().getData() as Float32Array | undefined;
        const polys = poly.getPolys().getData() as Uint32Array | undefined;
        if (!pts || !polys || pts.length < 3) {
          return null;
        }
        const positions = new Float32Array(pts.length);
        positions.set(pts);
        const indices: number[] = [];
        let offset = 0;
        while (offset < polys.length) {
          const n = polys[offset++];
          if (n < 3) {
            offset += n;
            continue;
          }
          const first = polys[offset];
          for (let j = 1; j < n - 1; j += 1) {
            indices.push(first, polys[offset + j], polys[offset + j + 1]);
          }
          offset += n;
        }
        if (!indices.length) {
          return null;
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geom.setIndex(indices);
        if ((geom as unknown as { computeBoundsTree?: () => void }).computeBoundsTree) {
          (geom as unknown as { computeBoundsTree?: () => void }).computeBoundsTree?.();
        }
        const mesh = new THREE.Mesh(geom);
        const tmpPoint = new THREE.Vector3();
        const tmpClosest = new THREE.Vector3();
        const boundsTree = (geom as unknown as { boundsTree?: MeshBVH }).boundsTree;
        if (!boundsTree) {
          return null;
        }
        return (x: number, y: number, z: number) => {
          tmpPoint.set(x, y, z);
          if (transform) {
            tmpPoint.sub(transform.offset).applyQuaternion(transform.invRot);
          }
          (boundsTree as any).closestPointToPoint(tmpPoint, mesh, tmpClosest);
          return tmpPoint.distanceTo(tmpClosest);
        };
      };
      const buildSurfaceSeedPoly = (
        poly: any,
        desired: number,
        transform?: { rot: THREE.Quaternion; offset: THREE.Vector3 }
      ) => {
        if (!poly?.getPoints?.()) {
          return null;
        }
        const pts = poly.getPoints().getData() as Float32Array | undefined;
        if (!pts || pts.length < 3) {
          return null;
        }
        const total = Math.floor(pts.length / 3);
        const target = clamp(desired, 40, total);
        const stride = Math.max(1, Math.floor(total / target));
        const values = new Float32Array(target * 3);
        let count = 0;
        const tmp = new THREE.Vector3();
        for (let i = 0; i < total && count < target; i += stride) {
          const i3 = i * 3;
          let x = pts[i3];
          let y = pts[i3 + 1];
          let z = pts[i3 + 2];
          if (transform) {
            tmp.set(x, y, z).applyQuaternion(transform.rot).add(transform.offset);
            x = tmp.x;
            y = tmp.y;
            z = tmp.z;
          }
          values[count * 3] = x;
          values[count * 3 + 1] = y;
          values[count * 3 + 2] = z;
          count += 1;
        }
        if (!count) {
          return null;
        }
        const points = vtkPoints.newInstance();
        points.setData(values.slice(0, count * 3), 3);
        const verts = new Uint32Array(count * 2);
        for (let i = 0; i < count; i += 1) {
          verts[i * 2] = 1;
          verts[i * 2 + 1] = i;
        }
        const cells = vtkCellArray.newInstance({ values: verts });
        const seedPoly = vtkPolyData.newInstance();
        seedPoly.setPoints(points);
        seedPoly.setVerts(cells);
        return seedPoly;
      };
      const buildStreamlinesFromField = (seedPoly: any) => {
        if (!field) {
          return null;
        }
        const { nx, ny, nz, origin, spacing, ux: uxArr, uy: uyArr, uz: uzArr } = field;
        const count = nx * ny * nz;
        if (!count || uxArr.length < count || uyArr.length < count || uzArr.length < count) {
          return null;
        }
        const vectors = new Float32Array(count * 3);
        let localMax = 0;
        for (let i = 0; i < count; i += 1) {
          const vx = uxArr[i] ?? 0;
          const vy = uyArr[i] ?? 0;
          const vz = uzArr[i] ?? 0;
          const i3 = i * 3;
          vectors[i3] = vx;
          vectors[i3 + 1] = vy;
          vectors[i3 + 2] = vz;
          const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
          if (speed > localMax) {
            localMax = speed;
          }
        }
        const image = vtkImageData.newInstance();
        (image as any).setOrigin(origin[0], origin[1], origin[2]);
        (image as any).setSpacing(spacing, spacing, spacing);
        (image as any).setDimensions(nx, ny, nz);
        const vectorArray = vtkDataArray.newInstance({
          name: "velocity",
          numberOfComponents: 3,
          values: vectors
        });
        image.getPointData().setVectors(vectorArray);

        const maxSteps = clamp(Number(streamlineSteps), 40, 800);
        const tracer = vtkImageStreamline.newInstance({
          integrationStep: spacing * 0.8,
          maximumNumberOfSteps: maxSteps
        });
        tracer.setInputData(image);
        if (seedPoly) {
          tracer.setInputData(seedPoly, 1);
        }
        tracer.update?.();
        return { poly: tracer.getOutputData?.() ?? null, maxSpeed: localMax };
      };

      if (backendUrl && meshMeta?.meshId) {
        try {
          const ext = meshMeta.filename?.split(".").pop()?.toLowerCase() ?? "";
          const res = await fetch(`${backendUrl}/mesh/${meshMeta.meshId}`);
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            if (ext === "stl") {
              const reader = vtkSTLReader.newInstance();
              reader.parseAsArrayBuffer(buffer);
              meshPoly = reader.getOutputData(0);
              meshLoaded = true;
            } else if (ext === "ply") {
              const reader = vtkPLYReader.newInstance();
              reader.parseAsArrayBuffer(buffer);
              meshPoly = reader.getOutputData(0);
              meshLoaded = true;
            } else if (ext === "obj") {
              meshErrorNote = "OBJ import is not available in this VTK build. Use STL or PLY for the VTK view.";
            }
          } else {
            meshErrorNote = "Mesh fetch failed. Check the backend log.";
          }
        } catch {
          meshErrorNote = "Mesh fetch failed. Check the backend log.";
        }
      }

      if (meshLoaded && meshPoly) {
        lastVtkMeshRef.current = meshPoly;
      }
      if (!meshLoaded) {
        if (meshMeta?.meshId) {
          if (lastVtkMeshRef.current) {
            meshPoly = lastVtkMeshRef.current;
            meshLoaded = true;
            if (meshErrorNote) {
              vtkNote = meshErrorNote + " Showing last cached mesh.";
            }
          } else if (meshErrorNote) {
            vtkNote = meshErrorNote;
          }
        } else {
          const bodySize = Math.max(0.3, Number(radius) || 0.35);
          if (bodyShape === "sphere") {
            const sphere = vtkSphereSource.newInstance({ radius: bodySize, thetaResolution: 40, phiResolution: 40 });
            meshPoly = sphere.getOutputData();
          } else if (bodyShape === "cylinder" || bodyShape === "capsule") {
            const cyl = vtkCylinderSource.newInstance({ radius: bodySize * 0.45, height: bodySize * 2.6, resolution: 40 });
            meshPoly = cyl.getOutputData();
          } else {
            const cube = vtkCubeSource.newInstance({
              xLength: bodySize * 1.4,
              yLength: bodySize * 1.1,
              zLength: bodySize * 0.9
            });
            meshPoly = cube.getOutputData();
          }
        }
      }

      if (meshPoly) {
        const rawBounds = meshPoly.getBounds();
        const pts = meshPoly.getPoints?.().getData?.() as Float32Array | undefined;
        if (pts && pts.length >= 3) {
          let minX = Infinity;
          let minY = Infinity;
          let minZ = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          let maxZ = -Infinity;
          const tmp = new THREE.Vector3();
          for (let i = 0; i < pts.length; i += 3) {
            tmp.set(pts[i], pts[i + 1], pts[i + 2]).applyQuaternion(bodyRotation).add(bodyOffset);
            minX = Math.min(minX, tmp.x);
            minY = Math.min(minY, tmp.y);
            minZ = Math.min(minZ, tmp.z);
            maxX = Math.max(maxX, tmp.x);
            maxY = Math.max(maxY, tmp.y);
            maxZ = Math.max(maxZ, tmp.z);
          }
          if (Number.isFinite(minX) && Number.isFinite(maxX)) {
            meshBounds = [minX, maxX, minY, maxY, minZ, maxZ];
          } else {
            meshBounds = rawBounds;
          }
        } else {
          meshBounds = rawBounds;
        }
        const worldCenter: [number, number, number] | undefined = meshBounds
          ? [
              (meshBounds[0] + meshBounds[1]) * 0.5,
              (meshBounds[2] + meshBounds[3]) * 0.5,
              (meshBounds[4] + meshBounds[5]) * 0.5
            ]
          : undefined;
        meshMapper = vtkMapper.newInstance();
        meshMapper.setInputData(meshPoly);
        if (showSurfacePressure) {
          applySurfaceScalars(meshPoly, { rot: bodyRotation, offset: bodyOffset }, worldCenter);
          const surfaceCtf = vtkColorTransferFunction.newInstance();
          surfaceCtf.addRGBPoint(0, 0.12, 0.35, 0.85);
          surfaceCtf.addRGBPoint(0.5, 0.95, 0.8, 0.2);
          surfaceCtf.addRGBPoint(1, 0.9, 0.15, 0.15);
          meshMapper.setLookupTable(surfaceCtf);
          meshMapper.setScalarModeToUsePointFieldData();
          meshMapper.setColorByArrayName("surfaceScalar");
          meshMapper.setScalarRange(0, 1);
          meshMapper.setScalarVisibility(true);
        }
        meshActor = vtkActor.newInstance();
        meshActor.setMapper(meshMapper);
        if (!showSurfacePressure) {
          meshActor.getProperty().setColor(0.92, 0.92, 0.92);
        }
        meshActor.setOrientation(pitchDeg, yawDeg, rollDeg);
        meshActor.setPosition(...offsetVec);
        renderer.addActor(meshActor);
        surfaceDistance = buildSurfaceDistance(meshPoly, { invRot: bodyInvRotation, offset: bodyOffset });
      }

      if (streamlineContactOnly && meshPoly && field) {
        const seedPoly = buildSurfaceSeedPoly(meshPoly, Math.floor(Number(streamlineCount) || 320), {
          rot: bodyRotation,
          offset: bodyOffset
        });
        const built = buildStreamlinesFromField(seedPoly);
        if (built?.poly) {
          streamPolyData = built.poly;
          streamScalarName = "velocity";
          maxSpeed = Math.max(maxSpeed, built.maxSpeed || maxSpeed);
          vtkNote = "Surface-seeded streamlines (contact only).";
        }
      }

      if (streamPolyData) {
        if (streamlineContactOnly && !meshBounds) {
          setVtkMessage("Contact-only filtering needs a mesh. Upload an STL/PLY in the CFD panel.");
        }
        const baseStream = streamPolyData;
          const mainStream = filterStreamlinesByContact(baseStream, meshBounds, contactMarginFactor, false, surfaceDistance);
          const tubeRadius = clamp(Number(streamlineRadius), 0.002, 0.12);
          const contextOpacityVal = clamp(Number(contextOpacity) || 0.22, 0.05, 0.8);
          const contextRadiusScaleVal = clamp(Number(contextRadiusScale) || 0.7, 0.2, 1);
          const ctf = vtkColorTransferFunction.newInstance();
          ctf.addRGBPoint(0, 0.12, 0.4, 0.85);
          ctf.addRGBPoint(maxSpeed * 0.3, 0.12, 0.85, 0.65);
          ctf.addRGBPoint(maxSpeed * 0.6, 0.95, 0.8, 0.2);
          ctf.addRGBPoint(maxSpeed || 1, 0.92, 0.22, 0.18);

        const addStreamActor = (polyData: any, radiusVal: number, opacityVal: number) => {
          const mapper = vtkMapper.newInstance();
          if (streamlineStyle === "tube") {
            const tubes = vtkTubeFilter.newInstance({ radius: radiusVal, numberOfSides: 12, capping: true });
            tubes.setInputData(polyData);
            mapper.setInputConnection(tubes.getOutputPort());
          } else {
            mapper.setInputData(polyData);
          }
          mapper.setScalarModeToUsePointFieldData();
          mapper.setColorByArrayName(streamScalarName);
          mapper.setLookupTable(ctf);
          mapper.setScalarRange(0, maxSpeed || 1);
          mapper.setScalarVisibility(true);
          const actor = vtkActor.newInstance();
          actor.setMapper(mapper);
          actor.getProperty().setOpacity(opacityVal);
          actor.setPosition(...offsetVec);
          renderer.addActor(actor);
        };

        if (showContextFlow && streamlineContactOnly) {
          addStreamActor(baseStream, tubeRadius * contextRadiusScaleVal, contextOpacityVal);
        }
        if (mainStream) {
          addStreamActor(mainStream, tubeRadius, clamp(Number(streamlineOpacity), 0.05, 1));
        }
        if (showBoundaryLayer && meshBounds) {
          const boundaryStream = filterStreamlinesByContact(
            baseStream,
            meshBounds,
            clamp(Number(boundaryLayerMargin) || 0.06, 0.02, 0.4),
            true,
            surfaceDistance
          );
          if (boundaryStream) {
            const boundaryRadius = clamp(Number(boundaryLayerRadius) || 0.006, 0.0015, 0.06);
            const boundaryOpacity = clamp(Number(streamlineOpacity) * 0.85 + 0.1, 0.2, 1);
            addStreamActor(boundaryStream, boundaryRadius, boundaryOpacity);
          }
        }
      }

      renderer.resetCamera();
      renderWindow.render();

      const handleResize = () => {
        const { width: w, height: h } = container.getBoundingClientRect();
        openGLRenderWindow.setSize(Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
        renderWindow.render();
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
      window.addEventListener("resize", handleResize);

      cleanup = () => {
        window.removeEventListener("resize", handleResize);
        resizeObserver.disconnect();
        renderer.removeAllActors();
        interactor.unbindEvents();
        interactor.delete();
        renderWindow.delete();
        openGLRenderWindow.delete();
        renderer.delete();
        container.innerHTML = "";
      };
      } catch (err) {
        console.error(err);
        setVtkMessage("VTK failed to initialize. Check the console and ensure vtk.js rendering profiles are available.");
      }
    };

    build();
    return () => {
      canceled = true;
      cleanup();
    };
  }, [
    renderMode,
    backendStatus,
    backendEngine,
    dataSource,
    flowDirectionPreset,
    flowYaw,
    flowPitch,
    flowRelativeToBody,
    angleOfAttack,
    bodyPitch,
    bodyRoll,
    streamlineCount,
    streamlineSteps,
    streamlineRadius,
    streamlineStyle,
    streamlineOpacity,
    streamlineContactOnly,
    streamlineContactMargin,
    showBoundaryLayer,
    boundaryLayerMargin,
    boundaryLayerRadius,
    showSurfacePressure,
    surfaceMode,
    surfaceBanding,
    surfaceBands,
    flowSpeed,
    radius,
    bodyShape,
    objectOffsetX,
    objectOffsetY,
    objectOffsetZ,
    backendUrl,
    meshMeta?.meshId,
    meshMeta?.filename
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (renderMode !== "three" || !container) {
      return;
    }

    const maxParticles = dataSource === "backend" ? 3200 : 9000;
    const count = clamp(Math.floor(Number(particleCount)), 200, maxParticles);
    const spreadVal = clamp(Number(spread), 0.6, 3.2);
    configRef.current.particleCount = count;
    configRef.current.spread = spreadVal;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f1ea);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(4, 2.2, 4.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.6;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 12;
    controls.target.set(0, 0, 0);
    controls.update();

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(3, 4, 2);
    scene.add(dir);

    const bodyGroup = new THREE.Group();
    bodyGroupRef.current = bodyGroup;
    scene.add(bodyGroup);

    const streamGroup = new THREE.Group();
    streamGroupRef.current = streamGroup;
    scene.add(streamGroup);

    const vortexGroup = new THREE.Group();
    vortexGroupRef.current = vortexGroup;
    scene.add(vortexGroup);

    const vorticityGroup = new THREE.Group();
    scene.add(vorticityGroup);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.35,
      vertexColors: true
    });

    const setBodyGeometry = () => {
      bodyGroup.clear();
      resetBvh();
      let baseRotation: [number, number, number] = [0, 0, 0];
      if (bodyShape === "custom" && importedObjectRef.current) {
        const custom = importedObjectRef.current.clone(true);
        applyStandardMaterial(custom);
        bodyGroup.add(custom);
        baseRadiusRef.current = importedBaseRadiusRef.current ?? 0.5;
        buildBvhForObject(bodyGroup);
        return;
      }

      if (bodyShape === "car") {
        const car = new THREE.Group();
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.55), bodyMaterial);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.4), bodyMaterial);
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 32), bodyMaterial);
        const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.5), bodyMaterial);
        cabin.position.set(-0.05, 0.18, 0);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(0.8, 0.02, 0);
        diffuser.position.set(-0.6, -0.08, 0);
        car.add(chassis, cabin, nose, diffuser);

        const wheelGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 20);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
        const wheelOffsets = [
          [0.5, -0.1, 0.25],
          [0.5, -0.1, -0.25],
          [-0.45, -0.1, 0.25],
          [-0.45, -0.1, -0.25]
        ];
        wheelOffsets.forEach(([x, y, z]) => {
          const wheel = new THREE.Mesh(wheelGeom, wheelMat);
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(x, y, z);
          car.add(wheel);
        });

        const wingAngleRad = (Number(wingAngle) * Math.PI) / 180;
        const spanVal = Math.max(0.3, Number(wingSpan));
        const chordVal = Math.max(0.1, Number(wingChord));
        if (rearWing) {
          const rearWingMesh = new THREE.Mesh(new THREE.BoxGeometry(chordVal, 0.04, spanVal), bodyMaterial);
          rearWingMesh.position.set(-0.75, 0.28, 0);
          rearWingMesh.rotation.z = -wingAngleRad;
          car.add(rearWingMesh);
        }
        if (frontWing) {
          const frontWingMesh = new THREE.Mesh(new THREE.BoxGeometry(chordVal * 0.8, 0.04, spanVal * 0.8), bodyMaterial);
          frontWingMesh.position.set(0.78, 0.08, 0);
          frontWingMesh.rotation.z = wingAngleRad * 0.6;
          car.add(frontWingMesh);
        }

        bodyGroup.add(car);
        const box = new THREE.Box3().setFromObject(car);
        const size = new THREE.Vector3();
        box.getSize(size);
        baseRadiusRef.current = Math.max(size.x, size.y, size.z) * 0.5 || 0.5;
        buildBvhForObject(bodyGroup);
        return;
      }

      let bodyGeometry: THREE.BufferGeometry;
      if (bodyShape === "capsule") {
        bodyGeometry = new THREE.CapsuleGeometry(0.22, 0.65, 8, 16);
        baseRotation = [0, 0, Math.PI / 2];
      } else if (bodyShape === "teardrop") {
        bodyGeometry = new THREE.ConeGeometry(0.3, 0.9, 32);
        baseRotation = [0, 0, Math.PI / 2];
      } else if (bodyShape === "box") {
        bodyGeometry = new THREE.BoxGeometry(0.8, 0.28, 0.28);
      } else if (bodyShape === "cylinder") {
        bodyGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.9, 28);
        baseRotation = [0, 0, Math.PI / 2];
      } else {
        bodyGeometry = new THREE.SphereGeometry(0.35, 32, 32);
      }
      bodyGeometry.computeBoundingSphere();
      baseRadiusRef.current = bodyGeometry.boundingSphere?.radius ?? 0.35;
      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.rotation.set(baseRotation[0], baseRotation[1], baseRotation[2]);
      bodyGroup.add(bodyMesh);
      if (bodyShape === "box") {
        buildBvhForObject(bodyGroup);
      }
    };

    setBodyGeometry();

    const trailGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(count * 3);
    const particleColors = new Float32Array(count * 3);
    const color = new THREE.Color(0x0ea5a5);
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      particlePositions[i3] = -4 + Math.random() * 0.6;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * spreadVal * 2;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * spreadVal * 2;
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
    }
    trailGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    trailGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const points = new THREE.Points(
      trailGeometry,
      new THREE.PointsMaterial({ size: 0.04, vertexColors: true, opacity: 0.75, transparent: true })
    );
    points.visible = showParticles;
    pointsRef.current = points;
    scene.add(points);

    const grid = new THREE.GridHelper(10, 20, 0xb6c3d1, 0xd5dee8);
    grid.position.y = -1.2;
    scene.add(grid);

    const noise3d = createNoise3D();
    let boundsX = 4.5;
    let boundsY = 2.6;
    let boundsZ = 2.6;
    const flowDir = new THREE.Vector3(1, 0, 0);
    const shapeFactor =
      (bodyShape === "teardrop" ? 0.7 : bodyShape === "box" ? 1.6 : bodyShape === "car" ? 1.8 : bodyShape === "cylinder" ? 1.25 : 1) +
      (rearWing || frontWing ? 0.15 : 0);
    const normalMatrix = new THREE.Matrix3();
    const tempNormal = new THREE.Vector3();
    const tempColor = new THREE.Color();
    const tempPos = new THREE.Vector3();
    const tempOffset = new THREE.Vector3();
    const tempOffset2 = new THREE.Vector3();
    const wakeTempPoint = new THREE.Vector3();
    const wakeTempClosest = new THREE.Vector3();
    const flowBasisMatrix = new THREE.Matrix4();
    const domainBox = new THREE.Box3();
    const domainSize = new THREE.Vector3();

    const sliceGroup = new THREE.Group();
    scene.add(sliceGroup);

    const glyphGroup = new THREE.Group();
    glyphGroupRef.current = glyphGroup;
    glyphGroup.visible = glyphConfigRef.current.show;
    scene.add(glyphGroup);

    const flowSheetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color("#38bdf8") },
        color2: { value: new THREE.Color("#f59e0b") },
        opacity: { value: flowSheetConfigRef.current.opacity }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          float stripe = sin((vUv.y * 12.0 + time * 2.0) * 6.2831853) * 0.5 + 0.5;
          float glow = smoothstep(0.1, 0.9, stripe);
          vec3 col = mix(color1, color2, glow);
          gl_FragColor = vec4(col, opacity * (0.35 + 0.45 * glow));
        }
      `
    });

    const flowSheet = new THREE.Mesh(new THREE.PlaneGeometry(boundsY * 2.2, boundsZ * 2.2, 1, 1), flowSheetMaterial);
    flowSheet.visible = flowSheetConfigRef.current.show;
    flowSheetRef.current = flowSheet;
    scene.add(flowSheet);

    const applyBodyTransform = (params: FlowConfig) => {
      const baseRadius = baseRadiusRef.current || 0.35;
      const scale = params.radius / baseRadius;
      bodyGroup.scale.setScalar(scale);
      bodyGroup.position.copy(objectOffsetRef.current);
      const aoa = (params.angleOfAttack * Math.PI) / 180;
      const pitch = (params.bodyPitch * Math.PI) / 180;
      const roll = (params.bodyRoll * Math.PI) / 180;
      bodyGroup.rotation.set(pitch, aoa, roll);
      bodyGroup.updateMatrixWorld(true);
      updateWakeFrame();
    };

    const updateWakeFrame = () => {
      const group = bodyGroupRef.current;
      if (!group) {
        wakeFrameRef.current = null;
        bodyBoundsRef.current = null;
        return;
      }
      group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(group);
      if (!Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) {
        wakeFrameRef.current = null;
        bodyBoundsRef.current = null;
        return;
      }
      bodyBoundsRef.current = box;
      const center = box.getCenter(new THREE.Vector3());
      const baseDir = flowDirectionRef.current;
      const flowSign = Math.sign(configRef.current.flowSpeed) || 1;
      const flowDir = new THREE.Vector3(baseDir.x * flowSign, baseDir.y * flowSign, baseDir.z * flowSign).normalize();
      const basis = flowBasisRef.current;
      const uAxis = new THREE.Vector3(basis.u.x, basis.u.y, basis.u.z).normalize();
      const vAxis = new THREE.Vector3(basis.v.x, basis.v.y, basis.v.z).normalize();
      const corners: THREE.Vector3[] = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.min.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z)
      ];
      let maxF = -Infinity;
      let maxU = 0;
      let maxV = 0;
      for (const corner of corners) {
        const rel = corner.clone().sub(center);
        const f = rel.dot(flowDir);
        maxF = Math.max(maxF, f);
        maxU = Math.max(maxU, Math.abs(rel.dot(uAxis)));
        maxV = Math.max(maxV, Math.abs(rel.dot(vAxis)));
      }
      wakeFrameRef.current = {
        center,
        flowDir,
        uAxis,
        vAxis,
        rearOffset: maxF,
        radiusU: Math.max(0.15, maxU),
        radiusV: Math.max(0.15, maxV)
      };
    };

    const getDomainBounds = (radiusVal: number) => {
      let span = Math.max(radiusVal * 2, 1.5);
      domainBox.setFromObject(bodyGroup);
      domainBox.getSize(domainSize);
      const rawSpan = Math.max(domainSize.x, domainSize.y, domainSize.z);
      if (Number.isFinite(rawSpan) && rawSpan > 0) {
        span = rawSpan;
      }
      const along = Math.max(boundsX, span * 2.6, radiusVal * 5);
      const crossU = Math.max(boundsY, span * 1.6, radiusVal * 3);
      const crossV = Math.max(boundsZ, span * 1.4, radiusVal * 2.6);
      return { along, crossU, crossV };
    };

    let raf = 0;
    let lastTime = performance.now();

    const sampleBackend = (x: number, y: number, z: number) => {
      const field = backendFieldRef.current;
      if (!field) {
        return null;
      }
      const { nx, ny, nz, origin, spacing, ux, uy, uz, p } = field;
      const fx = (x - origin[0]) / spacing;
      const fy = (y - origin[1]) / spacing;
      const fz = (z - origin[2]) / spacing;
      const i0 = Math.floor(fx);
      const j0 = Math.floor(fy);
      const k0 = Math.floor(fz);
      if (i0 < 0 || j0 < 0 || k0 < 0 || i0 >= nx - 1 || j0 >= ny - 1 || k0 >= nz - 1) {
        return null;
      }
      const tx = fx - i0;
      const ty = fy - j0;
      const tz = fz - k0;
      const idx = (i: number, j: number, k: number) => i + nx * (j + ny * k);
      const c000 = idx(i0, j0, k0);
      const c100 = idx(i0 + 1, j0, k0);
      const c010 = idx(i0, j0 + 1, k0);
      const c110 = idx(i0 + 1, j0 + 1, k0);
      const c001 = idx(i0, j0, k0 + 1);
      const c101 = idx(i0 + 1, j0, k0 + 1);
      const c011 = idx(i0, j0 + 1, k0 + 1);
      const c111 = idx(i0 + 1, j0 + 1, k0 + 1);

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const lerp3 = (arr: number[]) => {
        const v00 = lerp(arr[0], arr[1], tx);
        const v01 = lerp(arr[2], arr[3], tx);
        const v10 = lerp(arr[4], arr[5], tx);
        const v11 = lerp(arr[6], arr[7], tx);
        const v0 = lerp(v00, v01, ty);
        const v1 = lerp(v10, v11, ty);
        return lerp(v0, v1, tz);
      };

      const sampled = {
        vx: lerp3([ux[c000], ux[c100], ux[c010], ux[c110], ux[c001], ux[c101], ux[c011], ux[c111]]),
        vy: lerp3([uy[c000], uy[c100], uy[c010], uy[c110], uy[c001], uy[c101], uy[c011], uy[c111]]),
        vz: lerp3([uz[c000], uz[c100], uz[c010], uz[c110], uz[c001], uz[c101], uz[c011], uz[c111]])
      } as { vx: number; vy: number; vz: number; p?: number };
      if (p && p.length) {
        sampled.p = lerp3([p[c000], p[c100], p[c010], p[c110], p[c001], p[c101], p[c011], p[c111]]);
      }
      return sampled;
    };

    const computeFlow = (x: number, y: number, z: number, radiusVal: number, tNow: number) => {
      const params = configRef.current;
      const objX = objectOffsetRef.current.x;
      const objY = objectOffsetRef.current.y;
      const objZ = objectOffsetRef.current.z;
      const cx = x - objX;
      const cy = y - objY;
      const cz = z - objZ;
      const r2 = cx * cx + cy * cy + cz * cz + 1e-5;
      const r = Math.sqrt(r2);
      const rSafe = Math.max(r, radiusVal * 1.02);
      const n1 = cx / rSafe;
      const n2 = cy / rSafe;
      const n3 = cz / rSafe;
      const nuVal = Math.max(1e-8, params.kinematicViscosity || 1.5e-5);
      const re = Math.abs(params.flowSpeed) * (2 * radiusVal) / nuVal;
      const stBase = re > 47 ? 0.198 * (1 - 19.7 / Math.max(re, 60)) : 0;
      const st = clamp(stBase, 0.12, 0.28);
      const shedScale = clamp((re - 47) / 300, 0, 1) * shapeFactor;
      const vortexScale = clamp((re - 100) / 500, 0, 1) * shapeFactor;
      const baseDir = flowDirectionRef.current;
      const Ux = baseDir.x * params.flowSpeed;
      const Uy = baseDir.y * params.flowSpeed;
      const Uz = baseDir.z * params.flowSpeed;
      const uLen = Math.sqrt(Ux * Ux + Uy * Uy + Uz * Uz) || 1e-6;
      const flowDirX = uLen > 1e-6 ? Ux / uLen : baseDir.x;
      const flowDirY = uLen > 1e-6 ? Uy / uLen : baseDir.y;
      const flowDirZ = uLen > 1e-6 ? Uz / uLen : baseDir.z;
      const basis = flowBasisRef.current;
      const uAx = basis.u.x;
      const uAy = basis.u.y;
      const uAz = basis.u.z;
      const vAx = basis.v.x;
      const vAy = basis.v.y;
      const vAz = basis.v.z;

      let vx = 0;
      let vy = 0;
      let vz = 0;
      if (sourceRef.current === "backend") {
        const sampled = sampleBackend(x, y, z);
        if (sampled) {
          vx = sampled.vx;
          vy = sampled.vy;
          vz = sampled.vz;
        }
        const strictCfd = cfdOnly && backendFieldRef.current;
        if (strictCfd) {
          return { vx, vy, vz };
        }
      }
      const analyticFlow = sourceRef.current !== "backend" || (vx === 0 && vy === 0 && vz === 0);
      if (analyticFlow) {
        const dot = Ux * n1 + Uy * n2 + Uz * n3;
        const rSafe2 = rSafe * rSafe;
        const rSafe3 = rSafe2 * rSafe;
        const factor = (radiusVal * radiusVal * radiusVal) / (2 * rSafe3);
        vx = Ux + factor * (3 * dot * n1 - Ux);
        vy = Uy + factor * (3 * dot * n2 - Uy);
        vz = Uz + factor * (3 * dot * n3 - Uz);
        const swirl = params.vortexStrength * vortexScale * (radiusVal * radiusVal) / (r2 + radiusVal * radiusVal);
        const crossX = flowDirY * n3 - flowDirZ * n2;
        const crossY = flowDirZ * n1 - flowDirX * n3;
        const crossZ = flowDirX * n2 - flowDirY * n1;
        const crossLen = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) || 1;
        vx += swirl * (crossX / crossLen);
        vy += swirl * (crossY / crossLen);
        vz += swirl * (crossZ / crossLen);
      }

      let s = cx * flowDirX + cy * flowDirY + cz * flowDirZ;
      let uCoord = cx * uAx + cy * uAy + cz * uAz;
      let vCoord = cx * vAx + cy * vAy + cz * vAz;
      let wakeSigmaU = Math.max(radiusVal * 0.6, radiusVal * 0.8);
      let wakeSigmaV = Math.max(radiusVal * 0.55, radiusVal * 0.7);
      let wakeScale = 1;
      const wakeFrame = wakeFrameRef.current;
      let surfaceDist = Math.abs(r - radiusVal);
      if (analyticFlow) {
        wakeTempPoint.set(x, y, z);
        const bvhMeshes = bvhMeshesRef.current;
        if (bvhReadyRef.current && bvhMeshes.length) {
          let minDist = Infinity;
          for (const mesh of bvhMeshes) {
            const geom = mesh.geometry as THREE.BufferGeometry | undefined;
            const boundsTree = geom ? (geom as unknown as { boundsTree?: MeshBVH }).boundsTree : undefined;
            if (!boundsTree) {
              continue;
            }
            mesh.updateMatrixWorld(true);
            (boundsTree as any).closestPointToPoint(wakeTempPoint, mesh, wakeTempClosest);
            const d = wakeTempPoint.distanceTo(wakeTempClosest);
            if (d < minDist) {
              minDist = d;
            }
          }
          if (Number.isFinite(minDist)) {
            surfaceDist = minDist;
          }
        } else if (bodyBoundsRef.current) {
          surfaceDist = bodyBoundsRef.current.distanceToPoint(wakeTempPoint);
        }
      }
      if (wakeFrame) {
        const relWakeX = x - wakeFrame.center.x;
        const relWakeY = y - wakeFrame.center.y;
        const relWakeZ = z - wakeFrame.center.z;
        s = relWakeX * wakeFrame.flowDir.x + relWakeY * wakeFrame.flowDir.y + relWakeZ * wakeFrame.flowDir.z;
        uCoord = relWakeX * wakeFrame.uAxis.x + relWakeY * wakeFrame.uAxis.y + relWakeZ * wakeFrame.uAxis.z;
        vCoord = relWakeX * wakeFrame.vAxis.x + relWakeY * wakeFrame.vAxis.y + relWakeZ * wakeFrame.vAxis.z;
        wakeSigmaU = Math.max(radiusVal * 0.6, wakeFrame.radiusU * 0.85);
        wakeSigmaV = Math.max(radiusVal * 0.55, wakeFrame.radiusV * 0.85);
        const shape =
          Math.exp(
            -(
              (uCoord * uCoord) / (wakeSigmaU * wakeSigmaU) +
              (vCoord * vCoord) / (wakeSigmaV * wakeSigmaV)
            )
          ) || 0;
        const shadow = Math.exp(-surfaceDist / Math.max(0.12, radiusVal * 0.6));
        wakeScale = clamp(shape * (0.4 + 0.6 * shadow), 0, 1);
      }
      const wakeStart = wakeFrame
        ? wakeFrame.rearOffset + Math.max(radiusVal * 0.3, Math.min(wakeSigmaU, wakeSigmaV) * 0.25)
        : radiusVal * 0.9;
      const inWake = s > wakeStart;
      if (inWake && analyticFlow) {
        const wakeDist = s - wakeStart;
        const wakeDecay = Math.max(radiusVal * 5.0, 1.8);
        const wakeFade = Math.exp(-wakeDist / wakeDecay);
        const baseSpeed = Math.max(0.25, Math.abs(params.flowSpeed));
        const shedOmega = st * baseSpeed / Math.max(0.2, radiusVal) * Math.PI * 2;
        const lambda = Math.max(radiusVal * 1.8, (2 * radiusVal) / Math.max(st, 0.12));
        const waveNumber = (2 * Math.PI) / lambda;
        const shedPhase = shedOmega * tNow - s * waveNumber + vCoord * 0.35;
        const wakeStrengthScaled = params.wakeStrength * shedScale * wakeScale;
        const uPerturb = wakeStrengthScaled * 0.2 * Math.sin(shedPhase) * wakeFade;
        const vPerturb = wakeStrengthScaled * 0.26 * Math.sin(shedPhase + Math.PI / 2) * wakeFade;
        vx *= 1 - 0.2 * wakeStrengthScaled * wakeFade;
        vx += uPerturb * uAx + vPerturb * vAx;
        vy += uPerturb * uAy + vPerturb * vAy;
        vz += uPerturb * uAz + vPerturb * vAz;
        const vortexOffset = Math.max(radiusVal * 0.55, (wakeSigmaV + wakeSigmaU) * 0.32);
        const vortexCore = Math.max(0.025, Math.min(wakeSigmaU, wakeSigmaV) * 0.3);
        const gammaBase =
          params.vortexStrength * vortexScale * wakeScale * Math.max(0.35, baseSpeed) * radiusVal * 2.1;
        const phase = Math.sin(shedPhase);
        const sign = phase === 0 ? 1 : Math.sign(phase);
        const applyVortex = (u0: number, v0: number, sgn: number) => {
          const du = uCoord - u0;
          const dv = vCoord - v0;
          const r2v = du * du + dv * dv;
          const core2 = vortexCore * vortexCore;
          const coeff = (sgn * gammaBase * wakeFade) / (2 * Math.PI) * (1 - Math.exp(-r2v / core2)) / (r2v + core2);
          const duVel = -coeff * dv;
          const dvVel = coeff * du;
          vx += duVel * uAx + dvVel * vAx;
          vy += duVel * uAy + dvVel * vAy;
          vz += duVel * uAz + dvVel * vAz;
        };
        applyVortex(vortexOffset, 0, sign);
        applyVortex(-vortexOffset, 0, -sign);
      }

      if (params.turbulence > 0 && analyticFlow) {
        const model = params.turbulenceModel ?? "noise";
        let amp = params.turbulence;
        if (model === "smagorinsky" || model === "sst") {
          const shear = Math.abs(params.flowSpeed) / Math.max(0.4, r);
          let nuT = 0;
          if (model === "smagorinsky") {
            const cs = 0.16;
            const delta = Math.max(0.05, radiusVal * 0.3);
            nuT = (cs * delta) * (cs * delta) * shear;
          } else {
            const a1 = 0.31;
            const intensity = clamp(params.turbulence, 0, 1);
            const k = 1.5 * (intensity * Math.abs(params.flowSpeed)) ** 2;
            const omega = Math.sqrt(k) / Math.max(0.05, 0.09 * radiusVal);
            nuT = (a1 * k) / Math.max(a1 * omega, shear);
          }
          const turbScale = clamp(nuT / Math.max(nuVal, 1e-6), 0, 4);
          amp *= 0.35 + turbScale * 0.25;
        }
        const nVal = noise3d(x * 0.6, y * 0.6, z * 0.6);
        const nVal2 = noise3d(x * 0.4 + 20, y * 0.4, z * 0.4);
        vx += nVal * amp * 0.45;
        vy += nVal2 * amp * 0.35;
        vz += nVal * amp * 0.35;
      }
      if (analyticFlow) {
        const delta = Math.max(radiusVal * 0.08, 0.02);
        const slip = 1 - Math.exp(-Math.min(8, (surfaceDist / delta) ** 2));
        const slipFactor = clamp(0.02 + 0.98 * slip, 0.02, 1);
        vx *= slipFactor;
        vy *= slipFactor;
        vz *= slipFactor;
      }
      return { vx, vy, vz };
    };

    const clearSlice = () => {
      sliceGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            (child.material as THREE.Material).dispose();
          }
        }
      });
      sliceGroup.clear();
      sliceRef.current = null;
      sliceMeshesRef.current = [];
    };

    const buildSlicePlane = () => {
      clearSlice();
      const config = sliceConfigRef.current;
      const stackCount = config.stack ?? 0;
      if (!config.show || stackCount <= 0) {
        return;
      }
      const segments = Math.max(8, Math.min(90, config.resolution));
      const makeMesh = (width: number, height: number) => {
        const geom = new THREE.PlaneGeometry(width, height, segments, segments);
        const mesh = new THREE.Mesh(
          geom,
          new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: config.opacity,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        const colors = new Float32Array(geom.getAttribute("position").count * 3);
        geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        return mesh;
      };

      const count = stackCount;
      const spacing = config.spacing ?? 0.4;
      for (let idx = 0; idx < count; idx += 1) {
        const offset = (idx - (count - 1) / 2) * spacing;
        if (config.axis === "x") {
          const mesh = makeMesh(boundsZ * 2, boundsY * 2);
          mesh.rotation.y = Math.PI / 2;
          mesh.position.x = clamp(config.position + offset, -boundsX, boundsX);
          sliceGroup.add(mesh);
          sliceMeshesRef.current.push(mesh);
        } else if (config.axis === "y") {
          const mesh = makeMesh(boundsX * 2, boundsZ * 2);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.y = clamp(config.position + offset, -boundsY, boundsY);
          sliceGroup.add(mesh);
          sliceMeshesRef.current.push(mesh);
        } else {
          const mesh = makeMesh(boundsX * 2, boundsY * 2);
          mesh.position.z = clamp(config.position + offset, -boundsZ, boundsZ);
          sliceGroup.add(mesh);
          sliceMeshesRef.current.push(mesh);
        }
      }

      sliceRef.current = sliceMeshesRef.current[0] ?? null;
    };

    const updateSlicePlane = (tNow: number) => {
      const meshes = sliceMeshesRef.current;
      if (!meshes.length || !sliceConfigRef.current.show) {
        return;
      }
      const config = sliceConfigRef.current;
      const params = configRef.current;
      const speedRef = Math.max(0.3, Math.abs(params.flowSpeed) + params.turbulence * 0.7 + params.wakeStrength * 0.6);
      const vortRef = Math.max(0.4, (Math.abs(params.flowSpeed) / Math.max(0.2, params.radius)) * 1.4);
      const flowSign = Math.sign(params.flowSpeed) || 1;
      const field = backendFieldRef.current;
      const usePressureField = sourceRef.current === "backend" && field?.p && field.p.length;
      let pMin = usePressureField ? field?.pMin ?? 0 : 0;
      let pMax = usePressureField ? field?.pMax ?? 1 : 1;
      if (usePressureField && field && (!Number.isFinite(pMin) || !Number.isFinite(pMax) || pMin === pMax)) {
        let minVal = Infinity;
        let maxVal = -Infinity;
        field.p?.forEach((val) => {
          if (Number.isFinite(val)) {
            minVal = Math.min(minVal, val);
            maxVal = Math.max(maxVal, val);
          }
        });
        if (Number.isFinite(minVal) && Number.isFinite(maxVal) && minVal !== maxVal) {
          pMin = minVal;
          pMax = maxVal;
          field.pMin = minVal;
          field.pMax = maxVal;
        }
      }

      const eps = 0.08;
      meshes.forEach((mesh) => {
        if (!mesh.visible) {
          return;
        }
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = config.opacity;
        const geom = mesh.geometry as THREE.BufferGeometry;
        const positions = geom.getAttribute("position") as THREE.BufferAttribute;
        const colors = geom.getAttribute("color") as THREE.BufferAttribute;
        mesh.updateMatrixWorld(true);
        for (let i = 0; i < positions.count; i += 1) {
          tempPos.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
          const flow = computeFlow(tempPos.x, tempPos.y, tempPos.z, params.radius, tNow);
          const speed = Math.sqrt(flow.vx * flow.vx + flow.vy * flow.vy + flow.vz * flow.vz);
          let tCol = 0;
          if (config.mode === "speed") {
            tCol = clamp(speed / speedRef, 0, 1);
          } else if (config.mode === "wake") {
            const wakeRegion = flowSign > 0 ? tempPos.x > 0 : tempPos.x < 0;
            const wakeBoost = wakeRegion ? 1 : 0.6;
            tCol = clamp((1 - speed / speedRef) * wakeBoost, 0, 1);
          } else if (config.mode === "pressure") {
            if (usePressureField) {
              const sample = sampleBackend(tempPos.x, tempPos.y, tempPos.z);
              if (sample && Number.isFinite(sample.p)) {
                const denom = (pMax ?? 1) - (pMin ?? 0) || 1;
                tCol = clamp(((sample.p ?? 0) - (pMin ?? 0)) / denom, 0, 1);
              } else {
                tCol = clamp(speed / speedRef, 0, 1);
              }
            } else {
              const U = Math.max(0.1, Math.abs(params.flowSpeed));
              const cp = 1 - (speed / U) ** 2;
              tCol = clamp((cp + 1) * 0.5, 0, 1);
            }
          } else if (config.mode === "qcriterion") {
            const fxp = computeFlow(tempPos.x + eps, tempPos.y, tempPos.z, params.radius, tNow);
            const fxm = computeFlow(tempPos.x - eps, tempPos.y, tempPos.z, params.radius, tNow);
            const fyp = computeFlow(tempPos.x, tempPos.y + eps, tempPos.z, params.radius, tNow);
            const fym = computeFlow(tempPos.x, tempPos.y - eps, tempPos.z, params.radius, tNow);
            const fzp = computeFlow(tempPos.x, tempPos.y, tempPos.z + eps, params.radius, tNow);
            const fzm = computeFlow(tempPos.x, tempPos.y, tempPos.z - eps, params.radius, tNow);
            const dVxDx = (fxp.vx - fxm.vx) / (2 * eps);
            const dVyDy = (fyp.vy - fym.vy) / (2 * eps);
            const dVzDz = (fzp.vz - fzm.vz) / (2 * eps);
            const dVyDz = (fzp.vy - fzm.vy) / (2 * eps);
            const dVzDy = (fyp.vz - fym.vz) / (2 * eps);
            const dVxDz = (fzp.vx - fzm.vx) / (2 * eps);
            const dVzDx = (fxp.vz - fxm.vz) / (2 * eps);
            const dVyDx = (fxp.vy - fxm.vy) / (2 * eps);
            const dVxDy = (fyp.vx - fym.vx) / (2 * eps);
            const omegaX = dVzDy - dVyDz;
            const omegaY = dVxDz - dVzDx;
            const omegaZ = dVyDx - dVxDy;
            const omegaMag2 = omegaX * omegaX + omegaY * omegaY + omegaZ * omegaZ;
            const sxx = dVxDx;
            const syy = dVyDy;
            const szz = dVzDz;
            const sxy = 0.5 * (dVxDy + dVyDx);
            const sxz = 0.5 * (dVxDz + dVzDx);
            const syz = 0.5 * (dVyDz + dVzDy);
            const sNorm2 = sxx * sxx + syy * syy + szz * szz + 2 * (sxy * sxy + sxz * sxz + syz * syz);
            const qVal = 0.5 * (0.5 * omegaMag2 - sNorm2);
            const qRef = Math.max(0.05, speedRef * speedRef);
            tCol = clamp(0.5 + 0.5 * Math.tanh(qVal / qRef), 0, 1);
          } else {
            const fxp = computeFlow(tempPos.x + eps, tempPos.y, tempPos.z, params.radius, tNow);
            const fxm = computeFlow(tempPos.x - eps, tempPos.y, tempPos.z, params.radius, tNow);
            const fyp = computeFlow(tempPos.x, tempPos.y + eps, tempPos.z, params.radius, tNow);
            const fym = computeFlow(tempPos.x, tempPos.y - eps, tempPos.z, params.radius, tNow);
            const fzp = computeFlow(tempPos.x, tempPos.y, tempPos.z + eps, params.radius, tNow);
            const fzm = computeFlow(tempPos.x, tempPos.y, tempPos.z - eps, params.radius, tNow);
            const dVyDz = (fzp.vy - fzm.vy) / (2 * eps);
            const dVzDy = (fyp.vz - fym.vz) / (2 * eps);
            const dVxDz = (fzp.vx - fzm.vx) / (2 * eps);
            const dVzDx = (fxp.vz - fxm.vz) / (2 * eps);
            const dVyDx = (fxp.vy - fxm.vy) / (2 * eps);
            const dVxDy = (fyp.vx - fym.vx) / (2 * eps);
            const curlX = dVzDy - dVyDz;
            const curlY = dVxDz - dVzDx;
            const curlZ = dVyDx - dVxDy;
            const vort = Math.sqrt(curlX * curlX + curlY * curlY + curlZ * curlZ);
            tCol = clamp(vort / vortRef, 0, 1);
          }
          const [rCol, gCol, bCol] = sampleColorMap(tCol, colorMapRef.current);
          colors.setXYZ(i, rCol, gCol, bCol);
        }
        colors.needsUpdate = true;
      });
    };

    rebuildSliceRef.current = buildSlicePlane;
    buildSlicePlane();

    let glyphs: { arrow: THREE.ArrowHelper; position: THREE.Vector3 }[] = [];

    const clearGlyphs = () => {
      glyphGroup.children.forEach((child) => {
        child.traverse((node) => {
          if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
            node.geometry.dispose();
            const material = node.material as THREE.Material | THREE.Material[];
            if (Array.isArray(material)) {
              material.forEach((mat) => mat.dispose());
            } else {
              material.dispose();
            }
          }
        });
      });
      glyphGroup.clear();
      glyphs = [];
    };

    const buildGlyphs = () => {
      clearGlyphs();
      const config = glyphConfigRef.current;
      if (!config.show) {
        return;
      }
      const n = Math.max(3, Math.min(12, config.density));
      const posList: THREE.Vector3[] = [];
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          for (let k = 0; k < n; k += 1) {
            const x = -boundsX + (2 * boundsX * i) / (n - 1);
            const y = -boundsY + (2 * boundsY * j) / (n - 1);
            const z = -boundsZ + (2 * boundsZ * k) / (n - 1);
            posList.push(new THREE.Vector3(x, y, z));
          }
        }
      }
      posList.forEach((pos) => {
        const flow = computeFlow(pos.x, pos.y, pos.z, configRef.current.radius, 0);
        const speed = Math.sqrt(flow.vx * flow.vx + flow.vy * flow.vy + flow.vz * flow.vz);
        const dir = new THREE.Vector3(flow.vx, flow.vy, flow.vz).normalize();
        const length = speed * config.scale;
        const arrow = new THREE.ArrowHelper(dir, pos, length, 0x60a5fa, 0.06, 0.04);
        glyphGroup.add(arrow);
        glyphs.push({ arrow, position: pos });
      });
    };

    const updateGlyphs = (tNow: number) => {
      const config = glyphConfigRef.current;
      if (!config.show) {
        return;
      }
      const speedRef = Math.max(0.3, Math.abs(configRef.current.flowSpeed) + configRef.current.turbulence * 0.7);
      glyphs.forEach(({ arrow, position }) => {
        const flow = computeFlow(position.x, position.y, position.z, configRef.current.radius, tNow);
        const speed = Math.sqrt(flow.vx * flow.vx + flow.vy * flow.vy + flow.vz * flow.vz);
        const dir = new THREE.Vector3(flow.vx, flow.vy, flow.vz).normalize();
        const tCol = clamp(speed / speedRef, 0, 1);
        const [rCol, gCol, bCol] = sampleColorMap(tCol, colorMapRef.current);
        arrow.setDirection(dir);
        arrow.setLength(speed * config.scale, 0.06, 0.04);
        arrow.setColor(new THREE.Color(rCol, gCol, bCol));
      });
    };

    rebuildGlyphsRef.current = buildGlyphs;
    buildGlyphs();

    const clearStreamlines = () => {
      streamGroup.children.forEach((child) => {
        if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            (child.material as THREE.Material).dispose();
          }
        }
      });
      streamGroup.clear();
    };

    const clearVortices = () => {
      vortexGroup.children.forEach((child) => {
        if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            (child.material as THREE.Material).dispose();
          }
        }
      });
      vortexGroup.clear();
    };

    const clearVorticityField = () => {
      if (!vorticityFieldRef.current) {
        return;
      }
      const points = vorticityFieldRef.current;
      if (points.geometry) {
        points.geometry.dispose();
      }
      if (Array.isArray(points.material)) {
        points.material.forEach((mat) => mat.dispose());
      } else {
        (points.material as THREE.Material).dispose();
      }
      vorticityGroup.remove(points);
      vorticityFieldRef.current = null;
    };

    const buildVorticityField = () => {
      clearVorticityField();
      const config = vorticityConfigRef.current;
      if (!config.show) {
        return;
      }
      const params = configRef.current;
      const densityVal = clamp(Math.floor(config.density), 4, 22);
      const domain = getDomainBounds(params.radius);
      const baseDir = flowDirectionRef.current;
      const flowSign = Math.sign(params.flowSpeed) || 1;
      const flowDir = new THREE.Vector3(
        baseDir.x * flowSign,
        baseDir.y * flowSign,
        baseDir.z * flowSign
      ).normalize();
      const basis = flowBasisRef.current;
      const uAxis = basis.u.clone().normalize();
      const vAxis = basis.v.clone().normalize();
      const wakeFrame = wakeFrameRef.current;
      const wakeStart =
        (wakeFrame ? wakeFrame.rearOffset : params.radius * 0.8) +
        Math.max(params.radius * 0.25, (wakeFrame ? Math.min(wakeFrame.radiusU, wakeFrame.radiusV) : params.radius) * 0.25);
      const length = domain.along * 0.85;
      const crossU = domain.crossU * 0.9;
      const crossV = domain.crossV * 0.9;
      const total = densityVal * densityVal * densityVal;
      const positions = new Float32Array(total * 3);
      const vort = new Float32Array(total);
      const hel = new Float32Array(total);
      let idx = 0;
      for (let i = 0; i < densityVal; i += 1) {
        const tAlong = densityVal === 1 ? 0.5 : i / (densityVal - 1);
        const alongDist = wakeStart + tAlong * length;
        for (let j = 0; j < densityVal; j += 1) {
          const tU = densityVal === 1 ? 0.5 : j / (densityVal - 1);
          const uVal = lerp(-crossU, crossU, tU);
          for (let k = 0; k < densityVal; k += 1) {
            const tV = densityVal === 1 ? 0.5 : k / (densityVal - 1);
            const vVal = lerp(-crossV, crossV, tV);
            const base = new THREE.Vector3()
              .copy(objectOffsetRef.current)
              .addScaledVector(flowDir, alongDist)
              .addScaledVector(uAxis, uVal)
              .addScaledVector(vAxis, vVal);
            positions[idx * 3] = base.x;
            positions[idx * 3 + 1] = base.y;
            positions[idx * 3 + 2] = base.z;
            vort[idx] = 0;
            hel[idx] = 0;
            idx += 1;
          }
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("vort", new THREE.BufferAttribute(vort, 1));
      geometry.setAttribute("hel", new THREE.BufferAttribute(hel, 1));
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          vortMax: { value: 1 },
          helMax: { value: 1 },
          opacity: { value: config.opacity }
        },
        vertexShader: `
          attribute float vort;
          attribute float hel;
          uniform float vortMax;
          uniform float helMax;
          varying float vVort;
          varying float vHel;
          void main() {
            vVort = vort / max(vortMax, 1e-6);
            vHel = hel / max(helMax, 1e-6);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = mix(2.0, 6.5, clamp(vVort, 0.0, 1.0));
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vVort;
          varying float vHel;
          uniform float opacity;
          vec3 ramp(float t) {
            vec3 c1 = vec3(0.1, 0.3, 0.9);
            vec3 c2 = vec3(0.2, 0.8, 0.6);
            vec3 c3 = vec3(0.95, 0.8, 0.2);
            vec3 c4 = vec3(0.9, 0.2, 0.15);
            float a = smoothstep(0.0, 0.35, t);
            float b = smoothstep(0.35, 0.7, t);
            float c = smoothstep(0.7, 1.0, t);
            vec3 col = mix(c1, c2, a);
            col = mix(col, c3, b);
            col = mix(col, c4, c);
            return col;
          }
          vec3 coolRamp(float t) {
            vec3 a = vec3(0.08, 0.25, 0.85);
            vec3 b = vec3(0.15, 0.6, 0.9);
            vec3 c = vec3(0.2, 0.85, 0.7);
            float u = smoothstep(0.0, 0.6, t);
            float v = smoothstep(0.6, 1.0, t);
            vec3 col = mix(a, b, u);
            col = mix(col, c, v);
            return col;
          }
          vec3 warmRamp(float t) {
            vec3 a = vec3(0.6, 0.15, 0.1);
            vec3 b = vec3(0.9, 0.35, 0.15);
            vec3 c = vec3(0.95, 0.8, 0.2);
            float u = smoothstep(0.0, 0.6, t);
            float v = smoothstep(0.6, 1.0, t);
            vec3 col = mix(a, b, u);
            col = mix(col, c, v);
            return col;
          }
          void main() {
            float t = clamp(vVort, 0.0, 1.0);
            float r = length(gl_PointCoord - vec2(0.5));
            float mask = smoothstep(0.5, 0.15, r);
            float helN = clamp(vHel, -1.0, 1.0);
            float mixVal = 0.5 + 0.5 * helN;
            vec3 cool = coolRamp(t);
            vec3 warm = warmRamp(t);
            vec3 col = mix(cool, warm, mixVal);
            gl_FragColor = vec4(col, opacity * mask * (0.2 + 0.8 * t));
          }
        `
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      points.visible = config.show;
      vorticityGroup.add(points);
      vorticityFieldRef.current = points;
    };

    const updateVorticityField = (tNow: number) => {
      const points = vorticityFieldRef.current;
      if (!points || !vorticityConfigRef.current.show) {
        return;
      }
      const nowMs = performance.now();
      if (nowMs - lastVortUpdateRef.current < 80) {
        return;
      }
      lastVortUpdateRef.current = nowMs;
      const geometry = points.geometry as THREE.BufferGeometry;
      const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
      const vortAttr = geometry.getAttribute("vort") as THREE.BufferAttribute;
      const helAttr = geometry.getAttribute("hel") as THREE.BufferAttribute;
      const params = configRef.current;
      const eps = Math.max(params.radius * 0.06, 0.03);
      const nuVal = Math.max(1e-8, params.kinematicViscosity || 1.5e-5);
      const re = Math.abs(params.flowSpeed) * (2 * params.radius) / nuVal;
      const reScale = clamp(Math.sqrt(re / 200), 0.6, 2.0);
      const turbScale = 1 + 0.6 * clamp(params.turbulence, 0, 2);
      let maxVort = 0.001;
      let maxHel = 0.001;
      for (let i = 0; i < positions.count; i += 1) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const fxp = computeFlow(x + eps, y, z, params.radius, tNow);
        const fxm = computeFlow(x - eps, y, z, params.radius, tNow);
        const fyp = computeFlow(x, y + eps, z, params.radius, tNow);
        const fym = computeFlow(x, y - eps, z, params.radius, tNow);
        const fzp = computeFlow(x, y, z + eps, params.radius, tNow);
        const fzm = computeFlow(x, y, z - eps, params.radius, tNow);
        const dVyDz = (fzp.vy - fzm.vy) / (2 * eps);
        const dVzDy = (fyp.vz - fym.vz) / (2 * eps);
        const dVxDz = (fzp.vx - fzm.vx) / (2 * eps);
        const dVzDx = (fxp.vz - fxm.vz) / (2 * eps);
        const dVyDx = (fxp.vy - fxm.vy) / (2 * eps);
        const dVxDy = (fyp.vx - fym.vx) / (2 * eps);
        const curlX = dVzDy - dVyDz;
        const curlY = dVxDz - dVzDx;
        const curlZ = dVyDx - dVxDy;
        const vort = Math.sqrt(curlX * curlX + curlY * curlY + curlZ * curlZ);
        const vel = computeFlow(x, y, z, params.radius, tNow);
        const helicity = vel.vx * curlX + vel.vy * curlY + vel.vz * curlZ;
        const vortScaled = vort * reScale * turbScale;
        const helScaled = helicity * reScale * turbScale;
        const prevV = vortAttr.getX(i);
        const prevH = helAttr.getX(i);
        const blend = 0.28;
        const newV = prevV * (1 - blend) + vortScaled * blend;
        const newH = prevH * (1 - blend) + helScaled * blend;
        vortAttr.setX(i, newV);
        helAttr.setX(i, newH);
        if (newV > maxVort) {
          maxVort = newV;
        }
        const absHel = Math.abs(newH);
        if (absHel > maxHel) {
          maxHel = absHel;
        }
      }
      vortAttr.needsUpdate = true;
      helAttr.needsUpdate = true;
      const material = points.material as THREE.ShaderMaterial;
      material.uniforms.vortMax.value = maxVort;
      material.uniforms.helMax.value = maxHel;
      material.uniforms.opacity.value = vorticityConfigRef.current.opacity;
    };

    const buildStreamlines = () => {
      clearStreamlines();
      const params = configRef.current;
      const settings = streamlineRef.current;
      if (!settings.show) {
        return;
      }
      applyBodyTransform(params);
      const count = clamp(Math.floor(Number.isFinite(settings.count) ? settings.count : 220), 40, 600);
      const stepsCount = clamp(Math.floor(Number.isFinite(settings.steps) ? settings.steps : 140), 40, 300);
      const stepSize = clamp(Number.isFinite(settings.step) ? settings.step : 0.08, 0.02, 0.2);
      const jitter = clamp(Number.isFinite(settings.jitter) ? settings.jitter : 0.12, 0, 0.6);
      const opacity = clamp(Number.isFinite(settings.opacity) ? settings.opacity : 0.7, 0.1, 1);
      const spreadVal = params.spread;
      const radiusVal = params.radius;
      const domain = getDomainBounds(radiusVal);
      const domainAlong = domain.along;
      const domainU = domain.crossU;
      const domainV = domain.crossV;
      const contactOnly = Boolean(settings.contactOnly);
      const contactMarginFactor = clamp(Number.isFinite(settings.contactMargin) ? settings.contactMargin : 0.18, 0.01, 0.6);
      const baseRadius = baseRadiusRef.current || radiusVal;
      if (bodyGroupRef.current) {
        bodyGroupRef.current.updateMatrixWorld(true);
      }
      const bodyBounds = bodyGroupRef.current ? new THREE.Box3().setFromObject(bodyGroupRef.current) : null;
      const useBoundsContact = bodyShape === "custom" || bodyShape === "car" || bodyShape === "box";
      const useBvhContact = bvhReadyRef.current && (bodyShape === "custom" || bodyShape === "car" || bodyShape === "box");
      const boundsSize = bodyBounds ? bodyBounds.getSize(new THREE.Vector3()) : null;
      const boundsSpan = boundsSize ? Math.max(boundsSize.x, boundsSize.y, boundsSize.z) * 0.95 : baseRadius * 1.4;
      const contactSpan = contactOnly ? (useBoundsContact ? boundsSpan : Math.max(baseRadius * 1.4, radiusVal * 1.2)) : spreadVal;
      const contactSurfaceTol = Math.max(0.05, baseRadius * contactMarginFactor);
      const boundaryEnabled = showBoundaryLayer;
      const boundaryMarginFactor = clamp(Number(boundaryLayerMargin) || 0.06, 0.02, 0.4);
      const boundarySurfaceTol = Math.max(0.02, baseRadius * boundaryMarginFactor);
      const boundaryRadiusVal = clamp(Number(boundaryLayerRadius) || 0.006, 0.0015, 0.06);
      const contextEnabled = showContextFlow && contactOnly;
      const contextOpacityVal = clamp(Number(contextOpacity) || 0.22, 0.05, 0.8);
      const contextRadiusScaleVal = clamp(Number(contextRadiusScale) || 0.7, 0.2, 1);
      const objOffset = objectOffsetRef.current;
      const baseDir = flowDirectionRef.current;
      const flowSign = Math.sign(params.flowSpeed) || 1;
      const flowDir = new THREE.Vector3(baseDir.x * flowSign, baseDir.y * flowSign, baseDir.z * flowSign).normalize();
      const basis = flowBasisRef.current;
      const uAxis = basis.u;
      const vAxis = basis.v;
      const tmpVec = new THREE.Vector3();
      const tmpPoint = new THREE.Vector3();
      const tmpClosest = new THREE.Vector3();
      const bvhMeshes = bvhMeshesRef.current;
      const contactDistance = (x: number, y: number, z: number) => {
        if (useBvhContact && bvhMeshes.length) {
          tmpPoint.set(x, y, z);
          let minDist = Infinity;
          for (const mesh of bvhMeshes) {
            const geom = mesh.geometry as THREE.BufferGeometry | undefined;
            const boundsTree = geom ? (geom as unknown as { boundsTree?: MeshBVH }).boundsTree : undefined;
            if (!boundsTree) {
              continue;
            }
            mesh.updateMatrixWorld(true);
            (boundsTree as any).closestPointToPoint(tmpPoint, mesh, tmpClosest);
            const dist = tmpPoint.distanceTo(tmpClosest);
            if (dist < minDist) {
              minDist = dist;
              if (minDist <= 0.001) {
                break;
              }
            }
          }
          if (Number.isFinite(minDist)) {
            return minDist;
          }
        }
        if (useBoundsContact && bodyBounds) {
          return bodyBounds.distanceToPoint(tmpVec.set(x, y, z));
        }
        const dx = x - objOffset.x;
        const dy = y - objOffset.y;
        const dz = z - objOffset.z;
        return Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - baseRadius);
      };
      const speedScale = Math.max(
        0.35,
        Math.abs(params.flowSpeed) * 1.6 + params.turbulence * 0.6 + params.wakeStrength * 0.8
      );
      const rk4Step = (x0: number, y0: number, z0: number) => {
        const k1 = computeFlow(x0, y0, z0, radiusVal, 0);
        const k2 = computeFlow(
          x0 + k1.vx * stepSize * 0.5,
          y0 + k1.vy * stepSize * 0.5,
          z0 + k1.vz * stepSize * 0.5,
          radiusVal,
          0
        );
        const k3 = computeFlow(
          x0 + k2.vx * stepSize * 0.5,
          y0 + k2.vy * stepSize * 0.5,
          z0 + k2.vz * stepSize * 0.5,
          radiusVal,
          0
        );
        const k4 = computeFlow(
          x0 + k3.vx * stepSize,
          y0 + k3.vy * stepSize,
          z0 + k3.vz * stepSize,
          radiusVal,
          0
        );
        const vx = (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx) / 6;
        const vy = (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy) / 6;
        const vz = (k1.vz + 2 * k2.vz + 2 * k3.vz + k4.vz) / 6;
        return { x: x0 + vx * stepSize, y: y0 + vy * stepSize, z: z0 + vz * stepSize, vx, vy, vz };
      };
      const seeds: THREE.Vector3[] = [];
      const spawnCenter = new THREE.Vector3(
        objOffset.x - flowDir.x * domainAlong,
        objOffset.y - flowDir.y * domainAlong,
        objOffset.z - flowDir.z * domainAlong
      );
      const pushSeed = (seed: THREE.Vector3) => {
        if (seeds.length < count) {
          seeds.push(seed);
        }
      };
      const gridTarget = Math.max(8, Math.floor(count * (contactOnly ? 0.35 : 0.55)));
      const wakeTarget = Math.max(8, Math.floor(count * 0.35));
      const surfaceTarget = Math.max(0, count - gridTarget - wakeTarget);
      const grid = Math.ceil(Math.sqrt(gridTarget));
      for (let i = 0; i < grid; i += 1) {
        for (let j = 0; j < grid; j += 1) {
          if (seeds.length >= gridTarget) {
            break;
          }
          const y =
            lerp(-contactSpan, contactSpan, grid === 1 ? 0.5 : i / (grid - 1)) + (Math.random() - 0.5) * jitter;
          const z =
            lerp(-contactSpan, contactSpan, grid === 1 ? 0.5 : j / (grid - 1)) + (Math.random() - 0.5) * jitter;
          const depth = Math.random() * 0.4;
          const seed = new THREE.Vector3(
            spawnCenter.x + uAxis.x * y + vAxis.x * z + flowDir.x * depth,
            spawnCenter.y + uAxis.y * y + vAxis.y * z + flowDir.y * depth,
            spawnCenter.z + uAxis.z * y + vAxis.z * z + flowDir.z * depth
          );
          pushSeed(seed);
        }
      }
      const wakeFrame = wakeFrameRef.current;
      const wakeStart =
        (wakeFrame ? wakeFrame.rearOffset : radiusVal * 0.8) +
        Math.max(radiusVal * 0.25, (wakeFrame ? Math.min(wakeFrame.radiusU, wakeFrame.radiusV) : radiusVal) * 0.25);
      const wakeLength = domainAlong * 0.9;
      for (let i = 0; i < wakeTarget && seeds.length < gridTarget + wakeTarget; i += 1) {
        const along = wakeStart + Math.random() * wakeLength;
        const shrink = 1 - 0.35 * (along / Math.max(0.1, wakeLength));
        const u = (Math.random() * 2 - 1) * contactSpan * 0.9 * shrink;
        const v = (Math.random() * 2 - 1) * contactSpan * 0.7 * shrink;
        const seed = new THREE.Vector3()
          .copy(objOffset)
          .addScaledVector(flowDir, along)
          .addScaledVector(uAxis, u)
          .addScaledVector(vAxis, v);
        pushSeed(seed);
      }
      let attempts = 0;
      while (attempts < surfaceTarget * 6 && seeds.length < count) {
        attempts += 1;
        const angle = Math.random() * Math.PI * 2;
        const radial = lerp(radiusVal * 0.9, contactSpan * 0.7, Math.random());
        const u = Math.cos(angle) * radial + (Math.random() - 0.5) * jitter;
        const v = Math.sin(angle) * radial + (Math.random() - 0.5) * jitter;
        const along = -radiusVal * 1.1 + Math.random() * radiusVal * 0.6;
        const seed = new THREE.Vector3()
          .copy(objOffset)
          .addScaledVector(flowDir, along)
          .addScaledVector(uAxis, u)
          .addScaledVector(vAxis, v);
        if (contactDistance(seed.x, seed.y, seed.z) <= contactSurfaceTol * 1.6) {
          pushSeed(seed);
        }
      }
      while (seeds.length < count) {
        const u = (Math.random() * 2 - 1) * contactSpan;
        const v = (Math.random() * 2 - 1) * contactSpan;
        const depth = Math.random() * 0.6;
        const seed = new THREE.Vector3(
          spawnCenter.x + uAxis.x * u + vAxis.x * v + flowDir.x * depth,
          spawnCenter.y + uAxis.y * u + vAxis.y * v + flowDir.y * depth,
          spawnCenter.z + uAxis.z * u + vAxis.z * v + flowDir.z * depth
        );
        pushSeed(seed);
      }

      seeds.forEach((seed) => {
        const positions: number[] = [];
        const colors: number[] = [];
        let x = seed.x;
        let y = seed.y;
        let z = seed.z;
        let minSurface = Infinity;
        for (let s = 0; s < stepsCount; s += 1) {
          const step = rk4Step(x, y, z);
          const speed = Math.sqrt(step.vx * step.vx + step.vy * step.vy + step.vz * step.vz);
          positions.push(x, y, z);
          const [rCol, gCol, bCol] = sampleColorMap(clamp(speed / speedScale, 0, 1), colorMapRef.current);
          colors.push(rCol, gCol, bCol);
          minSurface = Math.min(minSurface, contactDistance(x, y, z));
          x = step.x;
          y = step.y;
          z = step.z;
          const dx = x - objOffset.x;
          const dy = y - objOffset.y;
          const dz = z - objOffset.z;
          const r2 = dx * dx + dy * dy + dz * dz;
          if (r2 < radiusVal * radiusVal) {
            const r = Math.sqrt(r2) || 1e-6;
            const nx = dx / r;
            const ny = dy / r;
            const nz = dz / r;
            const push = radiusVal * 1.02;
            x = objOffset.x + nx * push;
            y = objOffset.y + ny * push;
            z = objOffset.z + nz * push;
          }
          const relX = x - objOffset.x;
          const relY = y - objOffset.y;
          const relZ = z - objOffset.z;
          const s = relX * flowDir.x + relY * flowDir.y + relZ * flowDir.z;
          const uCoord = relX * uAxis.x + relY * uAxis.y + relZ * uAxis.z;
          const vCoord = relX * vAxis.x + relY * vAxis.y + relZ * vAxis.z;
          if (s > domainAlong || s < -domainAlong || Math.abs(uCoord) > domainU || Math.abs(vCoord) > domainV) {
            break;
          }
        }
        if (positions.length < 6) {
          return;
        }
        if (contactOnly && minSurface > contactSurfaceTol) {
          return;
        }
        const extractSegments = (tol: number | null) => {
          if (!tol) {
            return [{ positions, colors }];
          }
          const segments: { positions: number[]; colors: number[] }[] = [];
          let segPos: number[] = [];
          let segCol: number[] = [];
          for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            const dist = contactDistance(x, y, z);
            if (dist <= tol) {
              segPos.push(x, y, z);
              segCol.push(colors[i], colors[i + 1], colors[i + 2]);
            } else if (segPos.length >= 6) {
              segments.push({ positions: segPos, colors: segCol });
              segPos = [];
              segCol = [];
            } else {
              segPos = [];
              segCol = [];
            }
          }
          if (segPos.length >= 6) {
            segments.push({ positions: segPos, colors: segCol });
          }
          return segments;
        };

        const segments = contactOnly ? [{ positions, colors }] : extractSegments(null);
        const fullSegments = contextEnabled ? extractSegments(null) : [];
        const boundaryTol = boundaryEnabled ? (contactOnly ? Math.min(boundarySurfaceTol, contactSurfaceTol) : boundarySurfaceTol) : null;
        const boundarySegments = boundaryTol ? extractSegments(boundaryTol) : [];

        const renderSegment = (segment: { positions: number[]; colors: number[] }, radiusOverride?: number, opacityOverride?: number) => {
          const pointsVec: THREE.Vector3[] = [];
          for (let i = 0; i < segment.positions.length; i += 3) {
            pointsVec.push(new THREE.Vector3(segment.positions[i], segment.positions[i + 1], segment.positions[i + 2]));
          }
          if (pointsVec.length < 2) {
            return;
          }
          if (settings.style === "tube") {
            const curve = new THREE.CatmullRomCurve3(pointsVec);
            const tubeGeom = new THREE.TubeGeometry(
              curve,
              Math.max(8, pointsVec.length * 2),
              radiusOverride ?? settings.radius,
              6,
              false
            );
            const posAttr = tubeGeom.getAttribute("position") as THREE.BufferAttribute;
            const colorAttr = new THREE.BufferAttribute(new Float32Array(posAttr.count * 3), 3);
            const sampleCount = segment.positions.length / 3;
            for (let i = 0; i < posAttr.count; i += 1) {
              const tCol = clamp(i / Math.max(1, posAttr.count - 1), 0, 1);
              const idx = Math.floor(tCol * (sampleCount - 1));
              const baseIndex = idx * 3;
              colorAttr.setXYZ(
                i,
                segment.colors[baseIndex],
                segment.colors[baseIndex + 1],
                segment.colors[baseIndex + 2]
              );
            }
            tubeGeom.setAttribute("color", colorAttr);
            const tubeMat = new THREE.MeshStandardMaterial({
              vertexColors: true,
              transparent: true,
              opacity: opacityOverride ?? opacity,
              roughness: 0.45,
              metalness: 0.1
            });
            const tube = new THREE.Mesh(tubeGeom, tubeMat);
            streamGroup.add(tube);
          } else {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute("position", new THREE.Float32BufferAttribute(segment.positions, 3));
            geometry.setAttribute("color", new THREE.Float32BufferAttribute(segment.colors, 3));
            const material = new THREE.LineBasicMaterial({
              vertexColors: true,
              transparent: true,
              opacity: opacityOverride ?? opacity
            });
            const line = new THREE.Line(geometry, material);
            streamGroup.add(line);
          }
        };

        if (contextEnabled) {
          const contextRadius = settings.radius * contextRadiusScaleVal;
          fullSegments.forEach((segment) => renderSegment(segment, contextRadius, contextOpacityVal));
        }
        segments.forEach((segment) => renderSegment(segment));
        if (boundaryEnabled && boundarySegments.length) {
          const boundaryOpacity = clamp(opacity * 0.85 + 0.1, 0.2, 1);
          boundarySegments.forEach((segment) => renderSegment(segment, boundaryRadiusVal, boundaryOpacity));
        }
      });
    };

    const buildVortexCores = () => {
      clearVortices();
      if (!vortexRef.current) {
        return;
      }
      const params = configRef.current;
      const radiusVal = params.radius;
      const domain = getDomainBounds(radiusVal);
      const length = domain.along * 1.2;
      const baseDir = flowDirectionRef.current;
      const flowSign = Math.sign(params.flowSpeed) || 1;
      const flowDir = new THREE.Vector3(baseDir.x * flowSign, baseDir.y * flowSign, baseDir.z * flowSign).normalize();
      const basis = flowBasisRef.current;
      const uAxis = basis.u.clone();
      const vAxis = basis.v.clone();
      const coreRadius = Math.max(0.05, radiusVal * 0.25);
      const wakeFrame = wakeFrameRef.current;
      const baseOffset = wakeFrame ? wakeFrame.rearOffset + Math.max(radiusVal * 0.25, wakeFrame.radiusU * 0.12) : radiusVal * 0.7;
      const base = new THREE.Vector3()
        .copy(objectOffsetRef.current)
        .addScaledVector(flowDir, baseOffset);
      const offsetScale = wakeFrame ? Math.max(radiusVal * 0.35, wakeFrame.radiusV * 0.35) : radiusVal * 0.35;
      const offsets = [-offsetScale, offsetScale];
      offsets.forEach((offset, idx) => {
        const pointsVec: THREE.Vector3[] = [];
        const segments = 120;
        for (let i = 0; i <= segments; i += 1) {
          const t = i / segments;
          const angle = t * Math.PI * 6 + idx * Math.PI * 0.6;
          const along = flowDir.clone().multiplyScalar(t * length);
          const swirlU = uAxis.clone().multiplyScalar(Math.cos(angle) * coreRadius * 0.6);
          const swirlV = vAxis.clone().multiplyScalar(offset + Math.sin(angle) * coreRadius);
          pointsVec.push(new THREE.Vector3().copy(base).add(along).add(swirlU).add(swirlV));
        }
        const curve = new THREE.CatmullRomCurve3(pointsVec);
        const tubeGeom = new THREE.TubeGeometry(curve, 120, Math.max(0.01, coreRadius * 0.2), 6, false);
        const material = new THREE.MeshStandardMaterial({
          color: 0x2563eb,
          transparent: true,
          opacity: 0.45,
          roughness: 0.4
        });
        const tube = new THREE.Mesh(tubeGeom, material);
        vortexGroup.add(tube);
      });
    };

    const rebuildAll = () => {
      buildStreamlines();
      buildVortexCores();
    };
    rebuildStreamlinesRef.current = rebuildAll;
    rebuildAll();

    const updateParticles = (dt: number, objX: number, objZ: number, radiusVal: number, tNow: number) => {
      const positions = trailGeometry.getAttribute("position") as THREE.BufferAttribute;
      const array = positions.array as Float32Array;
      const colors = trailGeometry.getAttribute("color") as THREE.BufferAttribute;
      const colorArray = colors.array as Float32Array;
      const params = configRef.current;
      const speedScale = Math.max(
        0.35,
        Math.abs(params.flowSpeed) * 1.6 + params.turbulence * 0.6 + params.wakeStrength * 0.8
      );
      const baseR = 0.06;
      const baseG = 0.65;
      const baseB = 0.65;
      const nuVal = Math.max(1e-8, params.kinematicViscosity || 1.5e-5);
      const re = Math.abs(params.flowSpeed) * (2 * radiusVal) / nuVal;
      const stBase = re > 47 ? 0.198 * (1 - 19.7 / Math.max(re, 60)) : 0;
      const st = clamp(stBase, 0.12, 0.28);
      const shedOmega = st * Math.max(0.2, Math.abs(params.flowSpeed)) / Math.max(0.2, radiusVal) * Math.PI * 2;
      const objOffset = objectOffsetRef.current;
      const baseDir = flowDirectionRef.current;
      const flowSign = Math.sign(params.flowSpeed) || 1;
      const flowDir = new THREE.Vector3(baseDir.x * flowSign, baseDir.y * flowSign, baseDir.z * flowSign).normalize();
      const basis = flowBasisRef.current;
      const uAxis = basis.u;
      const vAxis = basis.v;
      const domain = getDomainBounds(radiusVal);
      const spawnCenter = new THREE.Vector3(
        objOffset.x - flowDir.x * domain.along,
        objOffset.y - flowDir.y * domain.along,
        objOffset.z - flowDir.z * domain.along
      );

      for (let i = 0; i < params.particleCount; i += 1) {
        const i3 = i * 3;
        let x = array[i3];
        let y = array[i3 + 1];
        let z = array[i3 + 2];

        const sampleVelocity = (px: number, py: number, pz: number, timeNow: number) => {
          const flow = computeFlow(px, py, pz, radiusVal, timeNow);
          let vx = flow.vx;
          let vy = flow.vy;
          let vz = flow.vz;
          const relX = px - objOffset.x;
          const relY = py - objOffset.y;
          const relZ = pz - objOffset.z;
          if (params.wakeStrength > 0) {
            const s = relX * flowDir.x + relY * flowDir.y + relZ * flowDir.z;
            const inWake = s > radiusVal * 0.6;
            if (inWake) {
              const wakeDist = s - radiusVal;
              const wakeFade = Math.exp(-wakeDist * 0.55);
              const shedPhase = shedOmega * timeNow + (relX * uAxis.x + relY * uAxis.y + relZ * uAxis.z) * 2.2;
              const uPerturb = params.wakeStrength * 0.25 * Math.sin(shedPhase) * wakeFade;
              const vPerturb = params.wakeStrength * 0.18 * Math.cos(shedPhase + (relX * vAxis.x + relY * vAxis.y + relZ * vAxis.z)) * wakeFade;
              vx *= 1 - 0.25 * params.wakeStrength * wakeFade;
              vx += uPerturb * uAxis.x + vPerturb * vAxis.x;
              vy += uPerturb * uAxis.y + vPerturb * vAxis.y;
              vz += uPerturb * uAxis.z + vPerturb * vAxis.z;
            }
          }

          if (params.turbulence > 0) {
            const model = params.turbulenceModel ?? "noise";
            let amp = params.turbulence;
            if (model === "smagorinsky" || model === "sst") {
              const rVal = Math.sqrt(relX * relX + relY * relY + relZ * relZ) || 1;
              const shear = Math.abs(params.flowSpeed) / Math.max(0.4, rVal);
              let nuT = 0;
              if (model === "smagorinsky") {
                const cs = 0.16;
                const delta = Math.max(0.05, radiusVal * 0.3);
                nuT = (cs * delta) * (cs * delta) * shear;
              } else {
                const a1 = 0.31;
                const intensity = clamp(params.turbulence, 0, 1);
                const k = 1.5 * (intensity * Math.abs(params.flowSpeed)) ** 2;
                const omega = Math.sqrt(k) / Math.max(0.05, 0.09 * radiusVal);
                nuT = (a1 * k) / Math.max(a1 * omega, shear);
              }
              const turbScale = clamp(nuT / Math.max(nuVal, 1e-6), 0, 4);
              amp *= 0.35 + turbScale * 0.25;
            }
            const nVal = noise3d(px * 0.6, py * 0.6, pz * 0.6);
            const nVal2 = noise3d(px * 0.4 + 20, py * 0.4, pz * 0.4);
            vx += nVal * amp * 0.45;
            vy += nVal2 * amp * 0.35;
            vz += nVal * amp * 0.35;
          }
          return { vx, vy, vz };
        };

        const k1 = sampleVelocity(x, y, z, tNow);
        const k2 = sampleVelocity(x + k1.vx * dt * 0.5, y + k1.vy * dt * 0.5, z + k1.vz * dt * 0.5, tNow + dt * 0.5);
        const k3 = sampleVelocity(x + k2.vx * dt * 0.5, y + k2.vy * dt * 0.5, z + k2.vz * dt * 0.5, tNow + dt * 0.5);
        const k4 = sampleVelocity(x + k3.vx * dt, y + k3.vy * dt, z + k3.vz * dt, tNow + dt);

        const vx = (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx) / 6;
        const vy = (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy) / 6;
        const vz = (k1.vz + 2 * k2.vz + 2 * k3.vz + k4.vz) / 6;

        x += vx * dt;
        y += vy * dt;
        z += vz * dt;

        const dx = x - objX;
        const dy = y - objOffset.y;
        const dz = z - objZ;
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        if (r < radiusVal * 0.9) {
          const nx = dx / r;
          const ny = dy / r;
          const nz = dz / r;
          x = objX + nx * (radiusVal * 1.02);
          y = objOffset.y + ny * (radiusVal * 1.02);
          z = objZ + nz * (radiusVal * 1.02);
        }

        const relX2 = x - objOffset.x;
        const relY2 = y - objOffset.y;
        const relZ2 = z - objOffset.z;
        const s = relX2 * flowDir.x + relY2 * flowDir.y + relZ2 * flowDir.z;
        const uCoord = relX2 * uAxis.x + relY2 * uAxis.y + relZ2 * uAxis.z;
        const vCoord = relX2 * vAxis.x + relY2 * vAxis.y + relZ2 * vAxis.z;
        if (s > domain.along || s < -domain.along || Math.abs(uCoord) > domain.crossU || Math.abs(vCoord) > domain.crossV) {
          const spreadU = (Math.random() - 0.5) * params.spread * 2;
          const spreadV = (Math.random() - 0.5) * params.spread * 2;
          const depth = Math.random() * 0.4;
          x = spawnCenter.x + uAxis.x * spreadU + vAxis.x * spreadV + flowDir.x * depth;
          y = spawnCenter.y + uAxis.y * spreadU + vAxis.y * spreadV + flowDir.y * depth;
          z = spawnCenter.z + uAxis.z * spreadU + vAxis.z * spreadV + flowDir.z * depth;
        }

        array[i3] = x;
        array[i3 + 1] = y;
        array[i3 + 2] = z;

        if (colorizeRef.current) {
          const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
          const tCol = clamp(speed / speedScale, 0, 1);
          const [rCol, gCol, bCol] = sampleColorMap(tCol, colorMapRef.current);
          colorArray[i3] = rCol;
          colorArray[i3 + 1] = gCol;
          colorArray[i3 + 2] = bCol;
        } else {
          colorArray[i3] = baseR;
          colorArray[i3 + 1] = baseG;
          colorArray[i3 + 2] = baseB;
        }
      }
      positions.needsUpdate = true;
      colors.needsUpdate = true;
    };

    const applySurfaceHeatmap = (speedScale: number) => {
      const group = bodyGroupRef.current;
      if (!group) {
        return;
      }
      const params = configRef.current;
      const surfaceConfig = surfaceConfigRef.current;
      if (!surfaceRef.current) {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.vertexColors = false;
            mat.color.set(0xffffff);
            mat.needsUpdate = true;
          }
        });
        return;
      }
      const dir = flowDir.clone().normalize();
      const field = backendFieldRef.current;
      const usePressure = sourceRef.current === "backend" && field?.p && field.p.length;
      let pMin = usePressure ? field?.pMin ?? 0 : 0;
      let pMax = usePressure ? field?.pMax ?? 1 : 1;
      if (usePressure && field && (!Number.isFinite(pMin) || !Number.isFinite(pMax) || pMin === pMax)) {
        let minVal = Infinity;
        let maxVal = -Infinity;
        field.p?.forEach((val) => {
          if (Number.isFinite(val)) {
            minVal = Math.min(minVal, val);
            maxVal = Math.max(maxVal, val);
          }
        });
        if (Number.isFinite(minVal) && Number.isFinite(maxVal) && minVal !== maxVal) {
          pMin = minVal;
          pMax = maxVal;
          field.pMin = minVal;
          field.pMax = maxVal;
        }
      }
      group.updateMatrixWorld(true);
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) {
          return;
        }
        const geom = child.geometry as THREE.BufferGeometry;
        const normals = geom.getAttribute("normal") as THREE.BufferAttribute | null;
        const positions = geom.getAttribute("position") as THREE.BufferAttribute;
        if (!normals) {
          geom.computeVertexNormals();
        }
        const normalAttr = (geom.getAttribute("normal") as THREE.BufferAttribute) ?? normals;
        let colors = geom.getAttribute("color") as THREE.BufferAttribute | null;
        if (!colors) {
          colors = new THREE.BufferAttribute(new Float32Array(positions.count * 3), 3);
          geom.setAttribute("color", colors);
        }
        normalMatrix.getNormalMatrix(child.matrixWorld);
        for (let i = 0; i < positions.count; i += 1) {
          tempNormal.fromBufferAttribute(normalAttr, i).applyMatrix3(normalMatrix).normalize();
          const normalTerm = clamp(-tempNormal.dot(dir), 0, 1);
          tempPos.fromBufferAttribute(positions, i).applyMatrix4(child.matrixWorld);
          let speedSample = 0;
          if (sourceRef.current === "backend") {
            const sample = sampleBackend(tempPos.x, tempPos.y, tempPos.z);
            if (sample) {
              speedSample = Math.sqrt(sample.vx * sample.vx + sample.vy * sample.vy + sample.vz * sample.vz);
            }
          } else {
            const local = computeFlow(tempPos.x, tempPos.y, tempPos.z, params.radius, 0);
            speedSample = Math.sqrt(local.vx * local.vx + local.vy * local.vy + local.vz * local.vz);
          }
          const speedNorm = clamp(speedSample / Math.max(0.2, Math.abs(params.flowSpeed) + params.turbulence * 0.8), 0, 1);
          let tCol = normalTerm;
          if (surfaceConfig.mode === "pressure" && usePressure) {
            const sample = sampleBackend(tempPos.x, tempPos.y, tempPos.z);
            if (sample && Number.isFinite(sample.p)) {
              const denom = (pMax ?? 1) - (pMin ?? 0) || 1;
              tCol = clamp(((sample.p ?? 0) - (pMin ?? 0)) / denom, 0, 1);
            }
          } else if (surfaceConfig.mode === "speed") {
            tCol = speedNorm;
          } else if (surfaceConfig.mode === "cp") {
            const U = Math.max(0.1, Math.abs(params.flowSpeed));
            const cp = 1 - (speedSample / U) ** 2;
            tCol = clamp((cp + 1) * 0.5, 0, 1);
          } else if (surfaceConfig.mode === "separation") {
            const U = Math.max(0.1, Math.abs(params.flowSpeed));
            const ds = Math.max(0.04, params.radius * 0.1);
            const upPos = tempOffset.copy(tempPos).addScaledVector(dir, -ds);
            const dnPos = tempOffset2.copy(tempPos).addScaledVector(dir, ds);
            const upFlow = sourceRef.current === "backend" ? sampleBackend(upPos.x, upPos.y, upPos.z) : computeFlow(upPos.x, upPos.y, upPos.z, params.radius, 0);
            const dnFlow = sourceRef.current === "backend" ? sampleBackend(dnPos.x, dnPos.y, dnPos.z) : computeFlow(dnPos.x, dnPos.y, dnPos.z, params.radius, 0);
            const upSpeed = upFlow ? Math.sqrt(upFlow.vx * upFlow.vx + upFlow.vy * upFlow.vy + upFlow.vz * upFlow.vz) : speedSample;
            const dnSpeed = dnFlow ? Math.sqrt(dnFlow.vx * dnFlow.vx + dnFlow.vy * dnFlow.vy + dnFlow.vz * dnFlow.vz) : speedSample;
            const cpUp = 1 - (upSpeed / U) ** 2;
            const cpDn = 1 - (dnSpeed / U) ** 2;
            const dCp = cpDn - cpUp;
            tCol = clamp(0.5 + dCp * 1.2, 0, 1);
          } else if (surfaceConfig.mode === "pressure") {
            const U = Math.max(0.1, Math.abs(params.flowSpeed));
            const cp = 1 - (speedSample / U) ** 2;
            tCol = clamp(0.7 * ((cp + 1) * 0.5) + 0.3 * normalTerm, 0, 1);
          }
          const speedRef = Math.max(0.25, Math.abs(params.flowSpeed) + params.turbulence * 0.8);
          const speedHeatNorm = clamp(speedSample / speedRef, 0, 1);
          const speedHeat = clamp(Math.pow(speedHeatNorm, 0.6) * 1.05, 0, 1);
          const speedBias = surfaceConfig.mode === "speed" ? 0.85 : 0.45;
          tCol = clamp(tCol * (1 - speedBias) + speedHeat * speedBias, 0, 1);
          tCol = clamp(tCol * 0.85 + normalTerm * 0.15, 0, 1);
          if (surfaceConfig.banding) {
            const bands = surfaceConfig.bands;
            const quant = Math.round(tCol * (bands - 1)) / (bands - 1);
            tCol = clamp(quant, 0, 1);
          }
          const tDetail = clamp(Math.pow(tCol, 0.7) * 1.05, 0, 1);
          const [rCol, gCol, bCol] = sampleColorMap(tDetail, "thermal");
          colors.setXYZ(i, rCol, gCol, bCol);
        }
        colors.needsUpdate = true;
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.vertexColors = true;
        mat.needsUpdate = true;
        tempColor.setRGB(1, 1, 1);
      });
    };

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      const params = configRef.current;
      const t = now * 0.001;
      const objX = objectOffsetRef.current.x;
      const objZ = objectOffsetRef.current.z;
      applyBodyTransform(params);
      const baseDir = flowDirectionRef.current;
      const Ux = baseDir.x * params.flowSpeed;
      const Uy = baseDir.y * params.flowSpeed;
      const Uz = baseDir.z * params.flowSpeed;
      const uLen = Math.sqrt(Ux * Ux + Uy * Uy + Uz * Uz) || 1e-6;
      flowDir.set(uLen > 1e-6 ? Ux / uLen : baseDir.x, uLen > 1e-6 ? Uy / uLen : baseDir.y, uLen > 1e-6 ? Uz / uLen : baseDir.z);
      const speedScale = clamp(Math.abs(params.flowSpeed) / 6, 0, 1);
      applySurfaceHeatmap(speedScale);
      updateSlicePlane(t);
      updateGlyphs(t);
      const domain = getDomainBounds(params.radius);
      if (flowSheetRef.current) {
        const mat = flowSheetRef.current.material as THREE.ShaderMaterial;
        mat.uniforms.time.value = t;
        mat.uniforms.opacity.value = flowSheetConfigRef.current.opacity;
        const basis = flowBasisRef.current;
        flowBasisMatrix.makeBasis(basis.u, basis.v, flowDir);
        flowSheetRef.current.setRotationFromMatrix(flowBasisMatrix);
        flowSheetRef.current.position.copy(objectOffsetRef.current).addScaledVector(flowDir, -domain.along + 0.2);
        flowSheetRef.current.scale.set(
          Math.max(0.6, domain.crossU / boundsY),
          Math.max(0.6, domain.crossV / boundsZ),
          1
        );
        flowSheetRef.current.visible = flowSheetConfigRef.current.show;
      }
      if (playingRef.current) {
        updateParticles(dt, objX, objZ, params.radius, t);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
      controls.dispose();
      renderer.dispose();
      trailGeometry.dispose();
      bodyGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            (child.material as THREE.Material).dispose();
          }
        }
      });
      clearStreamlines();
      clearVortices();
      clearVorticityField();
      clearSlice();
      clearGlyphs();
      rebuildStreamlinesRef.current = null;
      rebuildVorticityFieldRef.current = null;
      rebuildSliceRef.current = null;
      rebuildGlyphsRef.current = null;
      if (flowSheetRef.current) {
        flowSheetRef.current.geometry.dispose();
        (flowSheetRef.current.material as THREE.Material).dispose();
        flowSheetRef.current = null;
      }
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [
    particleCount,
    spread,
    bodyShape,
    importedLabel,
    rearWing,
    frontWing,
    wingAngle,
    wingSpan,
    wingChord,
    renderMode
  ]);

  const flowVal = Number(flowSpeed);
  const radiusVal = Number(radius);
  const nuVal = Number(viscosity);
  const densityVal = Number(density);
  const cdVal = Number(dragCoefficient);
  const areaVal = Number(referenceArea);
  const relSpeed = Number.isFinite(flowVal) ? Math.abs(flowVal) : NaN;
  const dragForce =
    Number.isFinite(relSpeed) && Number.isFinite(densityVal) && Number.isFinite(cdVal) && Number.isFinite(areaVal)
      ? 0.5 * densityVal * cdVal * areaVal * relSpeed * relSpeed
      : NaN;
  const dynamicPressure =
    Number.isFinite(relSpeed) && Number.isFinite(densityVal) ? 0.5 * densityVal * relSpeed * relSpeed : NaN;
  const reynolds =
    Number.isFinite(flowVal) && Number.isFinite(radiusVal) && Number.isFinite(nuVal) && nuVal !== 0
      ? (Math.abs(flowVal) * 2 * radiusVal) / nuVal
      : NaN;
  const openfoamReady = backendMeta?.openfoam === "ready";
  const fluidx3dReady = backendMeta?.fluidx3d === "ready";
  let pipelineLabel = "preview";
  if (dataSource !== "backend") {
    pipelineLabel = "analytic preview";
  } else if (backendEngine === "openfoam") {
    pipelineLabel = openfoamReady ? "OpenFOAM ready" : runStatus === "running" ? "OpenFOAM running" : "OpenFOAM pending";
  } else if (backendEngine === "fluidx3d") {
    pipelineLabel = openfoamReady ? "OpenFOAM ready (finalizing)" : fluidx3dReady ? "FluidX3D ready" : "FluidX3D preview";
  }
  const artifactPath =
    dataSource !== "backend"
      ? ""
      : backendEngine === "openfoam"
        ? backendMeta?.openfoamPath || backendMeta?.openfoamPressurePath || caseInfo?.zipPath || meshMeta?.sampleDictPath || ""
        : backendEngine === "fluidx3d"
          ? backendMeta?.fluidx3dPath || exportPath
          : exportPath;
  const artifactSize =
    dataSource !== "backend"
      ? undefined
      : backendEngine === "openfoam"
        ? backendMeta?.openfoamSize
        : backendEngine === "fluidx3d"
          ? backendMeta?.fluidx3dSize
          : undefined;
  const artifactTime =
    dataSource !== "backend"
      ? undefined
      : backendEngine === "openfoam"
        ? backendMeta?.openfoamMtime
        : backendEngine === "fluidx3d"
          ? backendMeta?.fluidx3dMtime
          : undefined;
  const modeEvidenceLabel =
    dataSource !== "backend"
      ? "Analytic preview"
      : backendEngine === "openfoam"
        ? openfoamReady
          ? "OpenFOAM artifact-backed"
          : runStatus === "running"
            ? "OpenFOAM runtime in progress"
            : "OpenFOAM staging"
        : backendEngine === "fluidx3d"
          ? fluidx3dReady
            ? "FluidX3D field-backed"
            : "FluidX3D preview"
          : backendStatus === "ready"
            ? "LBM proxy ready"
            : "LBM proxy preview";
  const canProve =
    dataSource !== "backend"
      ? [
          "Flow direction, body orientation, and wake intuition.",
          "Whether your setup choices are visually sensible before you spend solver time."
        ]
      : backendEngine === "openfoam"
        ? [
            "Field-backed streamline and pressure evidence once the exported artifacts are fresh.",
            "A stronger validation lane for release review or solver handoff."
          ]
        : backendEngine === "fluidx3d"
          ? [
              "Imported velocity-field behavior, streamtube structure, and artifact freshness.",
              "Whether the external FluidX3D field is recent enough to trust for visual review."
            ]
          : [
              "Fast backend-backed wake checks before you commit to heavier export workflows.",
              "A quick readiness pass for local CFD plumbing."
            ];
  const cannotProve =
    dataSource !== "backend"
      ? [
          "Mesh-specific pressure validation.",
          "Artifact-grade evidence without promoting into a backend-backed lane."
        ]
      : backendEngine === "openfoam"
        ? [
            "Solver correctness without reviewing the generated files and mesh context.",
            "Final confidence if timestamps or exported evidence are stale."
          ]
        : backendEngine === "fluidx3d"
          ? [
              "Any claim beyond the imported field itself if the uploaded artifact is stale or incomplete.",
              "OpenFOAM-style case fidelity without a solver-backed case review."
            ]
          : [
              "Final artifact confidence without exporting evidence.",
              "OpenFOAM- or FluidX3D-grade validation detail."
            ];
  const recommendedEscalation =
    dataSource !== "backend"
      ? "Start here to tune the geometry and incoming flow, then switch to a backend lane before treating the result as validated."
      : backendEngine === "openfoam"
        ? "Review the exported field paths and timestamps, then inspect CSV or case artifacts before calling the run trusted."
        : backendEngine === "fluidx3d"
          ? "Keep the uploaded field fresh, then compare it with external solver expectations or promote into an OpenFOAM case if you need stronger provenance."
          : "Use the proxy for quick readiness, then escalate into OpenFOAM or FluidX3D when the question needs inspectable artifacts.";
  const evidenceChips = [
    `mode: ${modeEvidenceLabel}`,
    `refresh: ${autoRefresh ? `auto every ${autoRefreshInterval}s` : "manual"}`,
    artifactPath ? `artifact: ${artifactPath.split("/").pop()}` : "artifact: pending"
  ];

  return (
    <div className="demo-panel">
      <div className="demo-title">3D Airflow + Drag Hotspots (GPU)</div>
      <div className="demo-grid demo-grid-wide">
        <label className="field">
          <span>render engine</span>
          <select value={renderMode} onChange={(event) => setRenderMode(event.target.value as "three" | "vtk")}>
            <option value="three">Three.js (preview)</option>
            <option value="vtk">VTK Streamtubes (CFD)</option>
          </select>
        </label>
        <label className="field">
          <span>CFD-only realism</span>
          <select value={cfdOnly ? "on" : "off"} onChange={(event) => setCfdOnly(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
          <span className="field-hint">
            Turn this off to allow analytic previews when the CFD backend is not configured.
          </span>
        </label>
        <label className="field">
          <span>object speed (m/s)</span>
          <input type="number" value={flowSpeed} onChange={(event) => setFlowSpeed(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>flow direction</span>
          <select
            value={flowDirectionPreset}
            onChange={(event) => setFlowDirectionPreset(event.target.value as FlowDirectionPreset)}
          >
            <option value="x+">+X (left to right)</option>
            <option value="x-">-X (right to left)</option>
            <option value="y+">+Y (bottom to top)</option>
            <option value="y-">-Y (top to bottom)</option>
            <option value="z+">+Z (toward camera)</option>
            <option value="z-">-Z (away from camera)</option>
            <option value="custom">Custom yaw/pitch</option>
          </select>
          <span className="field-hint">Controls where the air travels toward relative to the object.</span>
        </label>
        <label className="field">
          <span>flow frame</span>
          <select
            value={flowRelativeToBody ? "body" : "world"}
            onChange={(event) => setFlowRelativeToBody(event.target.value === "body")}
          >
            <option value="world">World axes</option>
            <option value="body">Body axes (pitch/roll/yaw)</option>
          </select>
          <span className="field-hint">Use body pitch/roll/yaw as the reference for incoming airflow.</span>
        </label>
        {flowDirectionPreset === "custom" ? (
          <>
            <label className="field">
              <span>flow yaw (deg)</span>
              <input type="number" value={flowYaw} onChange={(event) => setFlowYaw(event.target.value)} step="any" />
              <span className="field-hint">Yaw rotates around the vertical axis.</span>
            </label>
            <label className="field">
              <span>flow pitch (deg)</span>
              <input type="number" value={flowPitch} onChange={(event) => setFlowPitch(event.target.value)} step="any" />
              <span className="field-hint">Pitch tilts the incoming stream up/down.</span>
            </label>
          </>
        ) : null}
        <label className="field">
          <span>viscosity (nu)</span>
          <input type="number" value={viscosity} onChange={(event) => setViscosity(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>fluid material</span>
          <select value={fluidPreset} onChange={(event) => setFluidPreset(event.target.value as FluidPreset)}>
            <option value="air_20c">Air (20C)</option>
            <option value="water_20c">Water (20C)</option>
            <option value="seawater_20c">Sea water (20C)</option>
            <option value="glycerin_20c">Glycerin (20C)</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="field">
          <span>radius</span>
          <input type="number" value={radius} onChange={(event) => setRadius(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>colorize speed</span>
          <select value={colorize ? "on" : "off"} onChange={(event) => setColorize(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>turbulence</span>
          <input
            type="number"
            value={turbulence}
            onChange={(event) => setTurbulence(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>turbulence model</span>
          <select value={turbulenceModel} onChange={(event) => setTurbulenceModel(event.target.value as "noise" | "smagorinsky" | "sst")}>
            <option value="noise">Noise (simple)</option>
            <option value="smagorinsky">Smagorinsky-Lilly (LES)</option>
            <option value="sst">SST-inspired (RANS)</option>
          </select>
          <span className="field-hint">SST mode uses a lightweight eddy-viscosity approximation.</span>
        </label>
        <label className="field">
          <span>particles</span>
          <input
            type="number"
            value={particleCount}
            onChange={(event) => setParticleCount(event.target.value)}
            step="1"
          />
          <div className="control-help">
            {dataSource === "backend"
              ? "CFD mode caps particles at 3,200 for stability."
              : "Analytic mode supports up to 9,000 particles for denser flow."}
          </div>
        </label>
        <label className="field">
          <span>show particles</span>
          <select value={showParticles ? "on" : "off"} onChange={(event) => setShowParticles(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>show streamlines</span>
          <select
            value={showStreamlines ? "on" : "off"}
            onChange={(event) => setShowStreamlines(event.target.value === "on")}
          >
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>streamline count</span>
          <input
            type="number"
            value={streamlineCount}
            onChange={(event) => setStreamlineCount(event.target.value)}
            step="1"
          />
        </label>
        <label className="field">
          <span>stream steps</span>
          <input
            type="number"
            value={streamlineSteps}
            onChange={(event) => setStreamlineSteps(event.target.value)}
            step="1"
          />
        </label>
        <label className="field">
          <span>stream step size</span>
          <input
            type="number"
            value={streamlineStep}
            onChange={(event) => setStreamlineStep(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>stream opacity</span>
          <input
            type="number"
            value={streamlineOpacity}
            onChange={(event) => setStreamlineOpacity(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>seed jitter</span>
          <input
            type="number"
            value={streamlineSeedJitter}
            onChange={(event) => setStreamlineSeedJitter(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>streamline style</span>
          <select value={streamlineStyle} onChange={(event) => setStreamlineStyle(event.target.value as "line" | "tube")}>
            <option value="tube">Tube</option>
            <option value="line">Line</option>
          </select>
        </label>
        <label className="field">
          <span>tube radius</span>
          <input
            type="number"
            value={streamlineRadius}
            onChange={(event) => setStreamlineRadius(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>contact filter</span>
          <select
            value={streamlineContactOnly ? "on" : "off"}
            onChange={(event) => setStreamlineContactOnly(event.target.value === "on")}
          >
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>contact margin</span>
          <input
            type="number"
            value={streamlineContactMargin}
            onChange={(event) => setStreamlineContactMargin(event.target.value)}
            step="any"
          />
          <span className="field-hint">Lower values keep only the streamlines that skim the surface.</span>
        </label>
        <label className="field">
          <span>context flow</span>
          <select value={showContextFlow ? "on" : "off"} onChange={(event) => setShowContextFlow(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>context opacity</span>
          <input type="number" value={contextOpacity} onChange={(event) => setContextOpacity(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>context radius</span>
          <input
            type="number"
            value={contextRadiusScale}
            onChange={(event) => setContextRadiusScale(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>boundary layer</span>
          <select value={showBoundaryLayer ? "on" : "off"} onChange={(event) => setShowBoundaryLayer(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>boundary margin</span>
          <input
            type="number"
            value={boundaryLayerMargin}
            onChange={(event) => setBoundaryLayerMargin(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>boundary radius</span>
          <input
            type="number"
            value={boundaryLayerRadius}
            onChange={(event) => setBoundaryLayerRadius(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>surface pressure</span>
          <select value={showSurfacePressure ? "on" : "off"} onChange={(event) => setShowSurfacePressure(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>surface mode</span>
          <select
            value={surfaceMode}
            onChange={(event) => setSurfaceMode(event.target.value as "pressure" | "speed" | "cp")}
          >
            <option value="pressure">Pressure</option>
            <option value="speed">Speed</option>
            <option value="cp">Cp</option>
          </select>
        </label>
        <label className="field">
          <span>surface banding</span>
          <select value={surfaceBanding ? "on" : "off"} onChange={(event) => setSurfaceBanding(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>band count</span>
          <input type="number" value={surfaceBands} onChange={(event) => setSurfaceBands(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>vortex cores</span>
          <select value={showVortexCores ? "on" : "off"} onChange={(event) => setShowVortexCores(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>slice plane</span>
          <select value={showSlice ? "on" : "off"} onChange={(event) => setShowSlice(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>slice axis</span>
          <select value={sliceAxis} onChange={(event) => setSliceAxis(event.target.value as "x" | "y" | "z")}>
            <option value="x">X</option>
            <option value="y">Y</option>
            <option value="z">Z</option>
          </select>
        </label>
        <label className="field">
          <span>slice position</span>
          <input type="number" value={slicePosition} onChange={(event) => setSlicePosition(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>slice resolution</span>
          <input
            type="number"
            value={sliceResolution}
            onChange={(event) => setSliceResolution(event.target.value)}
            step="1"
          />
        </label>
        <label className="field">
          <span>slice opacity</span>
          <input type="number" value={sliceOpacity} onChange={(event) => setSliceOpacity(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>slice mode</span>
          <select
            value={sliceMode}
            onChange={(event) =>
              setSliceMode(event.target.value as "speed" | "wake" | "vorticity" | "pressure" | "qcriterion")
            }
          >
            <option value="speed">Speed</option>
            <option value="wake">Wake deficit</option>
            <option value="vorticity">Vorticity</option>
            <option value="qcriterion">Q-criterion</option>
            <option value="pressure">Pressure</option>
          </select>
        </label>
        <label className="field">
          <span>slice stack</span>
          <input type="number" value={sliceStack} onChange={(event) => setSliceStack(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>slice spacing</span>
          <input type="number" value={sliceSpacing} onChange={(event) => setSliceSpacing(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>flow sheet</span>
          <select value={showFlowSheet ? "on" : "off"} onChange={(event) => setShowFlowSheet(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>flow sheet opacity</span>
          <input
            type="number"
            value={flowSheetOpacity}
            onChange={(event) => setFlowSheetOpacity(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>velocity glyphs</span>
          <select value={showGlyphs ? "on" : "off"} onChange={(event) => setShowGlyphs(event.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <label className="field">
          <span>glyph density</span>
          <input type="number" value={glyphDensity} onChange={(event) => setGlyphDensity(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>glyph scale</span>
          <input type="number" value={glyphScale} onChange={(event) => setGlyphScale(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>spread</span>
          <input type="number" value={spread} onChange={(event) => setSpread(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>density (rho)</span>
          <input type="number" value={density} onChange={(event) => setDensity(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>Cd</span>
          <input
            type="number"
            value={dragCoefficient}
            onChange={(event) => setDragCoefficient(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>ref area (m^2)</span>
          <input
            type="number"
            value={referenceArea}
            onChange={(event) => setReferenceArea(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>wake strength</span>
          <input
            type="number"
            value={wakeStrength}
            onChange={(event) => setWakeStrength(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>vortex strength</span>
          <input
            type="number"
            value={vortexStrength}
            onChange={(event) => setVortexStrength(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>angle of attack (deg)</span>
          <input
            type="number"
            value={angleOfAttack}
            onChange={(event) => setAngleOfAttack(event.target.value)}
            step="any"
          />
          <span className="field-hint">Yaw rotation of the body.</span>
        </label>
        <label className="field">
          <span>body pitch (deg)</span>
          <input type="number" value={bodyPitch} onChange={(event) => setBodyPitch(event.target.value)} step="any" />
          <span className="field-hint">Tilt the nose up/down.</span>
        </label>
        <label className="field">
          <span>body roll (deg)</span>
          <input type="number" value={bodyRoll} onChange={(event) => setBodyRoll(event.target.value)} step="any" />
          <span className="field-hint">Roll around the forward axis.</span>
        </label>
        <label className="field">
          <span>object offset X</span>
          <input type="number" value={objectOffsetX} onChange={(event) => setObjectOffsetX(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>object offset Y</span>
          <input type="number" value={objectOffsetY} onChange={(event) => setObjectOffsetY(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>object offset Z</span>
          <input type="number" value={objectOffsetZ} onChange={(event) => setObjectOffsetZ(event.target.value)} step="any" />
          <span className="field-hint">Use offsets to move the model within the flow domain.</span>
        </label>
        <label className="field">
          <span>body shape</span>
          <select value={bodyShape} onChange={(event) => setBodyShape(event.target.value as BodyShape)}>
            <option value="sphere">Sphere</option>
            <option value="capsule">Capsule</option>
            <option value="teardrop">Teardrop</option>
            <option value="box">Box</option>
            <option value="cylinder">Cylinder</option>
            <option value="car">Car-like</option>
            <option value="custom">Custom (imported)</option>
          </select>
        </label>
        {bodyShape === "car" ? (
          <>
            <label className="field">
              <span>rear wing</span>
              <select value={rearWing ? "on" : "off"} onChange={(event) => setRearWing(event.target.value === "on")}>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
            <label className="field">
              <span>front wing</span>
              <select value={frontWing ? "on" : "off"} onChange={(event) => setFrontWing(event.target.value === "on")}>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
            <label className="field">
              <span>wing angle (deg)</span>
              <input type="number" value={wingAngle} onChange={(event) => setWingAngle(event.target.value)} step="any" />
            </label>
            <label className="field">
              <span>wing span</span>
              <input type="number" value={wingSpan} onChange={(event) => setWingSpan(event.target.value)} step="any" />
            </label>
            <label className="field">
              <span>wing chord</span>
              <input type="number" value={wingChord} onChange={(event) => setWingChord(event.target.value)} step="any" />
            </label>
          </>
        ) : null}
        <label className="field">
          <span>import object (.glb/.gltf/.obj/.stl)</span>
          <input
            type="file"
            accept=".glb,.gltf,.obj,.stl"
            onChange={(event) => handleImport(event.target.files?.[0] ?? null)}
          />
          {importedLabel ? <span className="field-hint">Loaded: {importedLabel} (radius auto-scaled)</span> : null}
          {cfdOnly ? <span className="field-hint">CFD-only mode uses the backend mesh upload below for VTK.</span> : null}
          {importError ? <span className="field-error">{importError}</span> : null}
        </label>
        <label className="field">
          <span>color map</span>
          <select value={colorMap} onChange={(event) => setColorMap(event.target.value as ColorMap)}>
            <option value="thermal">Thermal</option>
            <option value="viridis">Viridis</option>
          </select>
        </label>
        <label className="field">
          <span>data source</span>
          <select value={dataSource} onChange={(event) => handleDataSourceChange(event.target.value as "analytic" | "backend")}>
            <option value="analytic">Analytic flow</option>
            <option value="backend">CFD backend</option>
          </select>
        </label>
        {dataSource === "backend" ? (
          <>
            <label className="field">
              <span>backend engine</span>
              <select
                value={backendEngine}
                onChange={(event) => {
                  const nextEngine = event.target.value as "lbm" | "openfoam" | "fluidx3d";
                  setBackendEngine(nextEngine);
                  if (dataSource !== "backend") {
                    void activateBackendMode(nextEngine);
                  } else if (nextEngine !== "fluidx3d") {
                    void ensureBackendReachable(nextEngine);
                  }
                }}
              >
                <option value="lbm">LBM proxy (fast)</option>
                <option value="fluidx3d">FluidX3D field import</option>
                <option value="openfoam">OpenFOAM (full CFD)</option>
              </select>
            </label>
            {backendEngine === "fluidx3d" ? (
              <label className="field">
                <span>FluidX3D field (.vtk/.vti)</span>
                <input
                  type="file"
                  accept=".vtk,.vti"
                  onChange={(event) => handleFluidx3dFieldImport(event.target.files?.[0] ?? null)}
                />
                {fluidx3dFieldLabel ? (
                  <span className="field-hint">
                    Loaded: {fluidx3dFieldLabel}
                    {fluidx3dFieldMeta ? ` (${fluidx3dFieldMeta.nx}×${fluidx3dFieldMeta.ny}×${fluidx3dFieldMeta.nz})` : ""}
                  </span>
                ) : null}
                <span className="field-hint">
                  Export an image data field from FluidX3D with velocity vectors named <span className="mono">U</span>.
                </span>
                {fluidx3dFieldError ? <span className="field-error">{fluidx3dFieldError}</span> : null}
              </label>
            ) : null}
            {backendEngine !== "fluidx3d" ? (
              <>
                <label className="field">
                  <span>backend resolution</span>
                  <input
                    type="number"
                    value={backendResolution}
                    onChange={(event) => setBackendResolution(event.target.value)}
                    step="1"
                  />
                </label>
                <label className="field">
                  <span>backend steps</span>
                  <input
                    type="number"
                    value={backendSteps}
                    onChange={(event) => setBackendSteps(event.target.value)}
                    step="1"
                  />
                </label>
              </>
            ) : null}
            {backendEngine === "openfoam" || backendEngine === "fluidx3d" ? (
              <label className="field">
                <span>{backendEngine === "openfoam" ? "export path" : "field path (.vtk/.vti)"}</span>
                <input
                  type="text"
                  value={exportPath}
                  onChange={(event) => setExportPath(event.target.value)}
                  placeholder={
                    backendEngine === "openfoam"
                      ? "/path/to/field.csv"
                      : "/path/to/fluidx3d/output/field.vtk"
                  }
                />
                {backendEngine === "fluidx3d" ? (
                  <span className="field-hint">Optional. Leave blank if you upload the VTK field directly.</span>
                ) : null}
              </label>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="demo-output">
        <div className="inline-kv">
          <span
            className={`pill ${backendStatus === "ready" || pipelineLabel.includes("ready") ? "pill-good" : backendStatus === "error" ? "pill-bad" : ""}`}
          >
            CFD: {dataSource === "backend" ? backendStatus : "not used"} &middot; engine{" "}
            {dataSource === "backend" ? backendEngine : "n/a"} &middot; field {pipelineLabel}
          </span>
          <span className="pill">Re = {Number.isFinite(reynolds) ? reynolds.toFixed(0) : "--"}</span>
          <span className="pill">rel speed = {Number.isFinite(relSpeed) ? relSpeed.toFixed(2) : "--"} m/s</span>
          <span className="pill">drag approx {Number.isFinite(dragForce) ? dragForce.toFixed(2) : "--"} N</span>
          <span className="pill">q = {Number.isFinite(dynamicPressure) ? dynamicPressure.toFixed(1) : "--"} Pa</span>
        </div>
        <div className="model-grid cfd-evidence-grid">
          <div className="model-card">
            <h3>Flow model</h3>
            <p className="demo-note">
              Keep the fluid preset, viscosity, and Reynolds-style scale visible before you interpret the wake.
            </p>
            <div className="pill-grid">
              <span className="pill">preset: {FLUID_PRESETS[fluidPreset].label}</span>
              <span className="pill">rho = {Number.isFinite(densityVal) ? densityVal.toPrecision(4) : "--"} kg/m^3</span>
              <span className="pill">nu = {Number.isFinite(nuVal) ? nuVal.toExponential(2) : "--"} m^2/s</span>
              <span className="pill">Re = {Number.isFinite(reynolds) ? reynolds.toFixed(0) : "--"}</span>
            </div>
          </div>
          <div className="model-card">
            <h3>Evidence rail</h3>
            <div className="pill-grid">
              {evidenceChips.map((item) => (
                <span key={item} className="pill">
                  {item}
                </span>
              ))}
            </div>
            <ul className="feature-list">
              <li>Last artifact refresh: {formatArtifactTime(artifactTime)}</li>
              <li>Artifact size: {formatBytes(artifactSize)}</li>
              <li>{artifactPath ? `Evidence path: ${artifactPath}` : "No exported evidence path is visible yet."}</li>
            </ul>
          </div>
          <div className="model-card">
            <h3>What this mode can prove</h3>
            <ul className="feature-list">
              {canProve.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="demo-note equation-workbench-subhead">What it cannot prove yet</div>
            <ul className="feature-list">
              {cannotProve.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="model-card">
            <h3>Escalation cue</h3>
            <p className="demo-note">{recommendedEscalation}</p>
            <div className="pill-grid">
              {meshMeta?.sampleDictPath ? <span className="pill">sampleDict ready</span> : null}
              {caseInfo?.zipPath ? <span className="pill">case zip ready</span> : null}
              {backendMeta?.openfoamPressurePath ? <span className="pill">pressure artifact visible</span> : null}
            </div>
          </div>
        </div>
        {backendError ? <div className="demo-note" style={{ color: "#b91c1c" }}>{backendError}</div> : null}
        {cfdOnly && backendStatus !== "ready" ? (
          <div className="demo-note">
            CFD field not ready yet. You can wait for the backend or turn off CFD-only to keep working with the analytic
            preview.
          </div>
        ) : null}
        <div className="demo-note">
          Object stays fixed while airflow streams past it. Surface colors highlight high pressure/drag regions.
        </div>
        <div className="demo-note">
          Streamlines are computed from the same flow field. Increase streamline count/steps for dense CFD-style visuals.
        </div>
        <div className="demo-note">Switch to the CFD backend to drive streamlines from the LBM proxy, FluidX3D fields, or OpenFOAM.</div>
        <div className="cfd-legend">
          <span>Speed</span>
          <span
            className="cfd-scale"
            style={{
              background:
                colorMap === "viridis"
                  ? "linear-gradient(90deg, #440154, #3b528b, #21918c, #5ec962, #fde725)"
                  : "linear-gradient(90deg, #1933f1, #1cb9f5, #1fd37e, #f4dc1f, #f04a38)"
            }}
          />
          <span className="mono">low -&gt; high</span>
        </div>
        {dataSource === "backend" && backendEngine === "openfoam" ? (
          <div className="demo-note">
            OpenFOAM expects a CSV export with x,y,z,ux,uy,uz[,p]. You can point the export path at a CSV file or at an
            OpenFOAM case folder (we will auto-detect the newest sampled files).
          </div>
        ) : null}
        {dataSource === "backend" && backendEngine === "fluidx3d" ? (
          <div className="demo-note">
            FluidX3D exports image-data fields as VTK. Upload the velocity field here to drive streamtubes, pressure, and
            Q-criterion visuals in the viewer.
          </div>
        ) : null}
        {dataSource === "backend" && backendEngine === "fluidx3d" ? (
          <details className="details-block" style={{ marginTop: "8px" }}>
            <summary>FluidX3D field monitoring</summary>
            <div className="demo-note" style={{ marginTop: "8px" }}>
              Optionally poll the backend for new FluidX3D VTK fields and refresh the viewer automatically.
            </div>
            <label className="field" style={{ marginTop: "8px" }}>
              <span>auto refresh field</span>
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
              <span className="field-hint">Poll the backend output folder at an interval.</span>
            </label>
            <label className="field">
              <span>refresh interval (seconds)</span>
              <input
                type="number"
                min="2"
                step="1"
                value={autoRefreshInterval}
                onChange={(event) => setAutoRefreshInterval(event.target.value)}
              />
              <span className="field-hint">Lower values update the viewer more often.</span>
            </label>
            {backendMeta?.fluidx3dPath ? (
              <div className="demo-note">
                FluidX3D field path: <span className="mono">{backendMeta.fluidx3dPath}</span>
              </div>
            ) : null}
            {backendMeta?.fluidx3dMtime ? (
              <div className="inline-kv" style={{ marginTop: "6px" }}>
                <span className="pill">mtime: {new Date(backendMeta.fluidx3dMtime * 1000).toLocaleString()}</span>
                {backendMeta.fluidx3dSize ? <span className="pill">size: {backendMeta.fluidx3dSize} bytes</span> : null}
              </div>
            ) : null}
          </details>
        ) : null}
        {dataSource === "backend" && (backendEngine === "openfoam" || backendEngine === "fluidx3d") ? (
          <div className="demo-note">
            Upload your mesh to generate a tailored sampleDict for that geometry. This helps OpenFOAM sample the correct domain.
            <label className="field" style={{ marginTop: "8px" }}>
              <span>upload mesh to CFD backend</span>
              <input
                type="file"
                accept=".stl,.obj,.glb,.gltf,.ply"
                onChange={(event) => handleMeshUpload(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="control-help">
              Upload a mesh to see it in the 3D view and generate an OpenFOAM-ready sampling grid. STL and PLY load
              directly in the VTK viewer; OBJ/GLB/GLTF are supported for case generation.
            </div>
            <div className="demo-note" style={{ marginTop: "8px" }}>
              Step 1: Upload the mesh. Step 2: Generate templates or the full case. Step 3: Run the pipeline or download
              the case ZIP.
            </div>
            {meshUploadStatus === "uploading" ? <div className="pill">uploading mesh...</div> : null}
            {meshUploadStatus === "error" ? <div className="pill pill-bad">{meshUploadError || "upload failed"}</div> : null}
            {meshUploadStatus === "ready" && meshMeta ? (
              <div className="mesh-panel" style={{ marginTop: "8px" }}>
                <div className="mesh-meta-grid">
                  <div className="inline-kv">
                    <span className="pill">mesh id: {meshMeta.meshId}</span>
                    {meshMeta.size ? (
                      <span className="pill">
                        size: {meshMeta.size.map((val) => Number(val).toFixed(3)).join(", ")}
                      </span>
                    ) : null}
                  </div>
                  {meshMeta.bounds ? (
                    <div className="inline-kv">
                      <span className="pill">bounds min: {meshMeta.bounds.min.map((val) => Number(val).toFixed(2)).join(", ")}</span>
                      <span className="pill">bounds max: {meshMeta.bounds.max.map((val) => Number(val).toFixed(2)).join(", ")}</span>
                    </div>
                  ) : null}
                  {meshMeta.suggestedGrid ? (
                    <div className="inline-kv">
                      <span className="pill">grid start: {meshMeta.suggestedGrid.start.map((val) => Number(val).toFixed(2)).join(", ")}</span>
                      <span className="pill">grid end: {meshMeta.suggestedGrid.end.map((val) => Number(val).toFixed(2)).join(", ")}</span>
                      <span className="pill">grid n: {meshMeta.suggestedGrid.nPoints.join(" x ")}</span>
                    </div>
                  ) : null}
                </div>
                {meshMeta.sampleDict ? (
                  <details className="details-block">
                    <summary>View generated sampleDict</summary>
                    <div className="code-block compact" style={{ marginTop: "8px" }}>
                      <pre>
                        <code>{meshMeta.sampleDict}</code>
                      </pre>
                    </div>
                  </details>
                ) : null}
                {meshMeta.sampleDictPath ? (
                  <div className="demo-note">sampleDict saved at: <span className="mono">{meshMeta.sampleDictPath}</span></div>
                ) : null}
                <div className="control-row" style={{ marginTop: "8px" }}>
                  <div className="control-group">
                    <button type="button" className="control-button secondary" onClick={loadCaseTemplates}>
                      Generate OpenFOAM templates
                    </button>
                    <div className="control-help">Creates OpenFOAM system files (sampleDict, controlDict, etc.).</div>
                  </div>
                  <div className="control-group">
                    <button type="button" className="control-button secondary" onClick={loadQueue}>
                      Load CFD queue
                    </button>
                    <div className="control-help">Loads your CFD queue entries (optional workflow).</div>
                  </div>
                </div>
                {caseStatus === "loading" ? <div className="pill">building templates...</div> : null}
                {caseStatus === "error" ? <div className="pill pill-bad">template generation failed</div> : null}
                {caseTemplates ? (
                  <details className="details-block">
                    <summary>OpenFOAM template files</summary>
                    <div className="demo-stack" style={{ marginTop: "8px" }}>
                      {Object.entries(caseTemplates).map(([key, value]) => (
                        <div key={key} className="code-block compact" style={{ marginTop: "8px" }}>
                          <div className="demo-note">{key}</div>
                          <pre>
                            <code>{value}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
                <details className="details-block">
                  <summary>Advanced OpenFOAM pipeline</summary>
                  <div className="demo-note" style={{ marginTop: "8px" }}>
                    Generate a complete case folder for your mesh and optionally run it in WSL.
                  </div>
                  <label className="field" style={{ marginTop: "8px" }}>
                    <span>auto refresh OpenFOAM output</span>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(event) => setAutoRefresh(event.target.checked)}
                    />
                    <span className="field-hint">Poll the solver output folder at an interval.</span>
                  </label>
                  <label className="field">
                    <span>refresh interval (seconds)</span>
                    <input
                      type="number"
                      min="2"
                      step="1"
                      value={autoRefreshInterval}
                      onChange={(event) => setAutoRefreshInterval(event.target.value)}
                    />
                    <span className="field-hint">Lower values update the viewer more often.</span>
                  </label>
                  {backendEngine === "openfoam" && backendMeta?.openfoamPath ? (
                    <div className="demo-note">
                      OpenFOAM export path: <span className="mono">{backendMeta.openfoamPath}</span>
                    </div>
                  ) : null}
                  {backendEngine === "openfoam" && backendMeta?.openfoamPressurePath ? (
                    <div className="demo-note">
                      OpenFOAM pressure path: <span className="mono">{backendMeta.openfoamPressurePath}</span>
                    </div>
                  ) : null}
                  {backendEngine === "openfoam" && backendMeta?.openfoamMtime ? (
                    <div className="inline-kv" style={{ marginTop: "6px" }}>
                      <span className="pill">mtime: {new Date(backendMeta.openfoamMtime * 1000).toLocaleString()}</span>
                      {backendMeta.openfoamSize ? <span className="pill">size: {backendMeta.openfoamSize} bytes</span> : null}
                    </div>
                  ) : null}
                  {backendEngine === "fluidx3d" && backendMeta?.fluidx3dPath ? (
                    <div className="demo-note">
                      FluidX3D field path: <span className="mono">{backendMeta.fluidx3dPath}</span>
                    </div>
                  ) : null}
                  {backendEngine === "fluidx3d" && backendMeta?.fluidx3dMtime ? (
                    <div className="inline-kv" style={{ marginTop: "6px" }}>
                      <span className="pill">mtime: {new Date(backendMeta.fluidx3dMtime * 1000).toLocaleString()}</span>
                      {backendMeta.fluidx3dSize ? <span className="pill">size: {backendMeta.fluidx3dSize} bytes</span> : null}
                    </div>
                  ) : null}
                  <label className="field" style={{ marginTop: "8px" }}>
                    <span>overwrite existing case</span>
                    <input
                      type="checkbox"
                      checked={overwriteCase}
                      onChange={(event) => setOverwriteCase(event.target.checked)}
                    />
                    <span className="field-hint">Enable when you want to regenerate the same case folder.</span>
                  </label>
                  <div className="control-row" style={{ marginTop: "8px" }}>
                    <div className="control-group">
                      <button type="button" className="control-button secondary" onClick={() => generateCase()}>
                        Generate full OpenFOAM case
                      </button>
                      <div className="control-help">Builds a full case folder for your mesh.</div>
                    </div>
                    <div className="control-group">
                      <button type="button" className="control-button secondary" onClick={() => runCase()}>
                        Launch WSL run
                      </button>
                      <div className="control-help">Runs OpenFOAM in WSL using the generated case.</div>
                    </div>
                    <div className="control-group">
                      <button type="button" className="control-button" onClick={runFullPipeline}>
                        Run full OpenFOAM pipeline
                      </button>
                      <div className="control-help">Generate case, run solver, and refresh outputs.</div>
                    </div>
                    {backendUrl && meshMeta?.meshId ? (
                      <div className="control-group">
                        <a
                          className="control-button secondary"
                          href={`${backendUrl}/case/${meshMeta.meshId}/download`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download case ZIP
                        </a>
                        <div className="control-help">Download the case to run externally.</div>
                      </div>
                    ) : null}
                  </div>
                  {caseBuildStatus === "loading" ? <div className="pill">building case folder...</div> : null}
                  {caseBuildStatus === "error" ? (
                    <div className="pill pill-bad">{caseBuildError || "case build failed"}</div>
                  ) : null}
                  {caseInfo?.casePath ? (
                    <div className="demo-note" style={{ marginTop: "8px" }}>
                      case path: <span className="mono">{caseInfo.casePath}</span>
                    </div>
                  ) : null}
                  {caseInfo?.runScript ? (
                    <div className="demo-note">
                      run script: <span className="mono">{caseInfo.runScript}</span>
                    </div>
                  ) : null}
                  {caseInfo?.command ? (
                    <div className="demo-note">
                      run command:{" "}
                      <span className="mono">
                        {Array.isArray(caseInfo.command) ? caseInfo.command.join(" ") : caseInfo.command}
                      </span>
                    </div>
                  ) : null}
                  {runStatus === "running" ? <div className="pill">starting OpenFOAM run...</div> : null}
                  {runStatus === "error" ? <div className="pill pill-bad">{runError}</div> : null}
                  <div className="control-row" style={{ marginTop: "10px" }}>
                    <div className="control-group">
                      <button type="button" className="control-button secondary" onClick={() => fetchRunLog()}>
                        Load run log
                      </button>
                      <div className="control-help">Fetch the last 200 lines from run.log.</div>
                    </div>
                    {runLogStatus === "loading" ? <span className="pill">loading log…</span> : null}
                    {runLogStatus === "error" ? <span className="pill pill-bad">run.log not available</span> : null}
                  </div>
                  {runLogLines.length ? (
                    <div className="demo-note" style={{ marginTop: "8px" }}>
                      <pre style={{ maxHeight: "220px", overflow: "auto", whiteSpace: "pre-wrap" }}>
                        {runLogLines.join("\n")}
                      </pre>
                    </div>
                  ) : null}
                  <div className="demo-note" style={{ marginTop: "8px" }}>
                    CFD queue (side feature): track multiple runs.
                  </div>
                  <label className="field" style={{ marginTop: "8px" }}>
                    <span>queue notes</span>
                    <input type="text" value={queueNote} onChange={(event) => setQueueNote(event.target.value)} />
                  </label>
                  <div className="control-row" style={{ marginTop: "8px" }}>
                    <div className="control-group">
                      <button type="button" className="control-button secondary" onClick={createQueueJob}>
                        Add to CFD queue
                      </button>
                      <div className="control-help">Save this run to the queue for tracking.</div>
                    </div>
                  </div>
                  {queueStatus === "loading" ? <div className="pill">updating queue...</div> : null}
                  {queueStatus === "error" ? <div className="pill pill-bad">queue update failed</div> : null}
                  {queueJobs.length ? (
                    <div className="demo-stack" style={{ marginTop: "8px" }}>
                      {queueJobs.map((job) => (
                        <div key={job.id} className="inline-kv">
                          <span className="pill">job {job.id}</span>
                          <span className="pill">mesh {job.meshId}</span>
                          <span className="pill">status: {job.status}</span>
                          {job.notes ? <span className="pill">{job.notes}</span> : null}
                          <button
                            type="button"
                            className="control-button secondary"
                            onClick={() => updateQueueJob(job.id, "running")}
                          >
                            Mark running
                          </button>
                          <button
                            type="button"
                            className="control-button secondary"
                            onClick={() => updateQueueJob(job.id, "done")}
                          >
                            Mark done
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </details>
              </div>
            ) : null}
            {!backendUrl ? (
              <div className="demo-note">
                Set <span className="mono">NEXT_PUBLIC_CFD_BACKEND_URL</span> to enable mesh uploads from the browser.
              </div>
            ) : (
              <div className="demo-note">
                CFD backend: <span className="mono">{backendUrl}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
      <div className="control-row">
        <div className="control-group">
          <button type="button" className="control-button" onClick={() => setIsPlaying((prev) => !prev)}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <div className="control-help">Pause or resume the 3D flow animation.</div>
        </div>
        {dataSource === "backend" ? (
          <div className="control-group">
            <button type="button" className="control-button secondary" onClick={() => requestBackendField()}>
              Refresh CFD
            </button>
            <div className="control-help">Pull the latest field/streamlines from the backend.</div>
          </div>
        ) : null}
        <div className="control-group">
          <button type="button" className="control-button secondary" onClick={applyProPreset}>
            Pro CFD preset
          </button>
          <div className="control-help">Loads high-quality defaults for a denser view.</div>
        </div>
        <div className="control-group">
          <button type="button" className="control-button secondary" onClick={applyUltraAnalyticPreset}>
            Ultra Analytic preset
          </button>
          <div className="control-help">Max-density analytic streamlines (no CFD backend required).</div>
        </div>
        <div className="control-group">
          <button type="button" className="control-button secondary" onClick={clearSavedSession}>
            Clear saved session
          </button>
          <div className="control-help">Remove the stored CFD view so refresh starts clean.</div>
        </div>
        <div className="control-group">
          <button type="button" className="control-button secondary" onClick={() => setIsPlaying(true)}>
            Reset
          </button>
          <div className="control-help">Reset animation state and keep playing.</div>
        </div>
      </div>
      {renderMode === "vtk" ? (
        <div className="demo-note">
          VTK mode visualizes CFD fields as streamtubes. Upload an STL/OBJ/PLY mesh (OpenFOAM pipeline) or a FluidX3D VTK
          field to render the body inside the streamtube view.
        </div>
      ) : null}
      {cfdOnly ? (
        <div className="demo-note">
          CFD-only realism is enabled. Analytic previews are disabled; streamlines and surface pressure require an OpenFOAM
          or FluidX3D backend field. If streamlines are missing, the viewer falls back to a surface-seeded trace from the
          sampled field.
        </div>
      ) : null}
      {sessionError ? <div className="demo-note">Session restore error: {sessionError}</div> : null}
      <div className="demo-note" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Need a full precision setup checklist?</span>
        <a className="control-button ghost" href="/labs/mechanics/drag/flow-3d/guide">
          Open the CFD guide
        </a>
      </div>
      <div className="plot-frame" style={{ height: "520px", position: "relative" }}>
        {renderMode === "vtk" ? (
          <>
            <div ref={vtkContainerRef} style={{ width: "100%", height: "100%" }} />
            {dataSource === "backend" && backendStatus === "loading" ? (
              <div className="demo-note" style={{ position: "absolute", left: 16, top: 16 }}>
                Loading backend field...
              </div>
            ) : null}
            {vtkMessage ? (
              <div className="demo-note" style={{ position: "absolute", left: 16, bottom: 16 }}>
                {vtkMessage}
              </div>
            ) : null}
          </>
        ) : (
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        )}
      </div>
    </div>
  );
}
