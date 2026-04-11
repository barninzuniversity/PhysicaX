# CFD Backend (LBM + OpenFOAM-ready)

This backend provides a real CFD-style velocity field via Lattice Boltzmann (LBM).
It exposes:

- `GET /status`
- `POST /flow`

The Next.js app calls it through `CFD_BACKEND_URL`.

## Quick start (local)
```powershell
cd C:\Users\ibzao\Downloads\Project\physicax-web\cfd\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Then set in `C:\Users\ibzao\Downloads\Project\physicax-web\.env`:
```
CFD_BACKEND_URL="http://localhost:8000"
```

## OpenFOAM integration (optional)
If you want full OpenFOAM results, export a sampled velocity field (CSV)
and point the backend to it via `OPENFOAM_EXPORT_PATH`.

1. Export CSV with columns: `x,y,z,ux,uy,uz`
2. Set `OPENFOAM_EXPORT_PATH` in your environment.
3. Select `openfoam` in the 3D airflow UI.

The backend will parse the CSV and stream it into the WebGL renderer.

## FluidX3D integration (recommended for max realism)
FluidX3D exports volumetric fields as VTK (`.vtk` legacy or `.vti` XML image data). You can point the backend to the
latest VTK file or upload it through the UI.

Option A: set a fixed path in `cfd/backend/.env`:
```
FLUIDX3D_FIELD_PATH=C:\path\to\fluidx3d\output\field.vtk
```

Option B: allow the backend to launch FluidX3D (advanced):
```
FLUIDX3D_ALLOW_RUN=1
FLUIDX3D_RUN_COMMAND=C:\path\to\FluidX3D.exe
FLUIDX3D_WORKDIR=C:\path\to\FluidX3D
```

Then select `CFD backend` + `FluidX3D field import` in the UI and click **Refresh CFD**.

Notes:
- FluidX3D is source-available for non-commercial use; run it separately and export the VTK field.
- The viewer expects a velocity vector field named `U` in the VTK data.
