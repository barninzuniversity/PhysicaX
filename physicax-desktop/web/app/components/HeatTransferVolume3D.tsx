"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";
import { PlotlyPlot } from "./PlotlyPlot";
import { MathInline } from "./MathBlock";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type MaterialPreset =
  | "custom"
  | "aluminum"
  | "copper"
  | "steel"
  | "glass"
  | "water"
  | "air";

type RadiationModel = "linearized" | "full";

type TablePoint = { t: number; v: number };

type HeatSource = {
  enabled: boolean;
  x: string;
  y: string;
  z: string;
  strength: string;
  radius: string;
};

type RegionMaterial = {
  enabled: boolean;
  preset: MaterialPreset;
  centerX: string;
  centerY: string;
  centerZ: string;
  radius: string;
};

type MeshStatus = "idle" | "loading" | "ready" | "error";

const MATERIAL_PRESETS: Record<MaterialPreset, { label: string; k?: number; rho?: number; cp?: number }> = {
  custom: { label: "Custom" },
  aluminum: { label: "Aluminum", k: 205, rho: 2700, cp: 900 },
  copper: { label: "Copper", k: 401, rho: 8960, cp: 385 },
  steel: { label: "Steel", k: 50, rho: 7850, cp: 470 },
  glass: { label: "Glass", k: 1.05, rho: 2500, cp: 800 },
  water: { label: "Water", k: 0.6, rho: 998, cp: 4182 },
  air: { label: "Air", k: 0.026, rho: 1.204, cp: 1006 }
};

const MATERIAL_TABLES: Record<MaterialPreset, { k: TablePoint[]; cp: TablePoint[]; rho: TablePoint[]; eps: TablePoint[] }> = {
  custom: {
    k: [
      { t: 300, v: 200 },
      { t: 500, v: 180 },
      { t: 700, v: 160 }
    ],
    cp: [
      { t: 300, v: 900 },
      { t: 500, v: 980 },
      { t: 700, v: 1030 }
    ],
    rho: [
      { t: 300, v: 2700 },
      { t: 600, v: 2680 },
      { t: 900, v: 2650 }
    ],
    eps: [
      { t: 300, v: 0.2 },
      { t: 600, v: 0.3 },
      { t: 900, v: 0.35 }
    ]
  },
  aluminum: {
    k: [
      { t: 300, v: 237 },
      { t: 400, v: 210 },
      { t: 500, v: 185 },
      { t: 600, v: 170 }
    ],
    cp: [
      { t: 300, v: 900 },
      { t: 500, v: 960 },
      { t: 700, v: 1020 }
    ],
    rho: [
      { t: 300, v: 2700 },
      { t: 600, v: 2670 },
      { t: 900, v: 2640 }
    ],
    eps: [
      { t: 300, v: 0.1 },
      { t: 600, v: 0.18 },
      { t: 900, v: 0.25 }
    ]
  },
  copper: {
    k: [
      { t: 300, v: 401 },
      { t: 400, v: 390 },
      { t: 600, v: 375 },
      { t: 800, v: 360 }
    ],
    cp: [
      { t: 300, v: 385 },
      { t: 500, v: 405 },
      { t: 800, v: 430 }
    ],
    rho: [
      { t: 300, v: 8960 },
      { t: 600, v: 8920 },
      { t: 900, v: 8860 }
    ],
    eps: [
      { t: 300, v: 0.05 },
      { t: 600, v: 0.12 },
      { t: 900, v: 0.2 }
    ]
  },
  steel: {
    k: [
      { t: 300, v: 60 },
      { t: 600, v: 45 },
      { t: 900, v: 35 }
    ],
    cp: [
      { t: 300, v: 470 },
      { t: 600, v: 560 },
      { t: 900, v: 650 }
    ],
    rho: [
      { t: 300, v: 7850 },
      { t: 600, v: 7800 },
      { t: 900, v: 7750 }
    ],
    eps: [
      { t: 300, v: 0.3 },
      { t: 600, v: 0.5 },
      { t: 900, v: 0.65 }
    ]
  },
  glass: {
    k: [
      { t: 300, v: 1.05 },
      { t: 600, v: 1.1 },
      { t: 900, v: 1.2 }
    ],
    cp: [
      { t: 300, v: 800 },
      { t: 600, v: 900 },
      { t: 900, v: 1000 }
    ],
    rho: [
      { t: 300, v: 2500 },
      { t: 600, v: 2470 },
      { t: 900, v: 2440 }
    ],
    eps: [
      { t: 300, v: 0.9 },
      { t: 600, v: 0.9 },
      { t: 900, v: 0.9 }
    ]
  },
  water: {
    k: [
      { t: 300, v: 0.6 },
      { t: 350, v: 0.64 },
      { t: 400, v: 0.68 }
    ],
    cp: [
      { t: 300, v: 4182 },
      { t: 350, v: 4300 },
      { t: 400, v: 4400 }
    ],
    rho: [
      { t: 300, v: 998 },
      { t: 350, v: 985 },
      { t: 400, v: 958 }
    ],
    eps: [
      { t: 300, v: 0.96 },
      { t: 350, v: 0.96 },
      { t: 400, v: 0.96 }
    ]
  },
  air: {
    k: [
      { t: 300, v: 0.026 },
      { t: 400, v: 0.03 },
      { t: 500, v: 0.036 }
    ],
    cp: [
      { t: 300, v: 1006 },
      { t: 400, v: 1020 },
      { t: 500, v: 1050 }
    ],
    rho: [
      { t: 300, v: 1.204 },
      { t: 400, v: 0.9 },
      { t: 500, v: 0.7 }
    ],
    eps: [
      { t: 300, v: 0.03 },
      { t: 400, v: 0.03 },
      { t: 500, v: 0.03 }
    ]
  }
};

const parseTable = (text: string): TablePoint[] => {
  const points: TablePoint[] = [];
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.replace(/;/g, ",").split(/[,|\s]+/);
      if (parts.length < 2) {
        return;
      }
      const t = Number(parts[0]);
      const v = Number(parts[1]);
      if (Number.isFinite(t) && Number.isFinite(v)) {
        points.push({ t, v });
      }
    });
  points.sort((a, b) => a.t - b.t);
  return points;
};

const sampleTable = (table: TablePoint[], tempK: number, fallback: number) => {
  if (!table.length || !Number.isFinite(tempK)) {
    return fallback;
  }
  if (tempK <= table[0].t) {
    return table[0].v;
  }
  for (let i = 0; i < table.length - 1; i += 1) {
    const a = table[i];
    const b = table[i + 1];
    if (tempK >= a.t && tempK <= b.t) {
      const t = (tempK - a.t) / Math.max(1e-6, b.t - a.t);
      return a.v + (b.v - a.v) * t;
    }
  }
  return table[table.length - 1].v;
};

const tableToText = (table: TablePoint[]) => table.map((point) => `${point.t}, ${point.v}`).join("\n");

