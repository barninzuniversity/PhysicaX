# PhysicaX

PhysicaX is a local-first physics workspace for people who want interactive simulations, trustworthy formulas, and a clean path from lightweight exploration to packaged desktop and CFD workflows.

It combines a Next.js web experience, an Electron desktop runtime, guided labs, formula and model references, and a CFD toolchain that can graduate from quick validation runs to OpenFOAM-backed artifacts.

## Why PhysicaX exists

Most simulation tools make you choose between approachability and power. PhysicaX is built to close that gap:

- start in the browser when you want fast understanding, teaching flow, or notebook-style exploration
- move into the desktop app when you need a bundled local runtime, offline friendliness, GPU policy controls, or release packaging
- escalate into CFD when you need backend diagnostics, exported sample fields, streamlines, and OpenFOAM-oriented workflows

The goal is not just to show plots. The goal is to help you understand the model, run the system, validate assumptions, and keep the outputs organized.

## Core Product Features

- Interactive physics labs across mechanics, thermodynamics, waves, electromagnetics, chaos, ODE/PDE, and mathematical modeling.
- A shared workspace shell with search, reusable formulas, validation notes, and consistent navigation across the platform.
- A desktop control center for runtime status, GPU mode management, backend visibility, and local release operations.
- A CFD control center for backend health, LBM smoke checks, and promotion into higher-fidelity OpenFOAM export flows.
- Research and classroom surfaces such as guided challenges, registries, notebooks, dashboards, and model exploration tools.
- Local-first packaging for Linux desktop releases, including a WSL-friendly launcher and a bundled CFD backend.

## Product Surfaces

### `physicax-web`

The web app is the main user experience. It contains:

- the homepage and product overview pages
- the interactive labs
- the formula and model registry
- classroom and dashboard surfaces
- the browser-facing CFD pages and API routes

This is the fastest path when you want to explore, teach, compare models, or verify an idea quickly.

### `physicax-desktop`

The desktop app packages the PhysicaX experience for local operation. It adds:

- a bundled local runtime
- backend bootstrapping
- GPU mode control
- update-folder and release handling
- Linux packaging, AppImage, and `.deb` workflows

This is the best path when you want repeatable local execution, offline usage, or a controlled handoff build.

## What Makes PhysicaX Useful

- Validation-first design: formulas, units, and assumptions stay close to the UI instead of getting hidden in implementation details.
- Escalation without friction: you can begin with a lightweight lab and move into a more serious desktop or CFD flow without switching mental models.
- Better operational visibility: the desktop and CFD pages explain what services are running and what artifacts you should expect.
- Better teaching ergonomics: the same product supports classroom demos, self-study, and research-style experimentation.

## Common Workflows

### Browser-first exploration

1. Open the web app.
2. Use the labs, search, or formula registry to frame the question.
3. Adjust parameters and compare plots, regimes, and assumptions.
4. Save the result or move into a heavier desktop or CFD path only when needed.

### Desktop-first local runtime

1. Build the web app.
2. Prepare the desktop runtime.
3. Launch the desktop app and inspect backend and GPU status.
4. Use compatibility mode on WSL or older drivers when stability matters more than maximum throughput.

### CFD workflow

1. Start with backend health and quick validation.
2. Run the lightest useful airflow or transport check first.
3. Promote the case to OpenFOAM-style export when you need sampled fields or streamline artifacts.
4. Inspect the generated outputs instead of assuming solver success from logs alone.

## Project Layout

- `physicax-web/app`: application routes, product pages, labs, dashboards, and shared UI.
- `physicax-web/cfd`: browser-facing CFD backend assets and OpenFOAM support files.
- `physicax-web/data`: search index, registries, and structured content used across the site.
- `physicax-desktop/main.ts`: Electron main process and runtime management.
- `physicax-desktop/scripts`: web preparation, smoke tests, and Linux release helpers.
- `physicax-desktop/backend`: packaged CFD backend build scripts and artifacts.

## Getting Started

### Web app

From `physicax-web`:

```bash
npm install
npm run build
npm run start
```

The production build is designed to work offline and should not depend on downloading Google-hosted fonts during the build.

### Desktop app

From `physicax-desktop`:

```bash
npm install
npm run desktop:build-main
npm run desktop:prep-web
npm run desktop:smoke-test
```

The smoke test verifies that:

- the bundled CFD backend responds
- the local standalone UI responds
- the homepage loads correctly
- the production CSS assets are reachable

### Linux packaging

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
- a generated `README.txt` for local release handoff

## CFD Backend

The browser flow can talk to an external CFD backend through:

- `CFD_BACKEND_URL`
- `NEXT_PUBLIC_CFD_BACKEND_URL`

Manual backend startup:

```bash
cd physicax-web/cfd/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Recommended Verification After Changes

```bash
cd physicax-web
npm run build

cd ../physicax-desktop
npm run desktop:prep-web
npm run desktop:build-main
npm run desktop:smoke-test
```

For Linux release validation:

```bash
cd physicax-desktop
npm run desktop:build-backend:linux
npm run desktop:package:linux
```
