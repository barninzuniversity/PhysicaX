from __future__ import annotations

import csv
import json
import math
import os
import shutil
import subprocess
import uuid
from datetime import datetime
from zipfile import ZipFile
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SOURCE_DIR = Path(__file__).resolve().parent
load_dotenv(SOURCE_DIR / ".env")

try:
    import trimesh  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    trimesh = None

class FlowRequest(BaseModel):
    engine: str = "lbm"
    flowSpeed: float = 1.2
    radius: float = 0.35
    resolution: int = 56
    steps: int = 220
    flowDir: Optional[List[float]] = None
    exportPath: Optional[str] = None
    meshId: Optional[str] = None


class QueueRequest(BaseModel):
    meshId: str
    notes: Optional[str] = None


class QueueUpdate(BaseModel):
    status: str


class CaseGenerateRequest(BaseModel):
    flowSpeed: float = 12.0
    nu: float = 1.5e-5
    overwrite: bool = False
    zip: bool = True
    flowDir: Optional[List[float]] = None
    angleOfAttack: float = 0.0
    bodyPitch: float = 0.0
    bodyRoll: float = 0.0
    density: float = 1.225
    referenceArea: float = 0.12
    turbulenceModel: Optional[str] = "laminar"


class CaseRunRequest(BaseModel):
    solver: str = "simpleFoam"
    useWsl: bool = True
    flowSpeed: float = 12.0
    nu: float = 1.5e-5
    overwrite: bool = False
    flowDir: Optional[List[float]] = None
    angleOfAttack: float = 0.0
    bodyPitch: float = 0.0
    bodyRoll: float = 0.0
    density: float = 1.225
    referenceArea: float = 0.12
    turbulenceModel: Optional[str] = "laminar"


OPENFOAM_EXPORT_PATH = os.getenv("OPENFOAM_EXPORT_PATH", "")
_openfoam_cache: Dict[str, object] = {"path": "", "mtime": 0.0, "field": None}
_queue: List[Dict[str, object]] = []
ALLOW_RUN = os.getenv("CFD_ALLOW_RUN", "0") == "1"
FLUIDX3D_FIELD_PATH = os.getenv("FLUIDX3D_FIELD_PATH", "")
FLUIDX3D_RUN_COMMAND = os.getenv("FLUIDX3D_RUN_COMMAND", "")
FLUIDX3D_WORKDIR = os.getenv("FLUIDX3D_WORKDIR", "")
FLUIDX3D_ALLOW_RUN = os.getenv("FLUIDX3D_ALLOW_RUN", "0") == "1"

DATA_DIR = Path(os.getenv("PHYSICAX_DATA_DIR", str(SOURCE_DIR))).expanduser()
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_MESH_EXTS = {".stl", ".obj", ".ply", ".glb", ".gltf"}

def _foam_header(obj_class: str, location: str, obj: str) -> str:
    return (
        "FoamFile\n"
        "{\n"
        "    version     2.0;\n"
        "    format      ascii;\n"
        f"    class       {obj_class};\n"
        f"    location    \"{location}\";\n"
        f"    object      {obj};\n"
        "}\n"
        "// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //\n\n"
    )


def _write_unix(path: Path, text: str) -> None:
    path.write_bytes(text.replace("\r\n", "\n").replace("\r", "\n").encode("utf-8"))


def _normalize_host_path(path_str: str) -> Path:
    raw = str(path_str or "").strip()
    if not raw:
        return Path()
    if os.name != "nt" and len(raw) > 1 and raw[1] == ":":
        drive = raw[0].lower()
        rest = raw[2:].replace("\\", "/")
        if not rest.startswith("/"):
            rest = "/" + rest
        return Path(f"/mnt/{drive}{rest}")
    return Path(raw)


def _sample_dict_from_bounds(
    start: List[float],
    end: List[float],
    npts: List[int],
    object_name: str = "sampleDict",
    label: str = "sampleDict",
) -> str:
    return (
        _foam_header("dictionary", "system", object_name)
        + f"/* Auto-generated {label} for PhysicaX */\n"
        "sample\n"
        "{\n"
        "    type            sets;\n"
        "    libs            (\"libsampling.so\");\n"
        "    interpolationScheme cellPoint;\n"
        "    setFormat       csv;\n\n"
        "    fields          (U p);\n\n"
        "    sets\n"
        "    (\n"
        "        uniformGrid\n"
        "        {\n"
        "            type        boxUniform;\n"
        f"            box         ({start[0]:.4f} {start[1]:.4f} {start[2]:.4f}) ({end[0]:.4f} {end[1]:.4f} {end[2]:.4f});\n"
        f"            nPoints     ({npts[0]} {npts[1]} {npts[2]});\n"
        "        }\n"
        "    );\n"
        "}\n"
    )


def _streamlines_dict_from_bounds(
    start: Tuple[float, float, float],
    end: Tuple[float, float, float],
    n_points: int,
    track_length: float,
) -> str:
    return (
        _foam_header("dictionary", "system", "streamlines")
        + "/* Auto-generated streamlines for PhysicaX */\n"
        + "type            streamlines;\n"
        + "libs            (\"libfieldFunctionObjects.so\");\n"
        + "setFormat       vtk;\n"
        + "U               U;\n"
        + "direction       both;\n"
        + "fields          (U p);\n"
        + "lifeTime        10000;\n"
        + f"trackLength     {track_length:.6f};\n"
        + "cloudName       particleTracks;\n"
        + "seedSampleSet\n"
        + "{\n"
        + "    type        lineUniform;\n"
        + "    axis        xyz;\n"
        + f"    start       ({start[0]:.4f} {start[1]:.4f} {start[2]:.4f});\n"
        + f"    end         ({end[0]:.4f} {end[1]:.4f} {end[2]:.4f});\n"
        + f"    nPoints     {n_points};\n"
        + "}\n"
    )


def _mesh_summary_from_mesh(mesh: "trimesh.Trimesh") -> Dict[str, object]:
    bounds = mesh.bounds.astype(float)
    min_b = bounds[0].tolist()
    max_b = bounds[1].tolist()
    size = (bounds[1] - bounds[0]).tolist()
    center = ((bounds[0] + bounds[1]) * 0.5).tolist()
    max_dim = float(max(size)) if size else 1.0
    pad = max_dim * 2.0

    start = [center[0] - pad, center[1] - pad, center[2] - pad]
    end = [center[0] + pad, center[1] + pad, center[2] + pad]
    nx = max(30, min(120, int(48 * (size[0] / max_dim if max_dim else 1))))
    ny = max(20, min(96, int(36 * (size[1] / max_dim if max_dim else 1))))
    nz = max(20, min(96, int(36 * (size[2] / max_dim if max_dim else 1))))
    sample_dict = _sample_dict_from_bounds(start, end, [nx, ny, nz])

    return {
        "bounds": {"min": min_b, "max": max_b},
        "size": size,
        "center": center,
        "maxDimension": max_dim,
        "suggestedGrid": {"start": start, "end": end, "nPoints": [nx, ny, nz]},
        "sampleDict": sample_dict,
    }


def _mesh_summary(path: Path) -> Dict[str, object]:
    if trimesh is None:
        raise RuntimeError("Mesh support requires trimesh. Please install backend requirements.")
    mesh = trimesh.load(path, force="mesh")
    if hasattr(mesh, "dump"):
        meshes = [m for m in mesh.dump() if getattr(m, "bounds", None) is not None]
        if meshes:
            mesh = trimesh.util.concatenate(meshes)
    if mesh.is_empty:
        raise ValueError("Mesh load produced no geometry.")
    return _mesh_summary_from_mesh(mesh)


def _load_mesh_meta(mesh_id: str) -> Dict[str, object]:
    meta_path = UPLOAD_DIR / mesh_id / "meta.json"
    if not meta_path.exists():
        raise FileNotFoundError(f"Mesh meta not found: {mesh_id}")
    return json.loads(meta_path.read_text())


