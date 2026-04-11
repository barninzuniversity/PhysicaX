# Offline Update Pack

Place update artifacts in this folder to enable offline updates in the PhysicaX desktop app.

## Required files
- `latest.json` (manifest)
- The installer or portable file referenced in `latest.json`

### Example `latest.json`
```json
{
  "version": "0.1.1",
  "file": "PhysicaX Setup 0.1.1.exe",
  "notes": "Performance improvements and new lab modules."
}
```

When the app starts, it will check this folder (or `PHYSICAX_UPDATE_DIR`) and prompt to install.
