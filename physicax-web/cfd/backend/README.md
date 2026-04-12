# CFD Backend (LBM + OpenFOAM-ready)

This backend provides the PhysicaX CFD endpoints used by the browser and desktop app.

It exposes:

- `GET /status`
- `POST /flow`

The Next.js app calls it through `CFD_BACKEND_URL`.

## Quick start on Linux

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd physicax-web/cfd/backend
uvicorn app:app --host 0.0.0.0 --port 8000
```

Then set in `physicax-web/.env`:

```bash
CFD_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_CFD_BACKEND_URL="http://localhost:8000"
```

## If you are launching from this folder only

```bash
cd /path/to/PhysicaX/physicax-web/cfd/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## OpenFOAM integration (optional)

If you want full OpenFOAM results, export a sampled velocity field CSV and point the backend to it via `OPENFOAM_EXPORT_PATH`.

1. Export CSV with columns: `x,y,z,ux,uy,uz[,p]`
2. Set `OPENFOAM_EXPORT_PATH` in your environment.
3. Select `openfoam` in the 3D airflow UI.

Example:

```bash
OPENFOAM_EXPORT_PATH="/path/to/PhysicaX/physicax-web/cfd/openfoam/output/field.csv"
```

The backend will parse the CSV and stream it into the WebGL renderer.

## FluidX3D integration (optional)

FluidX3D exports volumetric fields as VTK (`.vtk` legacy or `.vti` XML image data). You can point the backend to the latest VTK file or upload it through the UI.

Option A: set a fixed path:

```bash
FLUIDX3D_FIELD_PATH="/path/to/fluidx3d/output/field.vtk"
```

Option B: allow the backend to launch FluidX3D:

```bash
FLUIDX3D_ALLOW_RUN=1
FLUIDX3D_RUN_COMMAND="/path/to/FluidX3D"
FLUIDX3D_WORKDIR="/path/to/fluidx3d"
```

Then select `CFD backend` + `FluidX3D field import` in the UI and click **Refresh CFD**.

Notes:

- FluidX3D is source-available for non-commercial use; run it separately and export the VTK field.
- The viewer expects a velocity vector field named `U` in the VTK data.
