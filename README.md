# PhysicaX

PhysicaX is a local-first physics workspace built for people who want more than isolated simulations. It combines an interactive Next.js web app, an Electron desktop runtime, a bundled CFD path, and a shared language for formulas, validation, and scientific workflow.

The idea is simple: start with fast understanding, keep the model explainable, and escalate into heavier tooling only when the question actually needs it.

## What PhysicaX does well

- Gives you browser-first physics labs for fast exploration, teaching, and comparison.
- Keeps formulas, units, assumptions, and plots close together so the model stays explainable.
- Packages the same experience into a desktop app for offline-friendly local runtime control.
- Adds a CFD workflow that moves from quick validation to OpenFOAM-oriented artifact export.
- Supports classroom, research, and operator-style use without forcing separate tools for each mode.

## The three main ways to use it

### 1. Browser workspace

Use the web app when you want the shortest path from a question to a visual result.

Best for:

- teaching and classroom demos
- self-study and concept exploration
- formula lookup and graphing
- quick experimentation before heavier runtime setup

What you get:

- interactive labs across mechanics, thermodynamics, waves, electromagnetics, chaos, ODE/PDE, statistics, and math
- shared navigation, search, and discovery tools
- formula and model registry surfaces
- dashboard, research, and classroom-oriented pages

### 2. Desktop runtime

Use the desktop app when you want the platform to behave like a managed local product instead of a browser tab.

Best for:

- offline-friendly usage
- packaged local runtime control
- WSL and Linux deployment validation
- GPU policy control and backend visibility

What you get:

- bundled local runtime
- backend bootstrapping and service visibility
- GPU mode management
- update-folder handling for offline release drops
- Linux AppImage and `.deb` packaging flows

### 3. CFD workflow

Use the CFD path when the model needs stronger evidence than a lightweight lab can provide.

Best for:

- airflow and transport validation
- backend diagnostics
- sampled field export
- streamline and OpenFOAM-oriented workflows

What you get:

- a backend status surface
- quick LBM-style smoke checks
- artifact-oriented OpenFOAM export guidance
- a cleaner path from setup validation to reviewable outputs

## Why the product feels different

Most simulation tools force a tradeoff between approachability and power. PhysicaX is designed to remove that tradeoff as much as possible.

- Validation-first: equations, units, and assumptions stay visible instead of disappearing behind implementation details.
- Escalation without friction: you can begin with lightweight exploration and move into desktop or CFD without changing mental models.
- Operational visibility: the desktop and CFD pages explain what is running, what is missing, and what artifacts should exist after a successful run.
- Better teaching flow: the same environment supports guided explanation, self-study, and more serious experimentation.

## Product surfaces

### `physicax-web`

This is the main web product. It includes:

- homepage and product overview pages
- interactive labs
- formula and model registry surfaces
- classroom and dashboard pages
- browser-facing CFD routes and API endpoints

This is the fastest path when you want to explore, teach, compare models, or test an idea quickly.

### `physicax-desktop`

This packages the PhysicaX experience for local operation. It includes:

- Electron runtime shell
- packaged web surface
- bundled CFD backend integration
- update-folder and release workflows
- Linux packaging helpers

This is the best path when you want repeatable local execution, controlled runtime behavior, or release handoff.

## Typical workflows

### Browser-first exploration

1. Open the web app.
2. Search or browse into the relevant lab or formula surface.
3. Adjust parameters and compare behavior while assumptions stay visible.
4. Save the result or escalate only if the question needs a local or CFD workflow.

### Desktop-first local runtime

1. Build the web app.
2. Prepare the desktop runtime.
3. Launch the desktop app and inspect backend, GPU, and update state.
4. Use compatibility mode on WSL or unstable graphics stacks before promoting to high performance.

### CFD validation path

1. Start with backend health.
2. Run the lightest useful validation first.
3. Promote the case to OpenFOAM-style export only when the quick pass looks trustworthy.
4. Inspect the generated CSV and VTK artifacts instead of assuming solver success from logs alone.

## Project layout

- `physicax-web/app`: routes, product pages, labs, shared UI, and client components.
- `physicax-web/cfd`: browser-facing CFD backend assets and OpenFOAM support files.
- `physicax-web/data`: search index, registries, and structured product data.
- `physicax-desktop/main.ts`: Electron main process and runtime management.
- `physicax-desktop/preload.ts`: desktop bridge exposed to the web UI.
- `physicax-desktop/scripts`: web preparation, smoke tests, and Linux release helpers.
- `physicax-desktop/backend`: packaged CFD backend build scripts and artifacts.
- `requirements.txt`: top-level Python dependencies for the CFD backend on Linux.

## Getting started

### Linux quick start from source

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd physicax-web
npm install

cd ../physicax-desktop
npm install
npm run desktop:run:linux
```

This is the fastest way to launch the desktop app yourself on Linux from a downloaded or cloned source checkout.

### Web app

From `physicax-web`:

```bash
npm install
npm run build
npm run start
```

The production build is offline-safe and should not depend on downloading Google-hosted fonts during build time.

### Desktop app

From `physicax-desktop`:

```bash
npm install
npm run desktop:prepare-runtime:linux
npm run desktop:run:linux
```

`desktop:prepare-runtime:linux` builds the web app, mirrors it into the desktop runtime, and packages the Linux CFD backend before Electron launches.

The smoke test still checks that:

- the bundled CFD backend responds
- the local standalone UI responds
- the homepage loads correctly
- production CSS assets are reachable

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
- `run-PhysicaX-linux.sh` for native Linux launching
- `run-PhysicaX-wsl.sh` for WSL-friendly launching
- `install-PhysicaX-deb.sh` for Debian/Ubuntu installation
- a generated `README.txt` for local release handoff

### Run after downloading a Linux release

From the downloaded `linux-release` folder:

```bash
chmod +x run-PhysicaX-linux.sh
./run-PhysicaX-linux.sh
```

On WSL:

```bash
chmod +x run-PhysicaX-wsl.sh
./run-PhysicaX-wsl.sh
```

To install the Debian package:

```bash
chmod +x install-PhysicaX-deb.sh
./install-PhysicaX-deb.sh
```

## CFD backend

The browser flow can talk to an external CFD backend through:

- `CFD_BACKEND_URL`
- `NEXT_PUBLIC_CFD_BACKEND_URL`

Manual backend startup from the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd physicax-web/cfd/backend
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Recommended verification after changes

```bash
cd physicax-web
npm run build

cd ../physicax-desktop
npm run desktop:prepare-runtime:linux
npm run desktop:smoke-test
```

For Linux release validation:

```bash
cd physicax-desktop
npm run desktop:package:linux
npm run desktop:verify-release:linux
```

## Quality bar for PhysicaX changes

Good PhysicaX changes should usually improve at least one of these:

- clarity of the scientific model
- confidence in runtime status or artifact quality
- ease of teaching or demonstrating a concept
- portability of the desktop experience
- smoothness of the escalation path from simple exploration to serious validation
