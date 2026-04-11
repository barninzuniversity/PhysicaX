# PhysicaX

PhysicaX is a local-first computational physics workspace with two main deliverables:

- `physicax-web`: the Next.js web application with guided labs, CFD pages, research tools, and API routes.
- `physicax-desktop`: the Electron desktop app that packages the web UI, the bundled CFD backend, update flow, and Linux release assets.

## Project Layout

- `physicax-web/app`: application routes, labs, dashboards, and shared UI.
- `physicax-web/cfd`: backend and OpenFOAM support assets for CFD workflows.
- `physicax-desktop/main.ts`: Electron main process, backend bootstrapping, and runtime controls.
- `physicax-desktop/scripts`: packaging, smoke tests, and Linux release helpers.
- `physicax-desktop/backend`: bundled CFD backend build artifacts and build scripts.

## Web App

From `physicax-web`:

```bash
npm install
npm run build
npm run start
```

The production build is designed to work offline and no longer depends on fetching Google-hosted fonts during the build.

## Desktop App

From `physicax-desktop`:

```bash
npm install
npm run desktop:build-main
npm run desktop:prep-web
npm run desktop:smoke-test
```

The smoke test starts the bundled backend, starts the standalone Next.js server, verifies the homepage, and checks that the CSS assets are reachable.

## Linux Packaging

To build the Linux desktop release:

```bash
cd physicax-web
npm run build

cd ../physicax-desktop
npm run desktop:package:linux
```

This produces a Linux release bundle under `physicax-desktop/dist/linux-release`, including:

- an AppImage
- a `.deb` package
- `run-PhysicaX-wsl.sh` for WSL-friendly launching
- release notes in `README.txt`

## CFD Backend

The browser workflow can talk to an external CFD backend by setting one of these environment variables:

- `CFD_BACKEND_URL`
- `NEXT_PUBLIC_CFD_BACKEND_URL`

For local manual backend work:

```bash
cd physicax-web/cfd/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Verification

Recommended checks after changes:

```bash
cd physicax-web
npm run build

cd ../physicax-desktop
npm run desktop:build-main
npm run desktop:prep-web
npm run desktop:smoke-test
```
