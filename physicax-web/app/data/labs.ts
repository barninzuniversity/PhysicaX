export type LabContextLink = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "chip";
};

export type LabModelContext = {
  match?: string;
  eyebrow?: string;
  title: string;
  summary: string;
  equation?: string;
  units?: string[];
  assumptions?: string[];
  validationLimits?: string[];
  nextStep?: string;
  links?: LabContextLink[];
};

export type LabInfo = {
  id: string;
  title: string;
  titleFr?: string;
  href: string;
  summary: string;
  summaryFr?: string;
  focus: string[];
  features: string[];
  modelContext?: LabModelContext;
  contexts?: LabModelContext[];
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
    features: ["Projectile tools", "Energy plots", "Damping and resonance", "CFD airflow"],
    contexts: [
      {
        match: "/labs/mechanics/drag/flow-3d",
        eyebrow: "Validated CFD lane",
        title: "Airflow reasoning frame",
        summary:
          "Treat the airflow lab like an evidence ladder: analytic flow for geometry intuition, then backend-backed fields and exported artifacts when fidelity matters.",
        equation: String.raw`\mathrm{Re}=\frac{\rho U L}{\mu},\qquad q=\frac{1}{2}\rho U^2`,
        units: [
          "Flow speed U in m/s, body scale L in m, density rho in kg/m^3, viscosity mu or nu in SI units.",
          "Dynamic pressure q is reported in pascals and drag estimates in newtons."
        ],
        assumptions: [
          "Analytic mode is for wake intuition and setup sanity checks, not solver-grade validation.",
          "Backend mode becomes trustworthy only when field freshness and exported artifacts are visible."
        ],
        validationLimits: [
          "Do not treat an attractive streamline picture as proof of correctness without CSV or VTK evidence.",
          "Mesh-specific sampling and artifact timestamps matter more than logs alone."
        ],
        nextStep:
          "Start with analytic preview to tune geometry and flow direction, then promote to backend mode and inspect exported artifacts before treating the case as validated.",
        links: [
          { href: "/cfd", label: "CFD control center" },
          { href: "/labs/mechanics/drag/flow-3d/guide", label: "Precision guide", variant: "secondary" }
        ]
      },
      {
        match: "/labs/mechanics/oscillators",
        eyebrow: "Oscillator modeling",
        title: "Oscillator reasoning frame",
        summary:
          "Use the simulator for intuition, then use the workbench to make the governing equation, parameters, and validation cues explicit before comparing response.",
        equation: String.raw`m y'' + c y' + k y = F(t)`,
        units: [
          "Mass m in kg, damping c in N·s/m, stiffness k in N/m, forcing frequency in rad/s.",
          "Displacement y is in meters unless you intentionally reinterpret the state."
        ],
        assumptions: [
          "The reusable workbench solves one state variable at a time, so coupled or driven stories are reduced to a representative lane.",
          "Small-displacement intuition is strongest before pushing into strongly nonlinear behavior."
        ],
        validationLimits: [
          "If dt is too coarse, extrema and period estimates become suggestive rather than trustworthy.",
          "Compare the plot and the live simulator before treating a custom edit as physically meaningful."
        ],
        nextStep:
          "Use the workbench to make the damping or forcing story explicit, then escalate into the desktop or CFD stack only if the question needs heavier runtime control.",
        links: [
          { href: "/labs/math/workbench", label: "Math workbench" },
          { href: "/desktop", label: "Desktop runtime", variant: "chip" }
        ]
      },
      {
        match: "/labs/mechanics/pendulum",
        eyebrow: "Pendulum modeling",
        title: "Pendulum reasoning frame",
        summary:
          "These pages are strongest when angle, damping, and the nonlinear restoring term stay readable enough to compare intuition against the simulated motion.",
        equation: String.raw`\theta'' + c\theta' + \frac{g}{L}\sin(\theta)=0`,
        units: [
          "Length L in meters and gravitational acceleration g in m/s^2.",
          "The workbench state is angular displacement, so keep angle units and small-angle assumptions in mind."
        ],
        assumptions: [
          "Small-angle intuition is a useful baseline, but the simulator can move into visibly nonlinear motion.",
          "The workbench gives a single-angle proxy, not the full double-pendulum state."
        ],
        validationLimits: [
          "A missing or unstable period estimate usually means you need a longer window or a finer dt.",
          "For the double pendulum, treat the workbench as a reasoning aid rather than a full chaotic model."
        ],
        nextStep:
          "Read the equation first, compare the resulting trace against the animated pendulum, and only then escalate into broader modeling or demonstration flows.",
        links: [{ href: "/labs/math/workbench", label: "Dynamics workbench" }]
      }
    ]
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
    features: ["Field lines", "Circuit transients", "Energy storage", "Resonance"],
    contexts: [
      {
        match: "/labs/em/circuits",
        eyebrow: "Circuit modeling",
        title: "Circuit reasoning frame",
        summary:
          "The circuit pages work best when the state variable is explicit: charge for capacitive stories, current for inductive stories, and a clear forcing term when the source matters.",
        equation: String.raw`L i' + R i + \frac{q}{C}=V(t),\qquad R q' + \frac{q}{C}=V(t)`,
        units: [
          "Resistance R in ohms, capacitance C in farads, inductance L in henries, source voltage V in volts.",
          "Charge q is in coulombs and current i is in amperes."
        ],
        assumptions: [
          "The workbench represents a single governing state, so it is a reasoning layer on top of the richer live demo.",
          "Linear component behavior is assumed unless you intentionally reinterpret the model."
        ],
        validationLimits: [
          "Keep dt fine enough to resolve the time constant or resonant response you want to discuss.",
          "Treat the workbench output as a diagnostic companion, then compare it against the dedicated circuit simulator above."
        ],
        nextStep:
          "Use the workbench to make the state equation explicit, then compare the response with the live circuit demo before teaching or presenting the result.",
        links: [
          { href: "/labs/math/cas", label: "Prepare in CAS" },
          { href: "/labs/math/graphing", label: "Plot the response", variant: "secondary" }
        ]
      }
    ]
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
    ],
    contexts: [
      {
        match: "/labs/math/cas",
        eyebrow: "Symbolic hygiene",
        title: "CAS reasoning frame",
        summary:
          "The CAS is strongest when you make assumptions explicit, keep units honest, and immediately reuse the result in graphing or dynamics before the algebra loses context.",
        equation: String.raw`f(x),\qquad \lim_{x\to a} f(x),\qquad A\vec{x}=\vec{b}`,
        units: [
          "Unit conversion only makes sense when the source and target dimensions are compatible.",
          "Matrices and symbolic variables are unitless unless you encode units in the expression."
        ],
        assumptions: [
          "Reality, positivity, and integer assumptions should be declared before solving or factoring when they matter.",
          "Series and limits are local statements around a chosen point, not global truths about the model."
        ],
        validationLimits: [
          "A symbolic result still needs graphing, substitution, or simulation before you treat it as physically trustworthy.",
          "Use the plotted domain and substitution checks to make sure the result behaves the way the algebra suggests."
        ],
        nextStep:
          "Clean the expression here, then send the result into graphing or the workbench while the mathematical context is still fresh.",
        links: [
          { href: "/labs/math/graphing", label: "Graph the result" },
          { href: "/labs/math/workbench", label: "Open dynamics workbench", variant: "secondary" }
        ]
      },
      {
        match: "/labs/math/workbench",
        eyebrow: "Dynamics trust lane",
        title: "Workbench reasoning frame",
        summary:
          "Use the workbench to turn a differential equation into a readable story: identify the state, define the parameters, watch the numerical response, and judge whether the run is dense enough to trust.",
        equation: String.raw`y' = f(t,y)\qquad \mathrm{or}\qquad y'' = f(t,y,v)`,
        units: [
          "Treat dt and tMax as part of the model setup, not just plotting controls.",
          "Keep parameter units consistent before using amplitude, extrema, or period readouts as evidence."
        ],
        assumptions: [
          "This lane is for one representative state variable at a time, even when the full physical system is richer.",
          "RK4 is a credible teaching and prototyping default, but it still depends on a sensible time step."
        ],
        validationLimits: [
          "A missing period estimate or coarse step count is a signal to refine the run before making claims.",
          "Large or unstable amplitudes often indicate a scale problem, a modeling problem, or both."
        ],
        nextStep:
          "Use the workbench to make the model explicit, then compare it with a live simulator, the desktop runtime, or CFD only if the question truly needs stronger evidence.",
        links: [
          { href: "/labs/math/cas", label: "Prepare the model in CAS" },
          { href: "/desktop", label: "Escalate to desktop runtime", variant: "chip" }
        ]
      }
    ]
  }
];
