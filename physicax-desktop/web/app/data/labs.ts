export type LabInfo = {
  id: string;
  title: string;
  titleFr?: string;
  href: string;
  summary: string;
  summaryFr?: string;
  focus: string[];
  features: string[];
};

export const labs: LabInfo[] = [
  {
    id: "thermo",
    title: "ThermoLab",
    titleFr: "ThermoLab",
    href: "/labs/thermo",
    summary: "Ideal gas processes, cycles, entropy, and heat transfer.",
    summaryFr: "Processus des gaz parfaits, cycles, entropie et transfert thermique.",
    focus: ["State variables", "Processes", "Cycles", "Entropy", "Stat mech"],
    features: ["Ideal gas solver", "Cycle efficiency", "Entropy visualizer", "Heat transfer"]
  },
  {
    id: "mechanics",
    title: "Mechanics Lab",
    titleFr: "Mecanique",
    href: "/labs/mechanics",
    summary: "Kinematics, oscillators, pendulums, drag, orbits, and CFD airflow.",
    summaryFr: "Cinematique, oscillateurs, pendules, trainee (drag), orbites et CFD.",
    focus: ["Kinematics", "Oscillators", "Pendulums", "Orbits"],
    features: ["Projectile tools", "Energy plots", "Damping and resonance", "CFD airflow"]
  },
  {
    id: "chaos",
    title: "ChaosLab",
    titleFr: "ChaosLab",
    href: "/labs/chaos",
    summary: "Discrete maps, continuous chaos, and diagnostics.",
    summaryFr: "Cartes discretes, chaos continu et diagnostics.",
    focus: ["Discrete maps", "Lyapunov", "Continuous systems"],
    features: ["Bifurcations", "Cobweb plots", "Lyapunov estimates", "Phase portraits"]
  },
  {
    id: "waves",
    title: "WaveLab",
    titleFr: "Ondes",
    href: "/labs/waves",
    summary: "Traveling waves, standing waves, beats, and Fourier series.",
    summaryFr: "Ondes progressives, stationnaires, battements et Fourier.",
    focus: ["Traveling waves", "Standing waves", "Beats", "Fourier series"],
    features: ["Harmonics", "Boundary conditions", "Mode visualization", "Frequency views"]
  },
  {
    id: "em",
    title: "EMLab",
    titleFr: "Electromagnetisme",
    href: "/labs/em",
    summary: "Electrostatics and circuit intuition.",
    summaryFr: "Electrostatique et circuits.",
    focus: ["Coulomb law", "Fields", "RC/RL/RLC circuits"],
    features: ["Field lines", "Circuit transients", "Energy storage", "Resonance"]
  },
  {
    id: "ode-pde",
    title: "ODE/PDE Lab",
    titleFr: "EDO/EDP",
    href: "/labs/ode-pde",
    summary: "Solver comparisons and PDE stability.",
    summaryFr: "Comparaison de solveurs et stabilite EDP.",
    focus: ["ODE solvers", "PDE solvers", "Stability"],
    features: ["Euler/Heun/RK4", "Heat equation", "Wave equation", "Error analysis"]
  },
  {
    id: "stat",
    title: "Statistical Physics",
    titleFr: "Physique Statistique",
    href: "/labs/stat",
    summary: "Random walks, diffusion, and Boltzmann factors.",
    summaryFr: "Marches aleatoires, diffusion et Boltzmann.",
    focus: ["Random walks", "Diffusion", "Boltzmann statistics"],
    features: ["Distribution plots", "Monte Carlo", "Two-level systems"]
  },
  {
    id: "quantum",
    title: "Quantum Intuition",
    titleFr: "Intuition Quantique",
    href: "/labs/quantum",
    summary: "Wavefunctions, tunneling, and superposition demos.",
    summaryFr: "Fonctions d'onde, tunnel quantique, superposition.",
    focus: ["Particle in box", "Tunneling", "Wavepackets"],
    features: ["Energy levels", "Transmission", "Superposition"]
  },
  {
    id: "math",
    title: "Math Engine",
    titleFr: "Moteur Mathematique",
    href: "/labs/math",
    summary: "Symbolic + numeric analysis, scaling, and series tools.",
    summaryFr: "Analyse symbolique/numerique, echelles et series.",
    focus: ["Equation workbench", "Dimensionless groups", "Series methods"],
    features: [
      "Symbolic workbench",
      "Symbolic assumptions",
      "Derivation mode",
      "Approximation comparator",
      "Taylor/Fourier explorer",
      "Linear algebra",
      "Scaling + stability"
    ]
  }
];