def _openfoam_templates(
    meta: Dict[str, object],
    mesh_name: str = "model.stl",
    flow_speed: float = 12.0,
    density: float = 1.225,
    reference_area: float = 0.12,
    turbulence_model: Optional[str] = None,
) -> Dict[str, str]:
    grid = meta.get("suggestedGrid", {}) if isinstance(meta.get("suggestedGrid"), dict) else {}
    start = _coerce_triplet(grid.get("start"), [-4.0, -2.0, -2.0])
    end = _coerce_triplet(grid.get("end"), [4.0, 2.0, 2.0])
    npts = _coerce_int_triplet(grid.get("nPoints"), [32, 20, 20])
    center = _coerce_triplet(meta.get("center"), [(start[0] + end[0]) * 0.5, (start[1] + end[1]) * 0.5, (start[2] + end[2]) * 0.5])
    bounds = meta.get("bounds", {}) if isinstance(meta.get("bounds"), dict) else {}
    min_b = _coerce_triplet(bounds.get("min"), [center[0] - 1.0, center[1] - 1.0, center[2] - 1.0])
    max_b = _coerce_triplet(bounds.get("max"), [center[0] + 1.0, center[1] + 1.0, center[2] + 1.0])
    max_dim = float(meta.get("maxDimension", 0.0) or max(max_b[i] - min_b[i] for i in range(3)))
    if max_dim <= 0:
        max_dim = 1.0
    mesh_path = mesh_name
    domain_max = max(
        1.0,
        abs(end[0] - start[0]),
        abs(end[1] - start[1]),
        abs(end[2] - start[2]),
    )
    track_length = max(0.001, domain_max / 180.0)
    seed_ny = max(6, min(60, int(npts[1])))
    seed_nz = max(6, min(60, int(npts[2])))

    loc_x = max_b[0] + 0.2 * max_dim
    min_x = start[0] + 0.1 * max_dim
    max_x = end[0] - 0.1 * max_dim
    loc_x = min(max(loc_x, min_x), max_x)
    location_in_mesh = [loc_x, center[1], center[2]]

    flow_speed_mag = abs(flow_speed)
    l_ref = max(max_dim, 1e-3)

    span_x = abs(end[0] - start[0])
    span_y = abs(end[1] - start[1])
    span_z = abs(end[2] - start[2])
    seed_n = max(8, min(120, max(seed_ny, seed_nz)))
    seed_x = start[0] + 0.05 * span_x
    if span_z > span_y:
        seed_start = (seed_x, center[1], start[2])
        seed_end = (seed_x, center[1], end[2])
    else:
        seed_start = (seed_x, start[1], center[2])
        seed_end = (seed_x, end[1], center[2])

    control_dict = f"""{_foam_header("dictionary", "system", "controlDict")}/* Auto-generated controlDict (adjust as needed) */
application     simpleFoam;
startFrom       startTime;
startTime       0;
stopAt          endTime;
endTime         600;
deltaT          1;
writeControl    timeStep;
writeInterval   100;
purgeWrite      0;
writeFormat     ascii;
writePrecision  6;
writeCompression off;
timeFormat      general;
timePrecision   6;
runTimeModifiable yes;
functions
{{
    forceCoeffs
    {{
        type            forceCoeffs;
        libs            ("libforces.so");
        patches         (model);
        rho             rhoInf;
        rhoInf          {density:.4f};
        magUInf         {flow_speed_mag:.4f};
        lRef            {l_ref:.4f};
        Aref            {reference_area:.6f};
        CofR            ({center[0]:.4f} {center[1]:.4f} {center[2]:.4f});
        liftDir         (0 1 0);
        dragDir         (1 0 0);
        pitchAxis       (0 0 1);
        log             true;
        writeControl    timeStep;
        writeInterval   100;
    }}

    forces
    {{
        type            forces;
        libs            ("libforces.so");
        patches         (model);
        rho             rhoInf;
        rhoInf          {density:.4f};
        CofR            ({center[0]:.4f} {center[1]:.4f} {center[2]:.4f});
        log             true;
        writeControl    timeStep;
        writeInterval   100;
    }}
}}
"""

    fv_schemes = (
        _foam_header("dictionary", "system", "fvSchemes")
        + """/* Auto-generated fvSchemes (adjust as needed) */
ddtSchemes
{
    default         steadyState;
}
gradSchemes
{
    default         Gauss linear;
}
divSchemes
{
    div(phi,U)       bounded Gauss upwind;
    div(phi,k)       bounded Gauss upwind;
    div(phi,epsilon) bounded Gauss upwind;
    div(phi,omega)   bounded Gauss upwind;
    div((nuEff*dev2(T(grad(U))))) Gauss linear;
}
laplacianSchemes
{
    default         Gauss linear corrected;
}
interpolationSchemes
{
    default         linear;
}
snGradSchemes
{
    default         corrected;
}
"""
    )

    fv_solution = (
        _foam_header("dictionary", "system", "fvSolution")
        + """/* Auto-generated fvSolution (adjust as needed) */
solvers
{
    p
    {
        solver          GAMG;
        tolerance       1e-6;
        relTol          0.1;
        smoother        GaussSeidel;
    }
    U
    {
        solver          smoothSolver;
        tolerance       1e-6;
        relTol          0.1;
        smoother        GaussSeidel;
    }
    k
    {
        solver          smoothSolver;
        tolerance       1e-6;
        relTol          0.1;
        smoother        GaussSeidel;
    }
    epsilon
    {
        solver          smoothSolver;
        tolerance       1e-6;
        relTol          0.1;
        smoother        GaussSeidel;
    }
    omega
    {
        solver          smoothSolver;
        tolerance       1e-6;
        relTol          0.1;
        smoother        GaussSeidel;
    }
}
SIMPLE
{
    nNonOrthogonalCorrectors 0;
    residualControl
    {
        p               1e-4;
        U               1e-5;
        "(k|epsilon|omega)" 1e-5;
    }
}
relaxationFactors
{
    fields
    {
        p               0.3;
    }
    equations
    {
        U               0.7;
        k               0.7;
        epsilon         0.7;
        omega           0.7;
    }
}
"""
    )

    snappy = f"""{_foam_header("dictionary", "system", "snappyHexMeshDict")}/* Auto-generated snappyHexMeshDict (adjust as needed) */
castellatedMesh true;
snap            true;
addLayers       false;

geometry
{{
    model
    {{
        type triSurfaceMesh;
        file "{mesh_path}";
    }}
}}

castellatedMeshControls
{{
    maxLocalCells 1000000;
    maxGlobalCells 2000000;
    minRefinementCells 0;
    maxLoadUnbalance 0.10;
    nCellsBetweenLevels 3;
    resolveFeatureAngle 30;
    refinementSurfaces
    {{
        model
        {{
            level (3 4);
            patchInfo
            {{
                type wall;
            }}
        }}
    }}
    refinementRegions
    {{
    }}
    locationInMesh ({location_in_mesh[0]:.4f} {location_in_mesh[1]:.4f} {location_in_mesh[2]:.4f});
    allowFreeStandingZoneFaces true;
}}

snapControls
{{
    nSmoothPatch 3;
    tolerance 2.0;
    nSolveIter 30;
    nRelaxIter 5;
    nFeatureSnapIter 10;
    implicitFeatureSnap false;
    explicitFeatureSnap true;
    multiRegionFeatureSnap false;
}}

addLayersControls
{{
    relativeSizes true;
    layers
    {{
    }}
    expansionRatio 1.0;
    finalLayerThickness 0.3;
    minThickness 0.1;
    nGrow 0;
    featureAngle 60;
    slipFeatureAngle 30;
    nRelaxIter 3;
    nSmoothSurfaceNormals 1;
    nSmoothNormals 3;
    nSmoothThickness 10;
    maxFaceThicknessRatio 0.5;
    maxThicknessToMedialRatio 0.3;
    minMedianAxisAngle 90;
    nBufferCellsNoExtrude 0;
    nLayerIter 50;
}}

meshQualityControls
{{
    #includeEtc "caseDicts/mesh/generation/meshQualityDict"
}}

mergeTolerance 1e-6;
"""

    surface_extract = (
        _foam_header("dictionary", "system", "surfaceFeatureExtractDict")
        + """/* Auto-generated surfaceFeatureExtractDict */
model
{
    extractionMethod    extractFromSurface;
    extractFromSurfaceCoeffs
    {
        includedAngle   150;
    }
    writeObj            yes;
}
"""
    )

    sample_dict = meta.get("sampleDict")
    if not isinstance(sample_dict, str) or "FoamFile" not in sample_dict:
        sample_dict = _sample_dict_from_bounds(start, end, npts)
    sample_func = _sample_dict_from_bounds(start, end, npts, "sample", "sample")
    streamlines = _streamlines_dict_from_bounds(seed_start, seed_end, seed_n, track_length)

    return {
        "controlDict": control_dict,
        "fvSchemes": fv_schemes,
        "fvSolution": fv_solution,
        "snappyHexMeshDict": snappy,
        "surfaceFeatureExtractDict": surface_extract,
        "sampleDict": sample_dict,
        "sample": sample_func,
        "streamlines": streamlines,
    }


