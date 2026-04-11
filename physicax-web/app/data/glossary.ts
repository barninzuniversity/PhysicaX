export type GlossaryEntry = {
  term: string;
  definition: string;
  category: string;
};

export const glossary: GlossaryEntry[] = [
  { term: "Dimensionless number", definition: "Ratio of physical quantities with no units, used to compare regimes.", category: "Math" },
  { term: "Reynolds number", definition: "Re = ρ v L / μ, compares inertia to viscosity in fluid flow.", category: "Fluids" },
  { term: "Strouhal number", definition: "St = f L / v, relates vortex shedding frequency to speed.", category: "Fluids" },
  { term: "Entropy", definition: "State function measuring dispersal of energy; ΔS ≥ ∫ δQ/T.", category: "Thermo" },
  { term: "Helmholtz free energy", definition: "F = U − TS, energy available for work at constant T,V.", category: "Thermo" },
  { term: "CFL condition", definition: "Δt ≤ Δx / c to keep explicit PDE schemes stable.", category: "Numerics" },
  { term: "Lyapunov exponent", definition: "Average exponential rate of divergence of nearby trajectories.", category: "Chaos" },
  { term: "Phase portrait", definition: "Plot of state variables showing trajectories in phase space.", category: "Dynamics" },
  { term: "Poincaré section", definition: "Discrete sampling of a continuous system at fixed phase.", category: "Chaos" },
  { term: "Eigenvalue", definition: "λ such that A v = λ v; determines linear stability.", category: "Linear Algebra" }
];
