# PhysicaX CFD Backend (Option B)

This project can optionally connect to a real CFD solver for high-fidelity airflow.
The Next.js app reads `CFD_BACKEND_URL` and will call:

- `GET /status` to confirm readiness
- `POST /flow` to request a vector field
- `POST /mesh` to upload a mesh and generate a tailored `sampleDict`
- `GET /mesh/{mesh_id}` to download the uploaded mesh (used by the VTK streamtube view)
- `POST /case/{mesh_id}/generate` to build a full OpenFOAM case folder
- `GET /case/{mesh_id}/download` to grab a ZIP of the generated case
- `POST /case/{mesh_id}/run` to launch a WSL run (optional)
- `GET /case/{mesh_id}/streamlines` to locate the latest OpenFOAM streamlines file (VTK/VTP)
- `GET /case/{mesh_id}/streamlines/download` to download the streamlines file

## Recommended stack (WSL2 + OpenFOAM)
1. Install WSL2 (Ubuntu).
2. Install OpenFOAM inside WSL.
3. Run a case and export a velocity field.
4. Expose a small API that returns the field as JSON.

If you prefer Docker or Python/FEniCS, adjust the service but keep the same endpoints.

## Quick API contract
`GET /status` should return:
```
{ "status": "ready" }
```

`POST /flow` should return:
```
{
  "field": {
    "nx": 18,
    "ny": 14,
    "nz": 14,
    "origin": [-4, -2.4, -2.4],
    "spacing": 0.5,
    "ux": [ ... ],
    "uy": [ ... ],
    "uz": [ ... ]
  }
}
```

When `CFD_BACKEND_URL` is not set, the app falls back to an analytic potential-flow field.

## Mesh upload (true CFD pipeline)
Upload a mesh to the backend:
```
POST /mesh
form-data: file=<your .stl/.obj/.glb>
```
The backend returns bounds, a recommended sampling grid, and a ready-to-use `sampleDict`.
Use the generated `sampleDict` in your OpenFOAM case to export `U` and `p`, then point the UI to the CSV.

## Full case generator (side feature)
Generate a full OpenFOAM case folder from the uploaded mesh:
```
POST /case/{mesh_id}/generate
```
This builds `system/`, `constant/`, and `0/` plus a run script.
The generated `controlDict` includes a `streamLine` function object so OpenFOAM can write VTK streamlines during the solver run.

To download a ZIP:
```
GET /case/{mesh_id}/download
```

To launch a WSL run from the backend (optional):
```
POST /case/{mesh_id}/run
```
Enable it via:
```
CFD_ALLOW_RUN="1"
CFD_WSL_DISTRO="Ubuntu"
```
If `CFD_ALLOW_RUN` is not set, the endpoint will return a command you can run manually in WSL.