def _coerce_triplet(value: object, fallback: List[float]) -> List[float]:
    if isinstance(value, (list, tuple)) and len(value) >= 3:
        try:
            return [float(value[0]), float(value[1]), float(value[2])]
        except (TypeError, ValueError):
            return fallback
    return fallback


def _coerce_int_triplet(value: object, fallback: List[int]) -> List[int]:
    if isinstance(value, (list, tuple)) and len(value) >= 3:
        result = []
        for idx in range(3):
            try:
                result.append(int(float(value[idx])))
            except (TypeError, ValueError):
                result.append(fallback[idx])
        return result
    return fallback


def _normalize_vector(vec: Optional[List[float]], fallback: List[float]) -> List[float]:
    if not vec or len(vec) < 3:
        return fallback
    try:
        x = float(vec[0])
        y = float(vec[1])
        z = float(vec[2])
    except (TypeError, ValueError):
        return fallback
    norm = math.sqrt(x * x + y * y + z * z)
    if norm < 1e-8:
        return fallback
    return [x / norm, y / norm, z / norm]


def _rotation_matrix_from_vectors(a: List[float], b: List[float]) -> np.ndarray:
    a_vec = np.array(_normalize_vector(a, [1.0, 0.0, 0.0]), dtype=np.float64)
    b_vec = np.array(_normalize_vector(b, [1.0, 0.0, 0.0]), dtype=np.float64)
    c = float(np.dot(a_vec, b_vec))
    if c > 0.999999:
        return np.eye(3, dtype=np.float64)
    if c < -0.999999:
        # 180-degree rotation: pick a stable orthogonal axis
        axis = np.array([1.0, 0.0, 0.0], dtype=np.float64)
        if abs(a_vec[0]) > 0.9:
            axis = np.array([0.0, 1.0, 0.0], dtype=np.float64)
        v = np.cross(a_vec, axis)
        v /= np.linalg.norm(v) if np.linalg.norm(v) > 0 else 1.0
        return -np.eye(3, dtype=np.float64) + 2.0 * np.outer(v, v)
    v = np.cross(a_vec, b_vec)
    s = float(np.linalg.norm(v))
    if s < 1e-8:
        return np.eye(3, dtype=np.float64)
    vx = np.array(
        [
            [0.0, -v[2], v[1]],
            [v[2], 0.0, -v[0]],
            [-v[1], v[0], 0.0],
        ],
        dtype=np.float64,
    )
    return np.eye(3, dtype=np.float64) + vx + (vx @ vx) * ((1.0 - c) / (s * s))


def _rotation_matrix_from_euler(pitch: float, yaw: float, roll: float) -> np.ndarray:
    cp = math.cos(pitch)
    sp = math.sin(pitch)
    cy = math.cos(yaw)
    sy = math.sin(yaw)
    cr = math.cos(roll)
    sr = math.sin(roll)

    rx = np.array(
        [
            [1.0, 0.0, 0.0],
            [0.0, cp, -sp],
            [0.0, sp, cp],
        ],
        dtype=np.float64,
    )
    ry = np.array(
        [
            [cy, 0.0, sy],
            [0.0, 1.0, 0.0],
            [-sy, 0.0, cy],
        ],
        dtype=np.float64,
    )
    rz = np.array(
        [
            [cr, -sr, 0.0],
            [sr, cr, 0.0],
            [0.0, 0.0, 1.0],
        ],
        dtype=np.float64,
    )

    return rz @ ry @ rx


def _block_mesh_dict(meta: Dict[str, object]) -> str:
    grid = meta.get("suggestedGrid", {}) if isinstance(meta.get("suggestedGrid"), dict) else {}
    start = _coerce_triplet(grid.get("start"), [-6.0, -3.0, -3.0])
    end = _coerce_triplet(grid.get("end"), [6.0, 3.0, 3.0])
    npts = _coerce_int_triplet(grid.get("nPoints"), [48, 32, 32])
    cells = [max(10, npts[0] - 1), max(10, npts[1] - 1), max(10, npts[2] - 1)]

    x0, y0, z0 = start
    x1, y1, z1 = end

    return (
        _foam_header("dictionary", "system", "blockMeshDict")
        + "/* Auto-generated blockMeshDict */\n"
        + "convertToMeters 1;\n\n"
        + "vertices\n(\n"
        + f"    ({x0:.4f} {y0:.4f} {z0:.4f})\n"
        + f"    ({x1:.4f} {y0:.4f} {z0:.4f})\n"
        + f"    ({x1:.4f} {y1:.4f} {z0:.4f})\n"
        + f"    ({x0:.4f} {y1:.4f} {z0:.4f})\n"
        + f"    ({x0:.4f} {y0:.4f} {z1:.4f})\n"
        + f"    ({x1:.4f} {y0:.4f} {z1:.4f})\n"
        + f"    ({x1:.4f} {y1:.4f} {z1:.4f})\n"
        + f"    ({x0:.4f} {y1:.4f} {z1:.4f})\n"
        + ");\n\n"
        + "blocks\n(\n"
        + f"    hex (0 1 2 3 4 5 6 7) ({cells[0]} {cells[1]} {cells[2]}) simpleGrading (1 1 1)\n"
        + ");\n\n"
        + "edges ();\n\n"
        + "boundary\n(\n"
        + "    inlet\n    {\n        type patch;\n        faces ((0 3 7 4));\n    }\n"
        + "    outlet\n    {\n        type patch;\n        faces ((1 5 6 2));\n    }\n"
        + "    bottom\n    {\n        type symmetryPlane;\n        faces ((0 1 5 4));\n    }\n"
        + "    top\n    {\n        type symmetryPlane;\n        faces ((3 2 6 7));\n    }\n"
        + "    front\n    {\n        type symmetryPlane;\n        faces ((0 1 2 3));\n    }\n"
        + "    back\n    {\n        type symmetryPlane;\n        faces ((4 5 6 7));\n    }\n"
        + ");\n\n"
        + "mergePatchPairs ();\n"
    )


def _initial_u(flow_speed: float, direction: Optional[List[float]] = None) -> str:
    dir_vec = _normalize_vector(direction, [1.0, 0.0, 0.0])
    u_vec = [flow_speed * dir_vec[0], flow_speed * dir_vec[1], flow_speed * dir_vec[2]]
    return (
        _foam_header("volVectorField", "0", "U")
        + "/* Auto-generated U */\n"
        + "dimensions      [0 1 -1 0 0 0 0];\n"
        + f"internalField   uniform ({u_vec[0]:.4f} {u_vec[1]:.4f} {u_vec[2]:.4f});\n"
        + "boundaryField\n"
        + "{\n"
        + f"    inlet\n    {{\n        type fixedValue;\n        value uniform ({u_vec[0]:.4f} {u_vec[1]:.4f} {u_vec[2]:.4f});\n    }}\n"
        + "    outlet\n    {\n        type zeroGradient;\n    }\n"
        + "    bottom\n    {\n        type symmetryPlane;\n    }\n"
        + "    top\n    {\n        type symmetryPlane;\n    }\n"
        + "    front\n    {\n        type symmetryPlane;\n    }\n"
        + "    back\n    {\n        type symmetryPlane;\n    }\n"
        + "    model\n    {\n        type noSlip;\n    }\n"
        + "}\n"
    )


def _initial_p() -> str:
    return (
        _foam_header("volScalarField", "0", "p")
        + "/* Auto-generated p */\n"
        + "dimensions      [0 2 -2 0 0 0 0];\n"
        + "internalField   uniform 0;\n"
        + "boundaryField\n"
        + "{\n"
        + "    inlet\n    {\n        type zeroGradient;\n    }\n"
        + "    outlet\n    {\n        type fixedValue;\n        value uniform 0;\n    }\n"
        + "    bottom\n    {\n        type symmetryPlane;\n    }\n"
        + "    top\n    {\n        type symmetryPlane;\n    }\n"
        + "    front\n    {\n        type symmetryPlane;\n    }\n"
        + "    back\n    {\n        type symmetryPlane;\n    }\n"
        + "    model\n    {\n        type zeroGradient;\n    }\n"
        + "}\n"
    )


def _transport_properties(nu: float) -> str:
    return (
        _foam_header("dictionary", "constant", "transportProperties")
        + "/* Auto-generated transportProperties */\n"
        + "transportModel  Newtonian;\n"
        + f"nu              [0 2 -1 0 0 0 0] {nu:.6e};\n"
    )


