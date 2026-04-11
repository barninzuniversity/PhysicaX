# OpenFOAM Export Guide

This folder contains helpers for exporting velocity fields from OpenFOAM so the
PhysicaX CFD backend can read them.

## Output format
Export a CSV file with columns:
```
x,y,z,ux,uy,uz[,p]
```
The optional 7th column `p` enables the surface pressure map in the 3D airflow UI.

Save it to:
```
C:\Users\ibzao\Downloads\Project\physicax-web\cfd\openfoam\output\field.csv
```

Then set in `C:\Users\ibzao\Downloads\Project\physicax-web\.env`:
```
OPENFOAM_EXPORT_PATH="C:\\Users\\ibzao\\Downloads\\Project\\physicax-web\\cfd\\openfoam\\output\\field.csv"
```

## Sampling from OpenFOAM
1. Add the provided `sampleDict` to your case at:
```
system/sampleDict
```
2. Run:
```
postProcess -func sample
```
3. Copy the resulting CSV (usually under `postProcessing/sample/0/`)
to the output path above.

The CFD backend will pick it up automatically when you choose the
`openfoam` engine in the 3D airflow UI.

## Case generator (side feature)
If you upload a mesh in the 3D airflow UI, the backend can generate a full
OpenFOAM case folder and a ready-to-run `run_openfoam.sh` script. You can
download the ZIP from the UI or run it manually in WSL.