export function HeatTransferVolume3D() {
  const [materialPreset, setMaterialPreset] = useState<MaterialPreset>("aluminum");
  const [useTempDependentProps, setUseTempDependentProps] = useState(true);
  const [conductivity, setConductivity] = useState("205");
  const [density, setDensity] = useState("2700");
  const [heatCapacity, setHeatCapacity] = useState("900");
  const [useDerivedAlpha, setUseDerivedAlpha] = useState(true);
  const [alpha, setAlpha] = useState("8.4e-5");
  const [anisotropic, setAnisotropic] = useState(false);
  const [alphaX, setAlphaX] = useState("1");
  const [alphaY, setAlphaY] = useState("1");
  const [alphaZ, setAlphaZ] = useState("1");
  const [convectionCoeff, setConvectionCoeff] = useState("15");
  const [surfaceFlux, setSurfaceFlux] = useState("0");
  const [volumetricHeat, setVolumetricHeat] = useState("0");
  const [includeRadiation, setIncludeRadiation] = useState(true);
  const [radiationModel, setRadiationModel] = useState<RadiationModel>("linearized");
  const [emissivity, setEmissivity] = useState("0.85");
  const [tempsInC, setTempsInC] = useState(true);
  const [objectTemp, setObjectTemp] = useState("120");
  const [ambientTemp, setAmbientTemp] = useState("20");
  const [objectRadius, setObjectRadius] = useState("0.5");
  const [objectShape, setObjectShape] = useState<"sphere" | "mesh">("sphere");
  const [meshFitToRadius, setMeshFitToRadius] = useState(true);
  const [meshScale, setMeshScale] = useState("1");
  const [meshOffsetX, setMeshOffsetX] = useState("0");
  const [meshOffsetY, setMeshOffsetY] = useState("0");
  const [meshOffsetZ, setMeshOffsetZ] = useState("0");
  const [meshStatus, setMeshStatus] = useState<MeshStatus>("idle");
  const [meshError, setMeshError] = useState("");
  const [meshFileName, setMeshFileName] = useState("");
  const [meshBase, setMeshBase] = useState<THREE.BufferGeometry | null>(null);
  const [meshGeometry, setMeshGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [meshBounds, setMeshBounds] = useState<{
    min: [number, number, number];
    max: [number, number, number];
    maxDim: number;
  } | null>(null);
  const [domainHalf, setDomainHalf] = useState("1.2");
  const [sourceDecayWithConvection, setSourceDecayWithConvection] = useState(true);
  const [sources, setSources] = useState<HeatSource[]>([
    { enabled: false, x: "0.6", y: "0.0", z: "0.0", strength: "35", radius: "0.2" },
    { enabled: false, x: "-0.6", y: "0.0", z: "0.0", strength: "35", radius: "0.2" },
    { enabled: false, x: "0.0", y: "0.6", z: "0.0", strength: "25", radius: "0.25" }
  ]);
  const [customKTable, setCustomKTable] = useState(tableToText(MATERIAL_TABLES.custom.k));
  const [customCpTable, setCustomCpTable] = useState(tableToText(MATERIAL_TABLES.custom.cp));
  const [customRhoTable, setCustomRhoTable] = useState(tableToText(MATERIAL_TABLES.custom.rho));
  const [customEpsTable, setCustomEpsTable] = useState(tableToText(MATERIAL_TABLES.custom.eps));
  const [usePdeSolver, setUsePdeSolver] = useState(false);
  const [solverSteps, setSolverSteps] = useState("160");
  const [secondaryRegion, setSecondaryRegion] = useState<RegionMaterial>({
    enabled: false,
    preset: "steel",
    centerX: "0.6",
    centerY: "0.0",
    centerZ: "0.0",
    radius: "0.4"
  });
  const [grid, setGrid] = useState("16");
  const [time, setTime] = useState(0.25);
  const [speed, setSpeed] = useState("1");
  const [view, setView] = useState<"split" | "volume" | "slice">("split");
  const [lockColorScale, setLockColorScale] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const preset = MATERIAL_PRESETS[materialPreset];
    if (preset?.k && preset?.rho && preset?.cp) {
      setConductivity(String(preset.k));
      setDensity(String(preset.rho));
      setHeatCapacity(String(preset.cp));
    }
  }, [materialPreset]);

  useEffect(() => {
    if (materialPreset === "custom") {
      return;
    }
    const tables = MATERIAL_TABLES[materialPreset];
    if (tables?.k?.length) {
      setCustomKTable(tableToText(tables.k));
    }
    if (tables?.cp?.length) {
      setCustomCpTable(tableToText(tables.cp));
    }
    if (tables?.rho?.length) {
      setCustomRhoTable(tableToText(tables.rho));
    }
    if (tables?.eps?.length) {
      setCustomEpsTable(tableToText(tables.eps));
    }
  }, [materialPreset]);

  useEffect(() => {
    if (!useDerivedAlpha) {
      return;
    }
    const kVal = Math.max(1e-6, Number(conductivity));
    const rhoVal = Math.max(0.1, Number(density));
    const cpVal = Math.max(1, Number(heatCapacity));
    const derived = kVal / (rhoVal * cpVal);
    if (Number.isFinite(derived)) {
      setAlpha(derived.toExponential(3));
      if (!anisotropic) {
        setAlphaX(derived.toExponential(3));
        setAlphaY(derived.toExponential(3));
        setAlphaZ(derived.toExponential(3));
      }
    }
  }, [useDerivedAlpha, conductivity, density, heatCapacity, anisotropic]);

  useEffect(() => {
    if (useTempDependentProps && !useDerivedAlpha) {
      setUseDerivedAlpha(true);
    }
  }, [useTempDependentProps, useDerivedAlpha]);

  useEffect(() => {
    (THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
    (THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;
    (THREE.Mesh.prototype as any).raycast = acceleratedRaycast;
  }, []);

  const extractGeometry = (root: THREE.Object3D): THREE.BufferGeometry | null => {
    const geometries: THREE.BufferGeometry[] = [];
    root.updateMatrixWorld(true);
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if ((mesh as any).isMesh && mesh.geometry) {
        const geom = mesh.geometry.clone();
        geom.applyMatrix4(mesh.matrixWorld);
        geometries.push(geom);
      }
    });
    if (!geometries.length) {
      return null;
    }
    const merged = mergeGeometries(geometries, false) ?? geometries[0];
    return merged;
  };

  const loadMeshFile = async (file: File | null) => {
    if (!file) {
      setMeshBase(null);
      setMeshGeometry(null);
      setMeshBounds(null);
      setMeshStatus("idle");
      setMeshError("");
      setMeshFileName("");
      return;
    }
    setMeshStatus("loading");
    setMeshError("");
    setMeshFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      let geometry: THREE.BufferGeometry | null = null;
      if (ext === "stl") {
        const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader");
        const buffer = await file.arrayBuffer();
        geometry = new STLLoader().parse(buffer);
      } else if (ext === "ply") {
        const { PLYLoader } = await import("three/examples/jsm/loaders/PLYLoader");
        const buffer = await file.arrayBuffer();
        geometry = new PLYLoader().parse(buffer);
      } else if (ext === "obj") {
        const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader");
        const text = await file.text();
        const object = new OBJLoader().parse(text);
        geometry = extractGeometry(object);
      } else if (ext === "glb" || ext === "gltf") {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
        const buffer = await file.arrayBuffer();
        const gltf = await new Promise<any>((resolve, reject) => {
          const loader = new GLTFLoader();
          loader.parse(buffer, "", resolve, reject);
        });
        geometry = extractGeometry(gltf.scene);
      }
      if (!geometry) {
        throw new Error("Mesh import failed (no geometry found).");
      }
      geometry.computeVertexNormals();
      setMeshBase(geometry);
      setMeshStatus("ready");
    } catch (error) {
      setMeshStatus("error");
      setMeshError(error instanceof Error ? error.message : "Mesh import failed.");
      setMeshBase(null);
      setMeshGeometry(null);
      setMeshBounds(null);
    }
  };

  useEffect(() => {
    if (!meshBase) {
      setMeshGeometry(null);
      setMeshBounds(null);
      meshRef.current = null;
      return;
    }
    const geom = meshBase.clone();
    geom.computeBoundingBox();
    const box = geom.boundingBox ?? new THREE.Box3();
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
    geom.center();
    let scale = Number(meshScale);
    if (meshFitToRadius) {
      const target = Math.max(1e-3, Number(objectRadius) * 2);
      scale = target / maxDim;
    }
    if (!Number.isFinite(scale) || scale <= 0) {
      scale = 1;
    }
    geom.scale(scale, scale, scale);
    const offsetX = Number(meshOffsetX) || 0;
    const offsetY = Number(meshOffsetY) || 0;
    const offsetZ = Number(meshOffsetZ) || 0;
    if (offsetX || offsetY || offsetZ) {
      geom.translate(offsetX, offsetY, offsetZ);
    }
    if ((geom as any).computeBoundsTree) {
      (geom as any).computeBoundsTree();
    }
    geom.computeBoundingBox();
    const finalBox = geom.boundingBox ?? new THREE.Box3();
    const finalSize = new THREE.Vector3();
    finalBox.getSize(finalSize);
    const finalMaxDim = Math.max(finalSize.x, finalSize.y, finalSize.z, 1e-6);
    meshRef.current = new THREE.Mesh(geom);
    setMeshGeometry(geom);
    setMeshBounds({
      min: [finalBox.min.x, finalBox.min.y, finalBox.min.z],
      max: [finalBox.max.x, finalBox.max.y, finalBox.max.z],
      maxDim: finalMaxDim
    });
  }, [meshBase, meshScale, meshFitToRadius, meshOffsetX, meshOffsetY, meshOffsetZ, objectRadius]);

  const updateSource = (index: number, patch: Partial<HeatSource>) => {
    setSources((prev) => prev.map((source, idx) => (idx === index ? { ...source, ...patch } : source)));
  };

  const updateSecondaryRegion = (patch: Partial<RegionMaterial>) => {
    setSecondaryRegion((prev) => ({ ...prev, ...patch }));
  };

  const {
    x,
    y,
    z,
    value,
    vMin,
    vMax,
    sliceX,
    sliceY,
    sliceZ,
    energy,
    kEff,
    cpEff,
    rhoEff,
    epsEff,
    alphaEff,
    alphaEffX,
    alphaEffY,
    alphaEffZ,
    biot,
    fourier,
    hEff,
    hRad,
    solverStable,
    solverStepsUsed
  } = useMemo(() => {
    let n = Math.min(22, Math.max(10, Math.floor(Number(grid))));
    if (n % 2 === 0) {
      n = n < 22 ? n + 1 : n - 1;
    }
    const tVal = Math.max(0.01, Number(time));
    const tObj = Number(objectTemp);
    const tEnv = Number(ambientTemp);
    const tEnvK = tempsInC ? tEnv + 273.15 : tEnv;
    const tObjK = tempsInC ? tObj + 273.15 : tObj;

    const radius0 = Math.max(0.05, Number(objectRadius));
    const meshActive = objectShape === "mesh" && meshGeometry && meshBounds && meshRef.current;
    const meshRadius = meshActive ? Math.max(0.05, meshBounds.maxDim / 2) : radius0;
    const refRadius = meshActive ? meshRadius : radius0;
    const half = Math.max(refRadius * 1.5, Number(domainHalf) || 1.2);
    const dx = (2 * half) / (n - 1);
    const dx2 = dx * dx;

    const conv = Math.max(0, Number(convectionCoeff));
    const qFlux = Number(surfaceFlux);
    const qDot = Number(volumetricHeat);
    const sigma = 5.670374e-8;

    const baseConst = {
      k: Math.max(1e-6, Number(conductivity)),
      cp: Math.max(1, Number(heatCapacity)),
      rho: Math.max(0.1, Number(density)),
      eps: clamp(Number(emissivity) || 0, 0, 1)
    };

    const presetToConst = (preset: MaterialPreset) => {
      const presetVals = MATERIAL_PRESETS[preset];
      return {
        k: Math.max(1e-6, Number(presetVals?.k ?? baseConst.k)),
        cp: Math.max(1, Number(presetVals?.cp ?? baseConst.cp)),
        rho: Math.max(0.1, Number(presetVals?.rho ?? baseConst.rho)),
        eps: baseConst.eps
      };
    };

    const baseTables = useTempDependentProps
      ? materialPreset === "custom"
        ? {
            k: parseTable(customKTable),
            cp: parseTable(customCpTable),
            rho: parseTable(customRhoTable),
            eps: parseTable(customEpsTable)
          }
        : MATERIAL_TABLES[materialPreset]
      : null;

    const secondaryTables = useTempDependentProps
      ? secondaryRegion.preset === "custom"
        ? {
            k: parseTable(customKTable),
            cp: parseTable(customCpTable),
            rho: parseTable(customRhoTable),
            eps: parseTable(customEpsTable)
          }
        : MATERIAL_TABLES[secondaryRegion.preset]
      : null;

    const basePresetConst = baseConst;
    const secondaryPresetConst = presetToConst(secondaryRegion.preset);

    const lookupProps = (
      tempK: number,
      tables: { k: TablePoint[]; cp: TablePoint[]; rho: TablePoint[]; eps: TablePoint[] } | null,
      constVals: { k: number; cp: number; rho: number; eps: number }
    ) => {
      if (!useTempDependentProps || !tables) {
        return { kVal: constVals.k, cpVal: constVals.cp, rhoVal: constVals.rho, epsVal: constVals.eps };
      }
      return {
        kVal: Math.max(1e-6, sampleTable(tables.k, tempK, constVals.k)),
        cpVal: Math.max(1, sampleTable(tables.cp, tempK, constVals.cp)),
        rhoVal: Math.max(0.1, sampleTable(tables.rho, tempK, constVals.rho)),
        epsVal: clamp(sampleTable(tables.eps, tempK, constVals.eps), 0, 1)
      };
    };

    const envProps = lookupProps(tEnvK, baseTables, basePresetConst);
    const hRadVal = includeRadiation ? 4 * envProps.epsVal * sigma * Math.pow(Math.max(tEnvK, 1), 3) : 0;
    const hTotal = conv + hRadVal;

    let kEff = basePresetConst.k;
    let cpEff = basePresetConst.cp;
    let rhoEff = basePresetConst.rho;
    let epsEff = basePresetConst.eps;
    let coreDelta = tObjK - tEnvK;

    if (includeRadiation && radiationModel === "full") {
      const steps = Math.max(20, Math.min(240, Math.floor(40 + tVal * 40)));
      const dt = tVal / steps;
      let coreK = tObjK;
      for (let i = 0; i < steps; i += 1) {
        const props = lookupProps(coreK, baseTables, basePresetConst);
        kEff = props.kVal;
        cpEff = props.cpVal;
        rhoEff = props.rhoVal;
        epsEff = props.epsVal;
        const qTerm =
          (3 * qFlux) / Math.max(1e-6, rhoEff * cpEff * refRadius) +
          (Number.isFinite(qDot) ? qDot / Math.max(1e-6, rhoEff * cpEff) : 0);
        const convTerm = (3 * conv) / Math.max(1e-6, rhoEff * cpEff * refRadius) * (coreK - tEnvK);
        const radTerm = includeRadiation
          ? (3 * epsEff * sigma) / Math.max(1e-6, rhoEff * cpEff * refRadius) * (coreK ** 4 - tEnvK ** 4)
          : 0;
        const dT = (qTerm - convTerm - radTerm) * dt;
        coreK += dT;
        if (!Number.isFinite(coreK)) {
          coreK = tEnvK;
          break;
        }
      }
      const propsFinal = lookupProps(coreK, baseTables, basePresetConst);
      kEff = propsFinal.kVal;
      cpEff = propsFinal.cpVal;
      rhoEff = propsFinal.rhoVal;
      epsEff = propsFinal.epsVal;
      coreDelta = coreK - tEnvK;
    } else {
      const propsInit = lookupProps(tObjK, baseTables, basePresetConst);
      kEff = propsInit.kVal;
      cpEff = propsInit.cpVal;
      rhoEff = propsInit.rhoVal;
      epsEff = propsInit.epsVal;
      const a = (3 * hTotal) / Math.max(1e-6, rhoEff * cpEff * refRadius);
      const decay = a > 0 ? Math.exp(-a * tVal) : 1;
      coreDelta = (tObjK - tEnvK) * decay;
      if (Number.isFinite(qFlux) && qFlux !== 0) {
        if (a > 0) {
          coreDelta += (3 * qFlux) / Math.max(1e-6, rhoEff * cpEff * refRadius * a) * (1 - decay);
        } else {
          coreDelta += (3 * qFlux * tVal) / Math.max(1e-6, rhoEff * cpEff * refRadius);
        }
      }
      if (Number.isFinite(qDot) && qDot !== 0) {
        if (a > 0) {
          coreDelta += (qDot / Math.max(1e-6, rhoEff * cpEff)) * (1 - decay) / a;
        } else {
          coreDelta += (qDot / Math.max(1e-6, rhoEff * cpEff)) * tVal;
        }
      }
      const coreK = tEnvK + coreDelta;
      const propsFinal = lookupProps(coreK, baseTables, basePresetConst);
      kEff = propsFinal.kVal;
      cpEff = propsFinal.cpVal;
      rhoEff = propsFinal.rhoVal;
      epsEff = propsFinal.epsVal;
    }

    const derivedAlpha = kEff / (rhoEff * cpEff);
    const alphaBase = useTempDependentProps || useDerivedAlpha ? derivedAlpha : Number(alpha);
    const alphaScaleX = Math.max(0.2, Number(alphaX) || 1);
    const alphaScaleY = Math.max(0.2, Number(alphaY) || 1);
    const alphaScaleZ = Math.max(0.2, Number(alphaZ) || 1);
    const alphaValX = Math.max(
      1e-9,
      anisotropic ? (useTempDependentProps ? alphaBase * alphaScaleX : Number(alphaX)) : alphaBase
    );
    const alphaValY = Math.max(
      1e-9,
      anisotropic ? (useTempDependentProps ? alphaBase * alphaScaleY : Number(alphaY)) : alphaBase
    );
    const alphaValZ = Math.max(
      1e-9,
      anisotropic ? (useTempDependentProps ? alphaBase * alphaScaleZ : Number(alphaZ)) : alphaBase
    );
    const alphaVal = (alphaValX + alphaValY + alphaValZ) / 3;

    const sourceDecay = sourceDecayWithConvection
      ? Math.exp(-((3 * hTotal) / Math.max(1e-6, rhoEff * cpEff * refRadius)) * tVal)
      : 1;

    const activeSources = sources
      .map((source) => ({
        enabled: source.enabled,
        x: Number(source.x),
        y: Number(source.y),
        z: Number(source.z),
        strength: Number(source.strength),
        radius: Math.max(0.05, Number(source.radius))
      }))
      .filter((source) => source.enabled && Number.isFinite(source.x) && Number.isFinite(source.strength));

    const coordsX: number[] = [];
    const coordsY: number[] = [];
    const coordsZ: number[] = [];
    const vals: number[] = [];
    const sliceVals: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const spacing = dx;
    const mid = Math.floor(n / 2);

    let minVal = Infinity;
    let maxVal = -Infinity;
    let energySum = 0;
    let solverStable = true;
    let solverStepsUsed = 0;

    if (usePdeSolver) {
      const total = n * n * n;
      const temp = new Float32Array(total);
      const next = new Float32Array(total);
      const idx = (i: number, j: number, k: number) => i + n * (j + n * k);
      const insideMask = new Uint8Array(total);

      const useMeshObject = meshActive && !!meshRef.current && !!meshBounds;
      const meshObject = meshRef.current;
      const meshMin = meshBounds?.min;
      const meshMax = meshBounds?.max;
      const raycaster = useMeshObject ? new THREE.Raycaster() : null;
      const rayOrigin = new THREE.Vector3();
      const rayDir = new THREE.Vector3(1, 0, 0);

      const isInsideMesh = (x: number, y: number, z: number) => {
        if (!meshObject || !meshMin || !meshMax || !raycaster) {
          return false;
        }
        if (x < meshMin[0] || x > meshMax[0] || y < meshMin[1] || y > meshMax[1] || z < meshMin[2] || z > meshMax[2]) {
          return false;
        }
        rayOrigin.set(x - 1e-6, y, z);
        raycaster.set(rayOrigin, rayDir);
        const hits = raycaster.intersectObject(meshObject, false);
        return hits.length % 2 === 1;
      };

      const isInside = (x: number, y: number, z: number) =>
        useMeshObject ? isInsideMesh(x, y, z) : x * x + y * y + z * z <= radius0 * radius0;

      const secEnabled = secondaryRegion.enabled;
      const secCx = Number(secondaryRegion.centerX);
      const secCy = Number(secondaryRegion.centerY);
      const secCz = Number(secondaryRegion.centerZ);
      const secR = Math.max(0.05, Number(secondaryRegion.radius));
      const secR2 = secR * secR;

      for (let i = 0; i < n; i += 1) {
        const xi = -half + (2 * half * i) / (n - 1);
        for (let j = 0; j < n; j += 1) {
          const yj = -half + (2 * half * j) / (n - 1);
          for (let k = 0; k < n; k += 1) {
            const zk = -half + (2 * half * k) / (n - 1);
            const id = idx(i, j, k);
            const inside = isInside(xi, yj, zk);
            insideMask[id] = inside ? 1 : 0;
            temp[id] = inside ? tObjK : tEnvK;
          }
        }
      }

      const baseAlpha = alphaBase;
      const secConst = secondaryPresetConst;
      const secTables = secondaryTables;

      const alphaMax = Math.max(alphaValX, alphaValY, alphaValZ, baseAlpha);
      const dtStable = dx2 / Math.max(1e-9, 2 * (alphaMax + alphaMax + alphaMax));
      const maxSteps = Math.max(40, Math.min(800, Math.floor(Number(solverSteps) || 160)));
      const requiredSteps = Math.max(1, Math.ceil(tVal / Math.max(1e-9, dtStable)));
      solverStepsUsed = Math.min(maxSteps, requiredSteps);
      solverStable = solverStepsUsed >= requiredSteps;
      const dt = tVal / solverStepsUsed;

      for (let step = 0; step < solverStepsUsed; step += 1) {
        for (let i = 0; i < n; i += 1) {
          const xi = -half + (2 * half * i) / (n - 1);
          const im = i === 0 ? i : i - 1;
          const ip = i === n - 1 ? i : i + 1;
          for (let j = 0; j < n; j += 1) {
            const yj = -half + (2 * half * j) / (n - 1);
            const jm = j === 0 ? j : j - 1;
            const jp = j === n - 1 ? j : j + 1;
            for (let k = 0; k < n; k += 1) {
              const zk = -half + (2 * half * k) / (n - 1);
              const km = k === 0 ? k : k - 1;
              const kp = k === n - 1 ? k : k + 1;
              const id = idx(i, j, k);
              const T = temp[id];
              const inSecondary = secEnabled
                ? (xi - secCx) * (xi - secCx) + (yj - secCy) * (yj - secCy) + (zk - secCz) * (zk - secCz) <= secR2
                : false;
              const props = inSecondary ? lookupProps(T, secTables, secConst) : lookupProps(T, baseTables, basePresetConst);
              const alphaLocal = props.kVal / (props.rhoVal * props.cpVal);
              const aX = anisotropic ? (useTempDependentProps ? alphaLocal * alphaScaleX : Number(alphaX)) : alphaLocal;
              const aY = anisotropic ? (useTempDependentProps ? alphaLocal * alphaScaleY : Number(alphaY)) : alphaLocal;
              const aZ = anisotropic ? (useTempDependentProps ? alphaLocal * alphaScaleZ : Number(alphaZ)) : alphaLocal;

              const Txx = (temp[idx(ip, j, k)] - 2 * T + temp[idx(im, j, k)]) / dx2;
              const Tyy = (temp[idx(i, jp, k)] - 2 * T + temp[idx(i, jm, k)]) / dx2;
              const Tzz = (temp[idx(i, j, kp)] - 2 * T + temp[idx(i, j, km)]) / dx2;
              let dTdt = aX * Txx + aY * Tyy + aZ * Tzz;

              if (Number.isFinite(qDot) && qDot !== 0) {
                dTdt += qDot / Math.max(1e-6, props.rhoVal * props.cpVal);
              }

              const inside = insideMask[id] === 1;
              if (inside) {
                const surface =
                  i === 0 ||
                  i === n - 1 ||
                  j === 0 ||
                  j === n - 1 ||
                  k === 0 ||
                  k === n - 1 ||
                  insideMask[idx(ip, j, k)] === 0 ||
                  insideMask[idx(im, j, k)] === 0 ||
                  insideMask[idx(i, jp, k)] === 0 ||
                  insideMask[idx(i, jm, k)] === 0 ||
                  insideMask[idx(i, j, kp)] === 0 ||
                  insideMask[idx(i, j, km)] === 0;
                if (surface) {
                  if (Number.isFinite(qFlux) && qFlux !== 0) {
                    dTdt += (3 * qFlux) / Math.max(1e-6, props.rhoVal * props.cpVal * refRadius);
                  }
                  const convTerm =
                    (3 * conv) / Math.max(1e-6, props.rhoVal * props.cpVal * refRadius) * (T - tEnvK);
                  const radTerm = includeRadiation
                    ? (3 * props.epsVal * sigma) / Math.max(1e-6, props.rhoVal * props.cpVal * refRadius) * (T ** 4 - tEnvK ** 4)
                    : 0;
                  dTdt -= convTerm + radTerm;
                }
              }

              for (const source of activeSources) {
                const dxs = xi - source.x;
                const dys = yj - source.y;
                const dzs = zk - source.z;
                const r2s = dxs * dxs + dys * dys + dzs * dzs;
                const sigmaS = Math.max(1e-6, source.radius * source.radius);
                const g = Math.exp(-r2s / (2 * sigmaS));
                dTdt += source.strength * g;
              }

              next[id] = T + dt * dTdt;
            }
          }
        }
        temp.set(next);
      }

      for (let i = 0; i < n; i += 1) {
        const xi = -half + (2 * half * i) / (n - 1);
        for (let j = 0; j < n; j += 1) {
          const yj = -half + (2 * half * j) / (n - 1);
          for (let k = 0; k < n; k += 1) {
            const zk = -half + (2 * half * k) / (n - 1);
            const id = i + n * (j + n * k);
            const tempK = temp[id];
            const tempDisplay = tempsInC ? tempK - 273.15 : tempK;
            coordsX.push(xi);
            coordsY.push(yj);
            coordsZ.push(zk);
            vals.push(tempDisplay);
            minVal = Math.min(minVal, tempDisplay);
            maxVal = Math.max(maxVal, tempDisplay);
            energySum += (tempK - tEnvK) * spacing * spacing * spacing;
            if (k === mid) {
              sliceVals[i][j] = tempDisplay;
            }
          }
        }
      }
    } else {
      const sigma2x = refRadius * refRadius + 4 * alphaValX * tVal;
      const sigma2y = refRadius * refRadius + 4 * alphaValY * tVal;
      const sigma2z = refRadius * refRadius + 4 * alphaValZ * tVal;
      const amp = Math.pow(refRadius * refRadius, 1.5) / Math.sqrt(sigma2x * sigma2y * sigma2z);

      for (let i = 0; i < n; i += 1) {
        const xi = -half + (2 * half * i) / (n - 1);
        for (let j = 0; j < n; j += 1) {
          const yj = -half + (2 * half * j) / (n - 1);
          for (let k = 0; k < n; k += 1) {
            const zk = -half + (2 * half * k) / (n - 1);
            const expArg = (xi * xi) / sigma2x + (yj * yj) / sigma2y + (zk * zk) / sigma2z;
            let valK = tEnvK + coreDelta * amp * Math.exp(-expArg);
            for (const source of activeSources) {
              const dxs = xi - source.x;
              const dys = yj - source.y;
              const dzs = zk - source.z;
              const sigma2s = source.radius * source.radius + 4 * alphaVal * tVal;
              const amps = Math.pow(source.radius * source.radius, 1.5) / Math.sqrt(sigma2s * sigma2s * sigma2s);
              const expSrc = (dxs * dxs + dys * dys + dzs * dzs) / sigma2s;
              valK += source.strength * sourceDecay * amps * Math.exp(-expSrc);
            }
            const valDisplay = tempsInC ? valK - 273.15 : valK;
            coordsX.push(xi);
            coordsY.push(yj);
            coordsZ.push(zk);
            vals.push(valDisplay);
            minVal = Math.min(minVal, valDisplay);
            maxVal = Math.max(maxVal, valDisplay);
            energySum += (valK - tEnvK) * spacing * spacing * spacing;
            if (k === mid) {
              sliceVals[i][j] = valDisplay;
            }
          }
        }
      }
    }

    const sliceAxis = Array.from({ length: n }, (_, idx) => -half + (2 * half * idx) / (n - 1));
    return {
      x: coordsX,
      y: coordsY,
      z: coordsZ,
      value: vals,
      vMin: minVal,
      vMax: maxVal,
      sliceX: sliceAxis,
      sliceY: sliceAxis,
      sliceZ: sliceVals,
      energy: energySum * rhoEff * cpEff,
      kEff,
      cpEff,
      rhoEff,
      epsEff,
      alphaEff: alphaVal,
      alphaEffX: alphaValX,
      alphaEffY: alphaValY,
      alphaEffZ: alphaValZ,
      biot: hTotal > 0 ? (hTotal * refRadius) / kEff : 0,
      fourier: (alphaVal * tVal) / (refRadius * refRadius),
      hEff: hTotal,
      hRad: hRadVal,
      solverStable,
      solverStepsUsed
    };
  }, [
    alpha,
    alphaX,
    alphaY,
    alphaZ,
    anisotropic,
    grid,
    time,
    objectTemp,
    ambientTemp,
    objectRadius,
    objectShape,
    meshGeometry,
    meshBounds,
    domainHalf,
    convectionCoeff,
    surfaceFlux,
    volumetricHeat,
    includeRadiation,
    radiationModel,
    emissivity,
    tempsInC,
    sourceDecayWithConvection,
    sources,
    useTempDependentProps,
    materialPreset,
    customKTable,
    customCpTable,
    customRhoTable,
    customEpsTable,
    usePdeSolver,
    solverSteps,
    secondaryRegion,
    conductivity,
    density,
    heatCapacity,
    useDerivedAlpha
  ]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    lastRef.current = null;
    const step = (now: number) => {
      const last = lastRef.current ?? now;
      const dt = (now - last) / 1000;
      lastRef.current = now;
      const rate = Number(speed);
      setTime((prev) => Math.max(0.02, prev + dt * (Number.isFinite(rate) ? rate : 1)));
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPlaying, speed]);

  const colorRange = useMemo(() => {
    const tObj = Number(objectTemp);
    const tEnv = Number(ambientTemp);
    if (!Number.isFinite(tObj) || !Number.isFinite(tEnv)) {
      return { min: vMin, max: vMax };
    }
    const lo = Math.min(tObj, tEnv);
    const hi = Math.max(tObj, tEnv);
    const span = Math.max(1, Math.abs(hi - lo));
    const pad = Math.max(1, span * 0.25);
    return { min: lo - pad, max: hi + pad };
  }, [objectTemp, ambientTemp, vMin, vMax]);

  const displayMin = lockColorScale && Number.isFinite(colorRange.min) ? colorRange.min : vMin;
  const displayMax = lockColorScale && Number.isFinite(colorRange.max) ? colorRange.max : vMax;
  const hasDisplayRange = Number.isFinite(displayMin) && Number.isFinite(displayMax) && displayMax > displayMin;
  const safeMin = Number.isFinite(vMin) ? vMin : 0;
  const safeMax = Number.isFinite(vMax) ? vMax : safeMin + 1;
  const isoMin = hasDisplayRange
    ? displayMin + (displayMax - displayMin) * 0.1
    : safeMin + (safeMax - safeMin) * 0.1;
  const isoMax = hasDisplayRange ? displayMax : safeMax;
  const hasVolumeData =
    x.length > 0 && y.length > 0 && z.length > 0 && value.length === x.length && Number.isFinite(safeMin) && Number.isFinite(safeMax);
  const hasSliceData = sliceX.length > 0 && sliceY.length > 0 && sliceZ.length > 0;

  return (
    <div className="demo-panel">
      <div className="demo-title">3D Heat Transfer Volume (GPU)</div>
      <div className="demo-grid">
        <label className="field">
          <span>material preset</span>
          <select value={materialPreset} onChange={(event) => setMaterialPreset(event.target.value as MaterialPreset)}>
            {Object.entries(MATERIAL_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>temperature-dependent k(T), cp(T), rho(T), eps(T)</span>
          <input
            type="checkbox"
            checked={useTempDependentProps}
            onChange={(event) => setUseTempDependentProps(event.target.checked)}
          />
        </label>
        <label className="field">
          <span>use transient PDE solver</span>
          <input
            type="checkbox"
            checked={usePdeSolver}
            onChange={(event) => setUsePdeSolver(event.target.checked)}
          />
        </label>
        <label className="field">
          <span>solver max steps</span>
          <input
            type="number"
            value={solverSteps}
            onChange={(event) => setSolverSteps(event.target.value)}
            step="1"
          />
        </label>
        <label className="field">
          <span>k (W/m-K)</span>
          <input
            type="number"
            value={conductivity}
            onChange={(event) => setConductivity(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>density rho (kg/m^3)</span>
          <input type="number" value={density} onChange={(event) => setDensity(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>heat capacity cp (J/kg-K)</span>
          <input
            type="number"
            value={heatCapacity}
            onChange={(event) => setHeatCapacity(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>derive alpha from k,rho,cp</span>
          <input
            type="checkbox"
            checked={useDerivedAlpha}
            onChange={(event) => setUseDerivedAlpha(event.target.checked)}
          />
        </label>
        <label className="field">
          <span>anisotropic alpha</span>
          <input
            type="checkbox"
            checked={anisotropic}
            onChange={(event) => setAnisotropic(event.target.checked)}
          />
        </label>
        <label className="field">
          <span>alpha (m^2/s)</span>
          <input
            type="number"
            value={alpha}
            onChange={(event) => setAlpha(event.target.value)}
            step="any"
            disabled={useDerivedAlpha || anisotropic}
          />
        </label>
        {anisotropic ? (
          <>
            <label className="field">
              <span>{useTempDependentProps ? "alpha_x multiplier" : "alpha_x (m^2/s)"}</span>
              <input
                type="number"
                value={alphaX}
                onChange={(event) => setAlphaX(event.target.value)}
                step="any"
                disabled={useDerivedAlpha && !useTempDependentProps}
              />
            </label>
            <label className="field">
              <span>{useTempDependentProps ? "alpha_y multiplier" : "alpha_y (m^2/s)"}</span>
              <input
                type="number"
                value={alphaY}
                onChange={(event) => setAlphaY(event.target.value)}
                step="any"
                disabled={useDerivedAlpha && !useTempDependentProps}
              />
            </label>
            <label className="field">
              <span>{useTempDependentProps ? "alpha_z multiplier" : "alpha_z (m^2/s)"}</span>
              <input
                type="number"
                value={alphaZ}
                onChange={(event) => setAlphaZ(event.target.value)}
                step="any"
                disabled={useDerivedAlpha && !useTempDependentProps}
              />
            </label>
          </>
        ) : null}
        <label className="field">
          <span>convection h (W/m^2-K)</span>
          <input
            type="number"
            value={convectionCoeff}
            onChange={(event) => setConvectionCoeff(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>volumetric heat q''' (W/m^3)</span>
          <input
            type="number"
            value={volumetricHeat}
            onChange={(event) => setVolumetricHeat(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>surface heat flux q'' (W/m^2)</span>
          <input
            type="number"
            value={surfaceFlux}
            onChange={(event) => setSurfaceFlux(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>include radiation</span>
          <input
            type="checkbox"
            checked={includeRadiation}
            onChange={(event) => setIncludeRadiation(event.target.checked)}
          />
        </label>
        <label className="field">
          <span>radiation model</span>
          <select value={radiationModel} onChange={(event) => setRadiationModel(event.target.value as RadiationModel)}>
            <option value="linearized">Linearized (fast)</option>
            <option value="full">Full T^4 (nonlinear)</option>
          </select>
        </label>
        <label className="field">
          <span>emissivity epsilon</span>
          <input
            type="number"
            min="0"
            max="1"
            value={emissivity}
            onChange={(event) => setEmissivity(event.target.value)}
            step="any"
          />
        </label>
        <label className="field">
          <span>temps in C</span>
          <input
            type="checkbox"
            checked={tempsInC}
            onChange={(event) => setTempsInC(event.target.checked)}
          />
        </label>
        <label className="field">
          <span>object temp</span>
          <input type="number" value={objectTemp} onChange={(event) => setObjectTemp(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>ambient temp</span>
          <input type="number" value={ambientTemp} onChange={(event) => setAmbientTemp(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>object radius</span>
          <input type="number" value={objectRadius} onChange={(event) => setObjectRadius(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>object shape</span>
          <select value={objectShape} onChange={(event) => setObjectShape(event.target.value as "sphere" | "mesh")}>
            <option value="sphere">Sphere (analytic + PDE)</option>
            <option value="mesh">Imported mesh (PDE only)</option>
          </select>
        </label>
        {objectShape === "mesh" ? (
          <>
            <label className="field">
              <span>import mesh (stl/obj/ply/glb/gltf)</span>
              <input
                type="file"
                accept=".stl,.obj,.ply,.glb,.gltf"
                onChange={(event) => loadMeshFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="field">
              <span>fit mesh to object radius</span>
              <input
                type="checkbox"
                checked={meshFitToRadius}
                onChange={(event) => setMeshFitToRadius(event.target.checked)}
              />
            </label>
            <label className="field">
              <span>mesh scale</span>
              <input
                type="number"
                value={meshScale}
                onChange={(event) => setMeshScale(event.target.value)}
                step="any"
                disabled={meshFitToRadius}
              />
            </label>
            <label className="field">
              <span>mesh offset x</span>
              <input type="number" value={meshOffsetX} onChange={(event) => setMeshOffsetX(event.target.value)} step="any" />
            </label>
            <label className="field">
              <span>mesh offset y</span>
              <input type="number" value={meshOffsetY} onChange={(event) => setMeshOffsetY(event.target.value)} step="any" />
            </label>
            <label className="field">
              <span>mesh offset z</span>
              <input type="number" value={meshOffsetZ} onChange={(event) => setMeshOffsetZ(event.target.value)} step="any" />
            </label>
          </>
        ) : null}
        <label className="field">
          <span>domain half size (m)</span>
          <input type="number" value={domainHalf} onChange={(event) => setDomainHalf(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>source decay w/ convection</span>
          <input
            type="checkbox"
            checked={sourceDecayWithConvection}
            onChange={(event) => setSourceDecayWithConvection(event.target.checked)}
          />
        </label>
        <label className="field">
          <span>grid</span>
          <input type="number" value={grid} onChange={(event) => setGrid(event.target.value)} step="1" />
        </label>
        <label className="field">
          <span>time</span>
          <input type="number" value={time} onChange={(event) => setTime(Number(event.target.value))} step="any" />
        </label>
        <label className="field">
          <span>speed</span>
          <input type="number" value={speed} onChange={(event) => setSpeed(event.target.value)} step="any" />
        </label>
        <label className="field">
          <span>view</span>
          <select value={view} onChange={(event) => setView(event.target.value as "split" | "volume" | "slice")}>
            <option value="split">Split</option>
            <option value="volume">Volume only</option>
            <option value="slice">Slice only</option>
          </select>
        </label>
        <label className="field">
          <span>lock color scale</span>
          <input
            type="checkbox"
            checked={lockColorScale}
            onChange={(event) => setLockColorScale(event.target.checked)}
          />
        </label>
      </div>
      {objectShape === "mesh" ? (
        <div className="demo-output">
          <div className="inline-kv">
            <span className={`pill ${meshStatus === "ready" ? "pill-good" : meshStatus === "error" ? "pill-bad" : ""}`}>
              mesh: {meshStatus}
            </span>
            {meshFileName ? <span className="pill">{meshFileName}</span> : null}
            {meshBounds ? <span className="pill">max dim: {meshBounds.maxDim.toFixed(3)} m</span> : null}
          </div>
          {meshError ? <div className="demo-note" style={{ color: "#b91c1c" }}>{meshError}</div> : null}
          {!usePdeSolver ? (
            <div className="demo-note">
              Mesh geometry is applied only in the PDE solver. Enable "use transient PDE solver" for mesh-based heat transfer.
            </div>
          ) : null}
        </div>
      ) : null}
      {useTempDependentProps ? (
        <div className="demo-output">
          <div className="demo-note">
            Temperature-dependent properties (k, cp, rho, eps) are sampled from tables (T in K). Preset tables are
            approximate; replace with your own measurements for high precision.
          </div>
          {materialPreset === "custom" ? (
            <div className="demo-grid" style={{ marginTop: "8px" }}>
              <label className="field">
                <span>k(T) table (K, W/m-K)</span>
                <textarea
                  value={customKTable}
                  onChange={(event) => setCustomKTable(event.target.value)}
                  rows={4}
                />
              </label>
              <label className="field">
                <span>cp(T) table (K, J/kg-K)</span>
                <textarea
                  value={customCpTable}
                  onChange={(event) => setCustomCpTable(event.target.value)}
                  rows={4}
                />
              </label>
              <label className="field">
                <span>rho(T) table (K, kg/m^3)</span>
                <textarea
                  value={customRhoTable}
                  onChange={(event) => setCustomRhoTable(event.target.value)}
                  rows={4}
                />
              </label>
              <label className="field">
                <span>eps(T) table (K, emissivity)</span>
                <textarea
                  value={customEpsTable}
                  onChange={(event) => setCustomEpsTable(event.target.value)}
                  rows={4}
                />
              </label>
            </div>
          ) : (
            <div className="demo-note">Using built-in k(T) and cp(T) tables for {MATERIAL_PRESETS[materialPreset].label}.</div>
          )}
          {anisotropic ? (
            <div className="demo-note">
              With temperature-dependent properties, alpha_x/alpha_y/alpha_z act as multipliers on alpha(T).
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="demo-output">
        <div className="inline-kv">
          <span className="pill">min = {Number.isFinite(vMin) ? vMin.toFixed(3) : "--"}</span>
          <span className="pill">max = {Number.isFinite(vMax) ? vMax.toFixed(3) : "--"}</span>
          <span className="pill">t = {Number.isFinite(time) ? time.toFixed(2) : "--"} s</span>
          <span className="pill">k = {Number.isFinite(kEff) ? kEff.toFixed(3) : "--"} W/m-K</span>
          <span className="pill">cp = {Number.isFinite(cpEff) ? cpEff.toFixed(1) : "--"} J/kg-K</span>
          <span className="pill">rho = {Number.isFinite(rhoEff) ? rhoEff.toFixed(1) : "--"} kg/m^3</span>
          <span className="pill">eps = {Number.isFinite(epsEff) ? epsEff.toFixed(3) : "--"}</span>
          <span className="pill">alpha = {Number.isFinite(alphaEff) ? alphaEff.toExponential(3) : "--"} m^2/s</span>
          {anisotropic ? (
            <>
              <span className="pill">alpha_x = {Number.isFinite(alphaEffX) ? alphaEffX.toExponential(3) : "--"}</span>
              <span className="pill">alpha_y = {Number.isFinite(alphaEffY) ? alphaEffY.toExponential(3) : "--"}</span>
              <span className="pill">alpha_z = {Number.isFinite(alphaEffZ) ? alphaEffZ.toExponential(3) : "--"}</span>
            </>
          ) : null}
          {usePdeSolver ? (
            <span className={`pill ${solverStable ? "pill-good" : "pill-bad"}`}>
              PDE steps: {solverStepsUsed} {solverStable ? "" : "(unstable)"}
            </span>
          ) : null}
          <span className="pill">h_eff = {Number.isFinite(hEff) ? hEff.toFixed(2) : "--"} W/m^2-K</span>
          <span className="pill">h_rad = {Number.isFinite(hRad) ? hRad.toFixed(2) : "--"} W/m^2-K</span>
          <span className="pill">Bi = {Number.isFinite(biot) ? biot.toFixed(3) : "--"}</span>
          <span className="pill">Fo = {Number.isFinite(fourier) ? fourier.toFixed(3) : "--"}</span>
          <span className="pill">thermal energy ~ {Number.isFinite(energy) ? energy.toFixed(2) : "--"} J</span>
        </div>
        {usePdeSolver && !solverStable ? (
          <div className="demo-note">
            PDE solver is running with fewer steps than the stability limit. Increase solver steps or lower grid/time for
            higher accuracy.
          </div>
        ) : null}
        <div className="demo-note">
          <MathInline
            latex={String.raw`T(\mathbf{r},t)=T_{\infty}+\Delta T_c(t)\left(\frac{R^2}{R^2+4\alpha t}\right)^{3/2}e^{-\frac{r^2}{R^2+4\alpha t}}`}
          />
        </div>
        <div className="demo-note">
          <MathInline
            latex={String.raw`\Delta T_c(t)=\left(T_0-T_{\infty}\right)e^{-a t}+\frac{3q''}{\rho c_p R a}\left(1-e^{-a t}\right),\;a=\frac{3(h+h_{rad})}{\rho c_p R}`}
          />
        </div>
        <div className="demo-note">
          <MathInline
            latex={String.raw`q''' \text{ adds } \frac{q'''}{\rho c_p} \text{ to } dT/dt,\;\; \alpha=\{ \alpha_x,\alpha_y,\alpha_z \} \text{ for anisotropic diffusion}`}
          />
        </div>
        <div className="demo-note">
          <MathInline latex={String.raw`k(T),\; c_p(T),\; \rho(T),\; \epsilon(T) \text{ are linearly interpolated from tables.}`} />
        </div>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={() => setIsPlaying((prev) => !prev)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="control-button secondary" onClick={() => setTime(0.25)}>
          Reset
        </button>
      </div>
      <div className={view === "split" ? "demo-stack" : ""}>
        {view !== "slice" ? (
          hasVolumeData ? (
          <PlotlyPlot
            data={[
              {
                type: "volume",
                x,
                y,
                z,
                value,
                opacity: 0.12,
                surface: { count: 10 },
                colorscale: "Turbo",
                cmin: hasDisplayRange ? displayMin : undefined,
                cmax: hasDisplayRange ? displayMax : undefined,
                isomin: isoMin,
                isomax: isoMax
              }
            ]}
            revision={time}
            layout={{
              datarevision: time,
              scene: {
                xaxis: { title: "x" },
                yaxis: { title: "y" },
                zaxis: { title: "z" },
                aspectmode: "data"
              }
            }}
            style={{ height: "520px" }}
          />
          ) : (
            <div className="demo-note">Waiting for heat field data...</div>
          )
        ) : null}
        {view !== "volume" ? (
          hasSliceData ? (
          <PlotlyPlot
            data={[
              {
                type: "heatmap",
                x: sliceX,
                y: sliceY,
                z: sliceZ,
                colorscale: "Turbo",
                zsmooth: "best",
                zmin: hasDisplayRange ? displayMin : undefined,
                zmax: hasDisplayRange ? displayMax : undefined
              }
            ]}
            revision={time}
            layout={{
              datarevision: time,
              xaxis: { title: "x", scaleanchor: "y", scaleratio: 1 },
              yaxis: { title: "y" }
            }}
            style={{ height: "520px" }}
          />
          ) : (
            <div className="demo-note">Waiting for heat slice data...</div>
          )
        ) : null}
      </div>
      <div className="demo-note">
        Uses a 3D heat diffusion kernel with an optional lumped convection decay term to reflect heat loss to the ambient.
      </div>
      <div className="demo-note">
        Radiation is linearized around the ambient temperature (using <span className="mono">h_rad=4*epsilon*sigma*T_inf^3</span>).
        Toggle "temps in C" off if you enter Kelvin directly.
      </div>
      <div className="demo-note">
        Point/patch heat sources are modeled as Gaussian blobs that diffuse over time (additional terms in the field).
      </div>
      <div className="demo-note">
        Anisotropic diffusion uses independent <span className="mono">alpha_x, alpha_y, alpha_z</span> with separate Gaussian widths.
      </div>
      <div className="demo-output">
        <div className="demo-note">Heat sources</div>
        {sources.map((source, idx) => (
          <div key={`src-${idx}`} className="demo-grid" style={{ marginTop: "6px" }}>
            <label className="field">
              <span>enable</span>
              <input
                type="checkbox"
                checked={source.enabled}
                onChange={(event) => updateSource(idx, { enabled: event.target.checked })}
              />
            </label>
            <label className="field">
              <span>x</span>
              <input
                type="number"
                value={source.x}
                onChange={(event) => updateSource(idx, { x: event.target.value })}
                step="any"
              />
            </label>
            <label className="field">
              <span>y</span>
              <input
                type="number"
                value={source.y}
                onChange={(event) => updateSource(idx, { y: event.target.value })}
                step="any"
              />
            </label>
            <label className="field">
              <span>z</span>
              <input
                type="number"
                value={source.z}
                onChange={(event) => updateSource(idx, { z: event.target.value })}
                step="any"
              />
            </label>
            <label className="field">
              <span>delta T strength</span>
              <input
                type="number"
                value={source.strength}
                onChange={(event) => updateSource(idx, { strength: event.target.value })}
                step="any"
              />
            </label>
            <label className="field">
              <span>radius</span>
              <input
                type="number"
                value={source.radius}
                onChange={(event) => updateSource(idx, { radius: event.target.value })}
                step="any"
              />
            </label>
          </div>
        ))}
      </div>
      <div className="demo-output">
        <div className="demo-note">Secondary material region (PDE solver only)</div>
        <div className="demo-grid" style={{ marginTop: "6px" }}>
          <label className="field">
            <span>enable</span>
            <input
              type="checkbox"
              checked={secondaryRegion.enabled}
              onChange={(event) => updateSecondaryRegion({ enabled: event.target.checked })}
            />
          </label>
          <label className="field">
            <span>preset</span>
            <select
              value={secondaryRegion.preset}
              onChange={(event) => updateSecondaryRegion({ preset: event.target.value as MaterialPreset })}
            >
              {Object.entries(MATERIAL_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>center x</span>
            <input
              type="number"
              value={secondaryRegion.centerX}
              onChange={(event) => updateSecondaryRegion({ centerX: event.target.value })}
              step="any"
            />
          </label>
          <label className="field">
            <span>center y</span>
            <input
              type="number"
              value={secondaryRegion.centerY}
              onChange={(event) => updateSecondaryRegion({ centerY: event.target.value })}
              step="any"
            />
          </label>
          <label className="field">
            <span>center z</span>
            <input
              type="number"
              value={secondaryRegion.centerZ}
              onChange={(event) => updateSecondaryRegion({ centerZ: event.target.value })}
              step="any"
            />
          </label>
          <label className="field">
            <span>radius</span>
            <input
              type="number"
              value={secondaryRegion.radius}
              onChange={(event) => updateSecondaryRegion({ radius: event.target.value })}
              step="any"
            />
          </label>
        </div>
        {!usePdeSolver ? <div className="demo-note">Enable the PDE solver to apply the secondary material region.</div> : null}
      </div>
    </div>
  );
}