def _normalize_turbulence_model(model: Optional[str]) -> str:
    value = (model or "laminar").strip().lower()
    if value in {"", "none", "laminar"}:
        return "laminar"
    if value in {"sst", "komegasst", "k-omega-sst", "k_omega_sst"}:
        return "sst"
    return "kepsilon"


def _turbulence_properties(model: Optional[str]) -> str:
    mode = _normalize_turbulence_model(model)
    if mode == "laminar":
        return (
            _foam_header("dictionary", "constant", "turbulenceProperties")
            + "/* Auto-generated turbulenceProperties */\n"
            + "simulationType laminar;\n"
        )
    model_name = "kOmegaSST" if mode == "sst" else "kEpsilon"
    return (
        _foam_header("dictionary", "constant", "turbulenceProperties")
        + "/* Auto-generated turbulenceProperties */\n"
        + "simulationType RAS;\n"
        + "RAS\n"
        + "{\n"
        + f"    RASModel        {model_name};\n"
        + "    turbulence      on;\n"
        + "    printCoeffs     on;\n"
        + "}\n"
    )


def _initial_k_epsilon_omega(flow_speed: float, length_scale: float) -> Tuple[float, float, float]:
    intensity = 0.05
    u = abs(flow_speed)
    k = max(1e-6, 1.5 * (u * intensity) ** 2)
    l_ref = max(length_scale * 0.07, 1e-3)
    c_mu = 0.09
    epsilon = max(1e-9, (c_mu ** 0.75) * (k ** 1.5) / l_ref)
    omega = max(1e-6, (k ** 0.5) / (c_mu ** 0.25 * l_ref))
    return k, epsilon, omega


def _initial_k(k: float) -> str:
    return (
        _foam_header("volScalarField", "0", "k")
        + "/* Auto-generated k */\n"
        + "dimensions      [0 2 -2 0 0 0 0];\n"
        + f"internalField   uniform {k:.6e};\n"
        + "boundaryField\n"
        + "{\n"
        + f"    inlet\n    {{\n        type fixedValue;\n        value uniform {k:.6e};\n    }}\n"
        + "    outlet\n    {\n        type zeroGradient;\n    }\n"
        + "    bottom\n    {\n        type symmetryPlane;\n    }\n"
        + "    top\n    {\n        type symmetryPlane;\n    }\n"
        + "    front\n    {\n        type symmetryPlane;\n    }\n"
        + "    back\n    {\n        type symmetryPlane;\n    }\n"
        + f"    model\n    {{\n        type kqRWallFunction;\n        value uniform {k:.6e};\n    }}\n"
        + "}\n"
    )


def _initial_epsilon(epsilon: float) -> str:
    return (
        _foam_header("volScalarField", "0", "epsilon")
        + "/* Auto-generated epsilon */\n"
        + "dimensions      [0 2 -3 0 0 0 0];\n"
        + f"internalField   uniform {epsilon:.6e};\n"
        + "boundaryField\n"
        + "{\n"
        + f"    inlet\n    {{\n        type fixedValue;\n        value uniform {epsilon:.6e};\n    }}\n"
        + "    outlet\n    {\n        type zeroGradient;\n    }\n"
        + "    bottom\n    {\n        type symmetryPlane;\n    }\n"
        + "    top\n    {\n        type symmetryPlane;\n    }\n"
        + "    front\n    {\n        type symmetryPlane;\n    }\n"
        + "    back\n    {\n        type symmetryPlane;\n    }\n"
        + f"    model\n    {{\n        type epsilonWallFunction;\n        value uniform {epsilon:.6e};\n    }}\n"
        + "}\n"
    )


def _initial_omega(omega: float) -> str:
    return (
        _foam_header("volScalarField", "0", "omega")
        + "/* Auto-generated omega */\n"
        + "dimensions      [0 0 -1 0 0 0 0];\n"
        + f"internalField   uniform {omega:.6e};\n"
        + "boundaryField\n"
        + "{\n"
        + f"    inlet\n    {{\n        type fixedValue;\n        value uniform {omega:.6e};\n    }}\n"
        + "    outlet\n    {\n        type zeroGradient;\n    }\n"
        + "    bottom\n    {\n        type symmetryPlane;\n    }\n"
        + "    top\n    {\n        type symmetryPlane;\n    }\n"
        + "    front\n    {\n        type symmetryPlane;\n    }\n"
        + "    back\n    {\n        type symmetryPlane;\n    }\n"
        + f"    model\n    {{\n        type omegaWallFunction;\n        value uniform {omega:.6e};\n    }}\n"
        + "}\n"
    )


def _initial_nut() -> str:
    return (
        _foam_header("volScalarField", "0", "nut")
        + "/* Auto-generated nut */\n"
        + "dimensions      [0 2 -1 0 0 0 0];\n"
        + "internalField   uniform 0;\n"
        + "boundaryField\n"
        + "{\n"
        + "    inlet\n    {\n        type fixedValue;\n        value uniform 0;\n    }\n"
        + "    outlet\n    {\n        type zeroGradient;\n    }\n"
        + "    bottom\n    {\n        type symmetryPlane;\n    }\n"
        + "    top\n    {\n        type symmetryPlane;\n    }\n"
        + "    front\n    {\n        type symmetryPlane;\n    }\n"
        + "    back\n    {\n        type symmetryPlane;\n    }\n"
        + "    model\n    {\n        type nutkWallFunction;\n        value uniform 0;\n    }\n"
        + "}\n"
    )


def _write_run_script(case_dir: Path) -> Path:
    script_path = case_dir / "run_openfoam.sh"
    _write_unix(
        script_path,
        "#!/usr/bin/env bash\n"
        "set -e\n"
        "cd \"$(dirname \"$0\")\"\n"
        "FOAM_BASHRC=\"${CFD_OPENFOAM_BASHRC:-${CFD_WSL_INIT:-}}\"\n"
        "if [ -z \"$FOAM_BASHRC\" ]; then\n"
        "  for candidate in /opt/openfoam10/etc/bashrc /opt/openfoam11/etc/bashrc /opt/openfoam12/etc/bashrc; do\n"
        "    if [ -f \"$candidate\" ]; then\n"
        "      FOAM_BASHRC=\"$candidate\"\n"
        "      break\n"
        "    fi\n"
        "  done\n"
        "fi\n"
        "if [ -n \"$FOAM_BASHRC\" ] && [ -f \"$FOAM_BASHRC\" ]; then\n"
        "  set +e\n"
        "  . \"$FOAM_BASHRC\"\n"
        "  set -e\n"
        "fi\n"
        "command -v blockMesh >/dev/null 2>&1 || { echo \"OpenFOAM tools not found in PATH.\"; exit 127; }\n"
        "blockMesh\n"
        "surfaceFeatureExtract || true\n"
        "snappyHexMesh -overwrite || snappyHexMesh\n"
        "if command -v potentialFoam >/dev/null 2>&1; then\n"
        "  potentialFoam -writePhi || true\n"
        "fi\n"
        "simpleFoam\n"
        "if [ -f system/sample ]; then\n"
        "  postProcess -latestTime -func sample || true\n"
        "elif [ -f system/sampleDict ]; then\n"
        "  sample -latestTime || true\n"
        "fi\n"
        "if [ -f system/streamlines ]; then\n"
        "  postProcess -latestTime -func streamlines || true\n"
        "fi\n",
    )
    return script_path


