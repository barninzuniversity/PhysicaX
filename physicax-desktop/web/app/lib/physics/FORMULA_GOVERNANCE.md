# PhysicaX Formula Governance

This document defines the physics integrity rules for PhysicaX. All models must follow these rules.

## Global Conventions
- Internal calculations use SI units only.
- Output conversions happen only at the presentation layer.
- Thermodynamics sign convention: dU = Q - W, where W is work done by the system.
- Angular inputs for trig and ODE solvers are in radians internally.

## Canonical Constants
- g0 = 9.80665 m s^-2
- R = 8.314462618 J mol^-1 K^-1
- kB = 1.380649e-23 J K^-1
- G = 6.67430e-11 m^3 kg^-1 s^-2
- epsilon0 = 8.8541878128e-12 F/m

## Units Policy
- Temperature: convert C to K before use in formulas.
- Pressure: atm and bar are converted to Pa.
- Volume: liters are converted to m^3.
- Angles: degrees are converted to radians.

## Numerical Safety
- Detect NaN/Inf and surface warnings in the UI.
- Warn on unstable timestep choices for oscillatory systems.
- Flag or clamp invalid domains (negative Kelvin, zero length, etc).

## Validation Rules
Every model must include:
- At least one exact known-value check.
- At least one limiting-case check.
- At least one invalid-input rejection.

## Energy / Entropy Checks
- For conservative systems, report energy drift.
- Entropy must not decrease in irreversible isolated systems.

## Formula Registry
- Use the formula registry as the single source of truth.
- Do not duplicate equations in multiple files.
