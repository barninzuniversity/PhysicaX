# PhysicaX

Computational physics platform blueprint, reference pack, and optional local AI tutor.

This repository contains the structured product blueprint, formula reference, and site for PhysicaX — a modular platform for simulation, visualization, education, and research workflows.

## Windows App

PhysicaX can run as a desktop app via Electron.

## Quick Start

1. Double-click `install.bat`
2. After setup completes, run `npm start`

The installer checks for Node, Git, and Ollama. If Ollama is available, it can download the local AI tutor model automatically.

To build a Windows installer: `npm run build`

## AI Tutor

- Default: local, offline-capable helper via Ollama + `llama3.2:3b`
- If Ollama is unavailable, the app still runs; AI features will report offline
- No API keys required

## Contents

- `index.html` / `styles.css` / `script.js` — blueprint site + AI tutor UI
- `PhysicaX_Formula_Reference.md` — canonical formula pack
- Guide extraction artifacts in this tree for traceability

## Contributing

See `CONTRIBUTING.md` and `AGENTS.md`.