def _ensure_case(
    mesh_id: str,
    meta: Dict[str, object],
    flow_speed: float,
    nu: float,
    overwrite: bool,
    flow_dir: Optional[List[float]] = None,
    angle_of_attack: float = 0.0,
    body_pitch: float = 0.0,
    body_roll: float = 0.0,
    density: float = 1.225,
    reference_area: float = 0.12,
    turbulence_model: Optional[str] = None,
) -> Dict[str, str]:
    mesh_dir = UPLOAD_DIR / mesh_id
    case_dir = mesh_dir / "case"
    if overwrite and case_dir.exists():
        shutil.rmtree(case_dir)
    case_dir.mkdir(parents=True, exist_ok=True)

    system_dir = case_dir / "system"
    constant_dir = case_dir / "constant"
    tri_dir = constant_dir / "triSurface"
    zero_dir = case_dir / "0"
    system_dir.mkdir(exist_ok=True)
    constant_dir.mkdir(exist_ok=True)
    tri_dir.mkdir(parents=True, exist_ok=True)
    zero_dir.mkdir(exist_ok=True)

    mesh_source = _normalize_host_path(str(meta.get("path", "")))
    if not mesh_source.exists():
        raise FileNotFoundError("Mesh file not found for case generation.")
    mesh_target = tri_dir / "model.stl"

    if trimesh is None:
        raise RuntimeError("Mesh conversion requires trimesh. Please install backend requirements.")

    mesh = trimesh.load(mesh_source, force="mesh")
    if hasattr(mesh, "dump"):
        meshes = [m for m in mesh.dump() if getattr(m, "bounds", None) is not None]
        if meshes:
            mesh = trimesh.util.concatenate(meshes)
    if mesh.is_empty:
        raise ValueError("Mesh conversion produced empty geometry.")

    flow_dir_vec = _normalize_vector(flow_dir, [1.0, 0.0, 0.0])
    pitch = math.radians(body_pitch or 0.0)
    yaw = math.radians(angle_of_attack or 0.0)
    roll = math.radians(body_roll or 0.0)
    r_body = _rotation_matrix_from_euler(pitch, yaw, roll)
    r_align = _rotation_matrix_from_vectors(flow_dir_vec, [1.0, 0.0, 0.0])
    r_total = r_align @ r_body
    if not np.allclose(r_total, np.eye(3), atol=1e-6):
        transform = np.eye(4, dtype=np.float64)
        transform[:3, :3] = r_total
        mesh.apply_transform(transform)

    bounds = mesh.bounds.astype(float)
    max_dim_before = float(np.max(bounds[1] - bounds[0])) if bounds.size else 0.0
    unit_scale = 1.0
    if max_dim_before > 100.0:
        # Many CAD/STL exports arrive in millimeters; OpenFOAM expects SI units.
        unit_scale = 0.001
        mesh.apply_scale(unit_scale)

    case_meta = dict(meta)
    case_meta.update(_mesh_summary_from_mesh(mesh))
    case_meta["unitScale"] = unit_scale

    mesh.export(mesh_target)

    templates = _openfoam_templates(
        case_meta,
        mesh_name="model.stl",
        flow_speed=flow_speed,
        density=density,
        reference_area=reference_area,
        turbulence_model=turbulence_model,
    )
    _write_unix(system_dir / "controlDict", templates["controlDict"])
    _write_unix(system_dir / "fvSchemes", templates["fvSchemes"])
    _write_unix(system_dir / "fvSolution", templates["fvSolution"])
    _write_unix(system_dir / "snappyHexMeshDict", templates["snappyHexMeshDict"])
    _write_unix(system_dir / "surfaceFeatureExtractDict", templates["surfaceFeatureExtractDict"])
    _write_unix(system_dir / "sampleDict", templates["sampleDict"])
    _write_unix(system_dir / "sample", templates["sample"])
    _write_unix(system_dir / "streamlines", templates["streamlines"])
    _write_unix(system_dir / "blockMeshDict", _block_mesh_dict(case_meta))

    _write_unix(zero_dir / "U", _initial_u(flow_speed, [1.0, 0.0, 0.0]))
    _write_unix(zero_dir / "p", _initial_p())
    _write_unix(constant_dir / "transportProperties", _transport_properties(nu))
    turb_mode = _normalize_turbulence_model(turbulence_model)
    _write_unix(constant_dir / "turbulenceProperties", _turbulence_properties(turbulence_model))

    if turb_mode != "laminar":
        max_dim = float(case_meta.get("maxDimension", 1.0) or 1.0)
        k_val, eps_val, omega_val = _initial_k_epsilon_omega(flow_speed, max_dim)
        _write_unix(zero_dir / "k", _initial_k(k_val))
        _write_unix(zero_dir / "nut", _initial_nut())
        if turb_mode == "sst":
            _write_unix(zero_dir / "omega", _initial_omega(omega_val))
        else:
            _write_unix(zero_dir / "epsilon", _initial_epsilon(eps_val))

    run_script = _write_run_script(case_dir)

    return {"casePath": str(case_dir), "runScript": str(run_script)}


def _zip_case(case_dir: Path, mesh_id: str) -> Path:
    zip_path = case_dir.parent / f"case-{mesh_id}.zip"
    with ZipFile(zip_path, "w") as handle:
        for file_path in case_dir.rglob("*"):
            if file_path.is_file():
                handle.write(file_path, file_path.relative_to(case_dir))
    return zip_path


def _to_wsl_path(path: Path) -> str:
    posix = path.as_posix()
    if len(posix) > 1 and posix[1] == ":":
        drive = posix[0].lower()
        rest = posix[2:]
        if not rest.startswith("/"):
            rest = "/" + rest
        return f"/mnt/{drive}{rest}"
    return posix


def _build_run_command(case_dir: Path, use_wsl: bool) -> List[str]:
    run_script = case_dir / "run_openfoam.sh"
    if os.name == "nt" and use_wsl:
        wsl_path = _to_wsl_path(run_script)
        distro = os.getenv("CFD_WSL_DISTRO", "")
        wsl_init = os.getenv("CFD_WSL_INIT", "").strip()
        cmd = ["wsl"]
        if distro:
            cmd += ["-d", distro]
        if wsl_init:
            cmd += ["--", "bash", "-lc", f"source {wsl_init} && bash {wsl_path}"]
        else:
            cmd += ["--", "bash", "-lc", f"bash {wsl_path}"]
        return cmd
    return ["bash", str(run_script)]


def _lbm_field(flow_speed: float, radius: float, resolution: int, steps: int) -> Dict[str, object]:
    nx = int(max(30, min(120, resolution)))
    ny = int(max(20, min(80, math.floor(nx * 0.55))))
    nz = 8
    lx = 8.0
    ly = 4.0
    origin = (-lx / 2, -ly / 2, -1.5)
    spacing = lx / (nx - 1)

    # LBM parameters (stabilized)
    u_in = max(-0.02, min(0.02, flow_speed * 0.02))
    tau = 0.75
    omega = 1.0 / tau

    c = np.array(
        [
            [0, 0],
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 1],
            [-1, 1],
            [-1, -1],
            [1, -1],
        ],
        dtype=np.int32,
    )
    w = np.array([4 / 9] + [1 / 9] * 4 + [1 / 36] * 4, dtype=np.float32)

    # grid in world space for obstacle mask
    x = np.linspace(origin[0], origin[0] + lx, nx)
    y = np.linspace(origin[1], origin[1] + ly, ny)
    X, Y = np.meshgrid(x, y, indexing="ij")
    obstacle = (X**2 + Y**2) <= radius**2

    rho = np.ones((nx, ny), dtype=np.float32)
    u = np.zeros((nx, ny, 2), dtype=np.float32)
    u[:, :, 0] = u_in

    def equilibrium(rho_field: np.ndarray, u_field: np.ndarray) -> np.ndarray:
        rho_field = np.clip(rho_field, 1e-6, 10.0)
        u_field = np.clip(u_field, -0.2, 0.2)
        u_sq = u_field[:, :, 0] ** 2 + u_field[:, :, 1] ** 2
        nx_local, ny_local = rho_field.shape
        feq = np.zeros((nx_local, ny_local, 9), dtype=np.float32)
        for i in range(9):
            cu = u_field[:, :, 0] * c[i, 0] + u_field[:, :, 1] * c[i, 1]
            feq[:, :, i] = w[i] * rho_field * (1 + 3 * cu + 4.5 * cu**2 - 1.5 * u_sq)
        feq = np.nan_to_num(feq, nan=0.0, posinf=0.0, neginf=0.0)
        feq = np.clip(feq, 0.0, 10.0)
        return feq

    f = equilibrium(rho, u)

    for _ in range(int(max(60, min(700, steps)))):
        # collision
        if not np.isfinite(f).all():
            f = np.nan_to_num(f, nan=0.0, posinf=0.0, neginf=0.0)
        feq = equilibrium(rho, u)
        f += omega * (feq - f)
        f = np.clip(f, 0.0, 10.0)

        # streaming
        for i in range(9):
            f[:, :, i] = np.roll(f[:, :, i], c[i, 0], axis=0)
            f[:, :, i] = np.roll(f[:, :, i], c[i, 1], axis=1)

        # bounce-back on obstacle
        f[obstacle, 1], f[obstacle, 3] = f[obstacle, 3], f[obstacle, 1].copy()
        f[obstacle, 2], f[obstacle, 4] = f[obstacle, 4], f[obstacle, 2].copy()
        f[obstacle, 5], f[obstacle, 7] = f[obstacle, 7], f[obstacle, 5].copy()
        f[obstacle, 6], f[obstacle, 8] = f[obstacle, 8], f[obstacle, 6].copy()

        # macroscopic
        rho = np.sum(f, axis=2)
        rho_safe = np.where(rho < 1e-6, 1e-6, rho)
        u[:, :, 0] = (f[:, :, 1] + f[:, :, 5] + f[:, :, 8] - (f[:, :, 3] + f[:, :, 6] + f[:, :, 7])) / rho_safe
        u[:, :, 1] = (f[:, :, 2] + f[:, :, 5] + f[:, :, 6] - (f[:, :, 4] + f[:, :, 7] + f[:, :, 8])) / rho_safe
        u = np.nan_to_num(u, nan=0.0, posinf=0.0, neginf=0.0)
        u = np.clip(u, -0.2, 0.2)
        rho = np.clip(rho, 1e-6, 10.0)

        # inlet boundary (left)
        u[0, :, 0] = u_in
        u[0, :, 1] = 0
        rho[0, :] = 1
        f[0, :, :] = equilibrium(rho[0:1, :], u[0:1, :, :])[0]

        # outlet (right) zero gradient
        f[-1, :, :] = f[-2, :, :]

    # scale velocity to desired flow_speed
    inflow = float(np.mean(u[0, :, 0]))
    scale = flow_speed / inflow if abs(inflow) > 1e-6 else 1.0
    u *= scale

    ux: List[float] = []
    uy: List[float] = []
    uz: List[float] = []
    for k in range(nz):
        for j in range(ny):
            for i in range(nx):
                ux.append(float(u[i, j, 0]))
                uy.append(float(u[i, j, 1]))
                uz.append(0.0)

    return {
        "nx": nx,
        "ny": ny,
        "nz": nz,
        "origin": [origin[0], origin[1], origin[2]],
        "spacing": spacing,
        "ux": ux,
        "uy": uy,
        "uz": uz,
    }


