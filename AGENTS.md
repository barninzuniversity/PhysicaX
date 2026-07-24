# AGENTS.md — PhysicaX

## Project Mission

PhysicaX is a computational physics platform combining mathematics, physics, and computer science. It includes simulation labs (thermodynamics, mechanics, chaos, ODE/PDE, statistical physics), public experiment sharing, challenge mode, research mode, and classroom-oriented workflows.

## High-Level Priorities

1. Scientific correctness over speed.
2. Type safety over convenience.
3. Reusable engines over page-specific logic.
4. Stable contracts between frontend and backend.
5. Tests are mandatory for any numerical or domain logic.
6. Do not duplicate equations or solver logic across packages.
7. UI components must remain generic and composable.
8. All user-facing text must support i18n (English/French).
9. Heavy simulations should be worker-compatible.
10. Never break API schemas without updating versioned contracts.

## Repo Layout

- `apps/web` — frontend
- `apps/api` — backend
- `packages/*` — shared libraries
- `specs/` — contracts and acceptance criteria
- `tests/` — unit, integration, scientific regression tests
- `infra/` — docker, deploy, scripts

## Required Standards

- Keep physics formulas in domain packages only.
- Validation must happen before solver execution.
- Long-running tasks must support async execution.
- Add or update tests for any numerical or domain change.
- Preserve package boundaries; no business logic in page routes.
- If a task is ambiguous, implement the smallest robust version and document TODOs.