def _read_openfoam_csv(
    path: Path,
) -> Tuple[List[float], List[float], List[float], List[float], List[float], List[float], List[float]]:
    xs: List[float] = []
    ys: List[float] = []
    zs: List[float] = []
    uxs: List[float] = []
    uys: List[float] = []
    uzs: List[float] = []
    ps: List[float] = []

    with path.open("r", newline="") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if not row:
                continue
            line = " ".join(row).strip()
            if not line or line.startswith("#"):
                continue
            parts = line.replace(",", " ").split()
            if len(parts) < 6:
                continue
            try:
                vals = [float(parts[i]) for i in range(min(len(parts), 7))]
            except ValueError:
                continue
            xs.append(vals[0])
            ys.append(vals[1])
            zs.append(vals[2])
            uxs.append(vals[3])
            uys.append(vals[4])
            uzs.append(vals[5])
            if len(vals) >= 7:
                ps.append(vals[6])

    return xs, ys, zs, uxs, uys, uzs, ps


def _read_openfoam_scalar_csv(path: Path) -> Tuple[List[float], List[float], List[float], List[float]]:
    xs: List[float] = []
    ys: List[float] = []
    zs: List[float] = []
    ps: List[float] = []

    with path.open("r", newline="") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if not row:
                continue
            line = " ".join(row).strip()
            if not line or line.startswith("#"):
                continue
            parts = line.replace(",", " ").split()
            if len(parts) < 4:
                continue
            try:
                vals = [float(parts[i]) for i in range(4)]
            except ValueError:
                continue
            xs.append(vals[0])
            ys.append(vals[1])
            zs.append(vals[2])
            ps.append(vals[3])

    return xs, ys, zs, ps


def _peek_csv_columns(path: Path) -> int:
    try:
        with path.open("r", newline="") as handle:
            for row in handle:
                line = row.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.replace(",", " ").split()
                return len(parts)
    except Exception:
        return 0
    return 0


def _find_openfoam_samples(case_dir: Path) -> Tuple[Optional[Path], Optional[Path]]:
    post_dir = case_dir / "postProcessing"
    if not post_dir.exists():
        return None, None
    candidates = list(post_dir.rglob("*.csv"))
    if not candidates:
        return None, None

    # Prefer combined files that already include pressure (7+ columns).
    combined = []
    for path in candidates:
        if _peek_csv_columns(path) >= 7:
            combined.append(path)
    if combined:
        combined.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        return combined[0], None

    # Otherwise try to pair vector (U) and scalar (p) CSVs.
    u_files: List[Path] = []
    p_files: List[Path] = []
    for path in candidates:
        name = path.name.lower()
        if name.endswith("_u.csv") or name.endswith("u.csv"):
            u_files.append(path)
        if name.endswith("_p.csv") or name.endswith("p.csv"):
            p_files.append(path)

    def base_name(path: Path) -> str:
        stem = path.stem
        if stem.lower().endswith("_u"):
            return stem[:-2]
        if stem.lower().endswith("_p"):
            return stem[:-2]
        if stem.lower().endswith("u"):
            return stem[:-1]
        if stem.lower().endswith("p"):
            return stem[:-1]
        return stem

    p_map = {base_name(p): p for p in p_files}
    pair_candidates: List[Tuple[Path, Optional[Path]]] = []
    for u_path in u_files:
        base = base_name(u_path)
        pair_candidates.append((u_path, p_map.get(base)))

    if pair_candidates:
        pair_candidates.sort(
            key=lambda pair: max(
                pair[0].stat().st_mtime,
                pair[1].stat().st_mtime if pair[1] else 0,
            ),
            reverse=True,
        )
        return pair_candidates[0]

    # Fallback: just take most recent CSV (likely U only).
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0], None


def _openfoam_field(path_str: str, p_path_str: Optional[str] = None) -> Dict[str, object]:
    path = Path(path_str).expanduser()
    p_path = Path(p_path_str).expanduser() if p_path_str else None

    if path.exists() and path.is_dir():
        sample_path, sample_p = _find_openfoam_samples(path)
        if not sample_path:
            raise FileNotFoundError(f"No OpenFOAM samples found in {path}")
        path = sample_path
        if sample_p:
            p_path = sample_p

    if not path.exists():
        raise FileNotFoundError(f"OpenFOAM export not found: {path}")

    stat = path.stat()
    p_stat = p_path.stat() if p_path and p_path.exists() else None
    cached_path = str(_openfoam_cache.get("path", ""))
    cached_mtime_val = float(_openfoam_cache.get("mtime", 0.0))
    cache_key = f"{path}|{p_path}" if p_path else str(path)
    cache_mtime = max(stat.st_mtime, p_stat.st_mtime if p_stat else 0)
    if cached_path == cache_key and abs(cache_mtime - cached_mtime_val) < 1e-6:
        cached_field = _openfoam_cache.get("field")
        if cached_field:
            return cached_field  # type: ignore[return-value]

    xs, ys, zs, uxs, uys, uzs, ps = _read_openfoam_csv(path)
    if p_path and p_path.exists():
        px, py, pz, ps_vals = _read_openfoam_scalar_csv(p_path)
        if len(ps_vals) == len(xs):
            ps = ps_vals
        elif len(ps_vals):
            # Fallback to scalar file even if counts mismatch (best effort).
            ps = ps_vals
    if not xs:
        raise ValueError("OpenFOAM export file has no usable data.")

    max_points = 220000
    if len(xs) > max_points:
        stride = max(1, len(xs) // max_points)
        xs = xs[::stride]
        ys = ys[::stride]
        zs = zs[::stride]
        uxs = uxs[::stride]
        uys = uys[::stride]
        uzs = uzs[::stride]
        if ps:
            ps = ps[::stride]

    def key(value: float) -> float:
        return round(value, 5)

    x_unique = sorted({key(v) for v in xs})
    y_unique = sorted({key(v) for v in ys})
    z_unique = sorted({key(v) for v in zs})

    nx = len(x_unique)
    ny = len(y_unique)
    nz = len(z_unique)
    origin = [min(x_unique), min(y_unique), min(z_unique)]
    spacing = 1.0
    if nx > 1:
        spacing = min(abs(x_unique[i + 1] - x_unique[i]) for i in range(nx - 1))

    xi = {val: idx for idx, val in enumerate(x_unique)}
    yi = {val: idx for idx, val in enumerate(y_unique)}
    zi = {val: idx for idx, val in enumerate(z_unique)}

    total = nx * ny * nz
    ux = [0.0] * total
    uy = [0.0] * total
    uz = [0.0] * total
    p = [0.0] * total if ps else None

    for idx in range(len(xs)):
        i = xi.get(key(xs[idx]))
        j = yi.get(key(ys[idx]))
        k = zi.get(key(zs[idx]))
        if i is None or j is None or k is None:
            continue
        flat = i + nx * (j + ny * k)
        ux[flat] = float(uxs[idx])
        uy[flat] = float(uys[idx])
        uz[flat] = float(uzs[idx])
        if p is not None and idx < len(ps):
            p[flat] = float(ps[idx])

    field = {
        "nx": nx,
        "ny": ny,
        "nz": nz,
        "origin": origin,
        "spacing": spacing,
        "ux": ux,
        "uy": uy,
        "uz": uz,
    }
    if p is not None:
        field["p"] = p

    _openfoam_cache["path"] = cache_key
    _openfoam_cache["mtime"] = cache_mtime
    _openfoam_cache["field"] = field

    return field


def _read_vtk_field(path_str: str) -> Dict[str, object]:
    path = Path(path_str).expanduser()
    if not path.exists():
        raise FileNotFoundError(f"FluidX3D field not found: {path}")

    with path.open("rb") as handle:
        header1 = handle.readline()
        if not header1:
            raise ValueError("VTK file is empty.")
        handle.readline()  # title
        format_line = handle.readline().decode("utf-8", errors="ignore").strip().upper()
        is_binary = "BINARY" in format_line

        nx = ny = nz = 0
        origin = [0.0, 0.0, 0.0]
        spacing = [1.0, 1.0, 1.0]
        point_count = 0
        vectors: Optional[np.ndarray] = None
        p_values: Optional[np.ndarray] = None

        def _skip_ws():
            while True:
                pos = handle.tell()
                chunk = handle.read(1)
                if not chunk:
                    return
                if chunk > b" ":
                    handle.seek(pos)
                    return

        def _read_ascii(count: int) -> np.ndarray:
            values: List[float] = []
            while len(values) < count:
                line = handle.readline()
                if not line:
                    break
                text = line.decode("utf-8", errors="ignore").strip()
                if not text:
                    continue
                values.extend(float(part) for part in text.split())
            return np.array(values[:count], dtype=np.float32)

        def _read_binary(count: int, dtype: str) -> np.ndarray:
            _skip_ws()
            dtype = dtype.lower()
            dt = np.dtype(">f4")
            if "double" in dtype or "float64" in dtype:
                dt = np.dtype(">f8")
            data = np.fromfile(handle, dtype=dt, count=count)
            return data.astype(np.float32, copy=False)

        while True:
            pos = handle.tell()
            line = handle.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="ignore").strip()
            if not text:
                continue
            upper = text.upper()
            parts = text.split()
            if upper.startswith("DIMENSIONS") and len(parts) >= 4:
                nx, ny, nz = (int(parts[1]), int(parts[2]), int(parts[3]))
                point_count = nx * ny * nz
            elif upper.startswith("ORIGIN") and len(parts) >= 4:
                origin = [float(parts[1]), float(parts[2]), float(parts[3])]
            elif upper.startswith("SPACING") or upper.startswith("ASPECT_RATIO"):
                if len(parts) >= 4:
                    spacing = [float(parts[1]), float(parts[2]), float(parts[3])]
            elif upper.startswith("POINT_DATA") and len(parts) >= 2:
                point_count = int(parts[1])
            elif upper.startswith("VECTORS") and len(parts) >= 3:
                dtype = parts[2]
                if point_count <= 0:
                    raise ValueError("VTK POINT_DATA missing before VECTORS.")
                vectors = _read_binary(point_count * 3, dtype) if is_binary else _read_ascii(point_count * 3)
            elif upper.startswith("SCALARS") and len(parts) >= 3:
                name = parts[1].lower()
                dtype = parts[2]
                # skip lookup table line
                handle.readline()
                data = _read_binary(point_count, dtype) if is_binary else _read_ascii(point_count)
                if name in {"p", "pressure", "press", "cp"}:
                    p_values = data
            else:
                handle.seek(pos)
                handle.readline()

    if not vectors or point_count <= 0 or nx <= 0:
        raise ValueError("VTK field missing dimensions or vectors.")

    ux = vectors[0::3].tolist()
    uy = vectors[1::3].tolist()
    uz = vectors[2::3].tolist()
    field = {
        "nx": nx,
        "ny": ny,
        "nz": nz,
        "origin": origin,
        "spacing": float(sum(spacing) / 3.0),
        "ux": ux,
        "uy": uy,
        "uz": uz,
    }
    if p_values is not None and len(p_values) >= point_count:
        field["p"] = p_values.tolist()
    return field


def _find_streamlines(case_dir: Path) -> Optional[Path]:
    post_dir = case_dir / "postProcessing"
    if not post_dir.exists():
        return None
    candidates: List[Path] = []
    for ext in ("*.vtk", "*.vtp"):
        candidates.extend(post_dir.rglob(ext))
    if not candidates:
        return None
    filtered = [
        path for path in candidates if "streamline" in path.as_posix().lower()
    ]
    if filtered:
        return max(filtered, key=lambda path: path.stat().st_mtime)
    return max(candidates, key=lambda path: path.stat().st_mtime)


@app.post("/mesh")
async def upload_mesh(file: UploadFile = File(...)) -> Dict[str, object]:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_MESH_EXTS:
        return {"error": f"Unsupported mesh format {ext}. Use: {', '.join(sorted(ALLOWED_MESH_EXTS))}"}
    mesh_id = uuid.uuid4().hex[:10]
    mesh_dir = UPLOAD_DIR / mesh_id
    mesh_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"model{ext}"
    target = mesh_dir / safe_name

    data = await file.read()
    target.write_bytes(data)

    meta = _mesh_summary(target)
    meta["meshId"] = mesh_id
    meta["filename"] = file.filename
    meta["path"] = str(target)
    meta["sampleDictPath"] = str(mesh_dir / "sampleDict")

    (mesh_dir / "sampleDict").write_text(meta["sampleDict"])
    (mesh_dir / "meta.json").write_text(json.dumps(meta, indent=2))
    return meta


@app.get("/mesh/{mesh_id}")
def mesh_download(mesh_id: str):
    try:
        meta = _load_mesh_meta(mesh_id)
        path = _normalize_host_path(str(meta.get("path", "")))
        if not path.exists():
            return {"error": "Mesh file not found."}
        return FileResponse(path, filename=str(meta.get("filename") or path.name))
    except Exception as exc:
        return {"error": str(exc)}


@app.get("/mesh/{mesh_id}/meta")
def mesh_meta(mesh_id: str) -> Dict[str, object]:
    try:
        meta = _load_mesh_meta(mesh_id)
        return meta
    except Exception as exc:
        return {"error": str(exc)}


@app.get("/case/{mesh_id}")
def case_templates(mesh_id: str) -> Dict[str, object]:
    try:
        meta = _load_mesh_meta(mesh_id)
        templates = _openfoam_templates(meta)
        return {"meshId": mesh_id, "templates": templates}
    except Exception as exc:
        return {"error": str(exc)}


@app.post("/case/{mesh_id}/generate")
def case_generate(mesh_id: str, req: CaseGenerateRequest) -> Dict[str, object]:
    try:
        meta = _load_mesh_meta(mesh_id)
        output = _ensure_case(
            mesh_id,
            meta,
            req.flowSpeed,
            req.nu,
            req.overwrite,
            flow_dir=req.flowDir,
            angle_of_attack=req.angleOfAttack,
            body_pitch=req.bodyPitch,
            body_roll=req.bodyRoll,
            density=req.density,
            reference_area=req.referenceArea,
            turbulence_model=req.turbulenceModel,
        )
        case_dir = Path(output["casePath"])
        zip_path = _zip_case(case_dir, mesh_id) if req.zip else None
        return {
            "meshId": mesh_id,
            "casePath": output["casePath"],
            "runScript": output["runScript"],
            "zipPath": str(zip_path) if zip_path else "",
        }
    except Exception as exc:
        return {"error": str(exc)}


@app.get("/case/{mesh_id}/download")
def case_download(mesh_id: str):
    try:
        case_dir = UPLOAD_DIR / mesh_id / "case"
        if not case_dir.exists():
            return {"error": "Case not generated yet."}
        zip_path = _zip_case(case_dir, mesh_id)
        return FileResponse(zip_path, filename=f"physicax-case-{mesh_id}.zip")
    except Exception as exc:
        return {"error": str(exc)}


@app.get("/case/{mesh_id}/streamlines")
def case_streamlines(mesh_id: str) -> Dict[str, object]:
    try:
        case_dir = UPLOAD_DIR / mesh_id / "case"
        if not case_dir.exists():
            return {"error": "Case not generated yet."}
        stream_file = _find_streamlines(case_dir)
        if not stream_file:
            return {"error": "Streamlines not found. Run the OpenFOAM pipeline for this case first."}
        stat = stream_file.stat()
        return {
            "meshId": mesh_id,
            "path": str(stream_file),
            "filename": stream_file.name,
            "mtime": stat.st_mtime,
            "size": stat.st_size,
        }
    except Exception as exc:
        return {"error": str(exc)}


@app.get("/case/{mesh_id}/streamlines/download")
def case_streamlines_download(mesh_id: str):
    try:
        case_dir = UPLOAD_DIR / mesh_id / "case"
        if not case_dir.exists():
            return {"error": "Case not generated yet."}
        stream_file = _find_streamlines(case_dir)
        if not stream_file:
            return {"error": "Streamlines not found."}
        return FileResponse(stream_file, filename=stream_file.name)
    except Exception as exc:
        return {"error": str(exc)}


@app.get("/case/{mesh_id}/log")
def case_run_log(mesh_id: str, tail: int = 200) -> Dict[str, object]:
    try:
        case_dir = UPLOAD_DIR / mesh_id / "case"
        log_path = case_dir / "run.log"
        if not log_path.exists():
            return {"error": "run.log not found. Run the OpenFOAM pipeline first."}
        raw = log_path.read_text(errors="ignore").splitlines()
        limit = max(20, min(int(tail) if tail else 200, 2000))
        lines = raw[-limit:] if len(raw) > limit else raw
        return {"meshId": mesh_id, "lines": lines, "tail": limit}
    except Exception as exc:
        return {"error": str(exc)}


@app.post("/case/{mesh_id}/run")
def case_run(mesh_id: str, req: CaseRunRequest) -> Dict[str, object]:
    try:
        meta = _load_mesh_meta(mesh_id)
        output = _ensure_case(
            mesh_id,
            meta,
            req.flowSpeed,
            req.nu,
            req.overwrite,
            flow_dir=req.flowDir,
            angle_of_attack=req.angleOfAttack,
            body_pitch=req.bodyPitch,
            body_roll=req.bodyRoll,
            density=req.density,
            reference_area=req.referenceArea,
            turbulence_model=req.turbulenceModel,
        )
        case_dir = Path(output["casePath"])
        command = _build_run_command(case_dir, req.useWsl)
        if not ALLOW_RUN:
            return {"error": "CFD_ALLOW_RUN=1 is required to run from the backend.", "command": command}
        log_path = case_dir / "run.log"
        log_handle = log_path.open("ab")
        subprocess.Popen(
            command,
            cwd=str(case_dir),
            stdout=log_handle,
            stderr=log_handle,
            start_new_session=True,
        )
        return {"status": "started", "command": command, "casePath": str(case_dir), "logPath": str(log_path)}
    except Exception as exc:
        return {"error": str(exc)}


@app.get("/queue")
def queue_list() -> Dict[str, object]:
    return {"jobs": _queue}


@app.post("/queue")
def queue_create(req: QueueRequest) -> Dict[str, object]:
    job_id = uuid.uuid4().hex[:10]
    job = {
        "id": job_id,
        "meshId": req.meshId,
        "status": "pending",
        "notes": req.notes or "",
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
    _queue.insert(0, job)
    return {"job": job}


@app.post("/queue/{job_id}")
def queue_update(job_id: str, req: QueueUpdate) -> Dict[str, object]:
    for job in _queue:
        if job.get("id") == job_id:
            job["status"] = req.status
            return {"job": job}
    return {"error": "Job not found"}


@app.get("/status")
def status(meshId: Optional[str] = None) -> Dict[str, object]:
    openfoam_path = OPENFOAM_EXPORT_PATH
    openfoam_pressure_path = None
    if meshId:
        case_dir = UPLOAD_DIR / meshId / "case"
        if case_dir.exists():
            sample_path, sample_p = _find_openfoam_samples(case_dir)
            if sample_path:
                openfoam_path = str(sample_path)
            if sample_p:
                openfoam_pressure_path = str(sample_p)
    openfoam_ready = bool(openfoam_path and Path(openfoam_path).exists())
    openfoam_mtime = None
    openfoam_size = None
    if openfoam_ready:
        stat = Path(openfoam_path).stat()
        openfoam_mtime = stat.st_mtime
        openfoam_size = stat.st_size
    if openfoam_pressure_path and Path(openfoam_pressure_path).exists():
        stat = Path(openfoam_pressure_path).stat()
        openfoam_mtime = max(openfoam_mtime or 0, stat.st_mtime)
        openfoam_size = (openfoam_size or 0) + stat.st_size
    fluidx3d_path = FLUIDX3D_FIELD_PATH
    if meshId:
        mesh_dir = UPLOAD_DIR / meshId
        if mesh_dir.exists():
            candidates = list(mesh_dir.rglob("*.vtk")) + list(mesh_dir.rglob("*.vti"))
            if candidates:
                fluidx3d_path = str(max(candidates, key=lambda p: p.stat().st_mtime))
    fluidx3d_ready = bool(fluidx3d_path and Path(fluidx3d_path).exists())
    fluidx3d_mtime = None
    fluidx3d_size = None
    if fluidx3d_ready:
        stat = Path(fluidx3d_path).stat()
        fluidx3d_mtime = stat.st_mtime
        fluidx3d_size = stat.st_size
    return {
        "status": "ready",
        "backend": "lbm",
        "openfoam": "ready" if openfoam_ready else "missing",
        "openfoamPath": openfoam_path,
        "openfoamPressurePath": openfoam_pressure_path,
        "openfoamMtime": openfoam_mtime,
        "openfoamSize": openfoam_size,
        "fluidx3d": "ready" if fluidx3d_ready else "missing",
        "fluidx3dPath": fluidx3d_path,
        "fluidx3dMtime": fluidx3d_mtime,
        "fluidx3dSize": fluidx3d_size,
    }


@app.post("/flow")
def flow(req: FlowRequest) -> Dict[str, object]:
    engine = (req.engine or "lbm").lower()
    if engine == "fluidx3d":
        field_path = req.exportPath or FLUIDX3D_FIELD_PATH
        if FLUIDX3D_ALLOW_RUN and FLUIDX3D_RUN_COMMAND:
            command = FLUIDX3D_RUN_COMMAND.format(meshId=req.meshId or "")
            try:
                subprocess.run(
                    command,
                    cwd=FLUIDX3D_WORKDIR or None,
                    shell=True,
                    check=False,
                    timeout=1800,
                )
            except Exception as exc:
                return {"source": "fluidx3d", "error": f"FluidX3D run failed: {exc}"}
        if not field_path and req.meshId:
            mesh_dir = UPLOAD_DIR / req.meshId
            if mesh_dir.exists():
                candidates = list(mesh_dir.rglob("*.vtk")) + list(mesh_dir.rglob("*.vti"))
                if candidates:
                    field_path = str(max(candidates, key=lambda p: p.stat().st_mtime))
        if not field_path:
            # Fallback to internal LBM preview so the UI still has an immediate field.
            field = _lbm_field(req.flowSpeed, req.radius, req.resolution, req.steps)
            return {
                "source": "fluidx3d-preview",
                "field": field,
                "note": "FluidX3D not configured; using LBM preview."
            }
        try:
            field = _read_vtk_field(field_path)
            return {"source": "fluidx3d", "field": field, "path": field_path}
        except Exception as exc:
            return {"source": "fluidx3d", "error": str(exc)}
    if engine == "openfoam":
        export_path = req.exportPath or OPENFOAM_EXPORT_PATH
        p_path: Optional[str] = None
        if not export_path and req.meshId:
            case_dir = UPLOAD_DIR / req.meshId / "case"
            if case_dir.exists():
                sample_path, sample_p = _find_openfoam_samples(case_dir)
                if sample_path:
                    export_path = str(sample_path)
                if sample_p:
                    p_path = str(sample_p)
        if not export_path:
            return {"source": "openfoam", "error": "OpenFOAM export path not set or not found."}
        try:
            field = _openfoam_field(export_path, p_path)
            return {"source": "openfoam", "field": field}
        except Exception as exc:
            return {"source": "openfoam", "error": str(exc)}

    field = _lbm_field(req.flowSpeed, req.radius, req.resolution, req.steps)
    return {"source": "lbm", "field": field}
