export type ValidationCase = {
  description: string;
  inputs: string;
  expected: string;
  tolerance?: string;
};

export type PlotSpec = {
  id: string;
  label: string;
  axes: string;
};

export type ModelCard = {
  id: string;
  title?: string;
  equation: string;
  assumptions: string;
  validation: string;
  inputs?: string[];
  outputs?: string[];
  validationCases?: ValidationCase[];
  presets?: string[];
  plots?: PlotSpec[];
  challengeHooks?: string[];
};

export type Category = {
  title: string;
  models: ModelCard[];
};

export const modelCatalog: Category[] = [
  {
    title: "Thermodynamics",
    models: [
      {
        id: "thermo.ideal_gas",
        title: "Ideal Gas Law",
        equation: "PV = n R T",
        assumptions: "Ideal gas, equilibrium, Kelvin temperature.",
        validation: "n=1, T=273.15 K, P=101325 Pa -> V=0.022414 m^3.",
        inputs: ["P", "V", "n", "T"],
        outputs: ["Solve for missing state variable"],
        presets: ["Air (1 mol)", "Steam (approx)"],
        plots: [{ id: "pv", label: "P-V curve", axes: "V vs P" }],
        validationCases: [
          { description: "STP volume", inputs: "n=1, T=273.15 K, P=101325 Pa", expected: "V=0.022414 m^3" }
        ]
      },
      {
        id: "thermo.internal_energy",
        equation: "U = n Cv T, DeltaU = n Cv (T2 - T1)",
        assumptions: "Ideal gas, constant Cv.",
        validation: "Monatomic ideal gas: Cv = (3/2) R, so U = (3/2) n R T."
      },
      {
        id: "thermo.enthalpy",
        equation: "H = n Cp T, DeltaH = n Cp (T2 - T1)",
        assumptions: "Ideal gas, constant Cp.",
        validation: "H = U + P V."
      },
      {
        id: "thermo.first_law",
        equation: "DeltaU = Q - W",
        assumptions: "W is work done by system.",
        validation: "Isothermal: DeltaU = 0 and Q = W."
      },
      {
        id: "thermo.isothermal",
        title: "Isothermal Process",
        equation: "W = n R T ln(V2/V1)",
        assumptions: "Reversible, ideal gas.",
        validation: "PV = const.",
        inputs: ["V1", "V2", "T", "n"],
        outputs: ["Work", "Heat"],
        plots: [{ id: "pv", label: "Isothermal PV", axes: "V vs P" }]
      },
      {
        id: "thermo.isochoric",
        equation: "W = 0, Q = n Cv (T2 - T1)",
        assumptions: "V constant, ideal gas.",
        validation: "Work is zero."
      },
      {
        id: "thermo.isobaric",
        equation: "W = P (V2 - V1), Q = n Cp (T2 - T1)",
        assumptions: "P constant, ideal gas.",
        validation: "W = n R (T2 - T1)."
      },
      {
        id: "thermo.adiabatic_reversible",
        title: "Adiabatic (Reversible)",
        equation: "P V^gamma = const, Q = 0",
        assumptions: "Reversible, ideal gas.",
        validation: "DeltaS = 0.",
        inputs: ["P1", "V1", "P2", "V2", "gamma"],
        outputs: ["Work", "T2"],
        plots: [{ id: "pv", label: "Adiabatic PV", axes: "V vs P" }]
      },
      {
        id: "thermo.polytropic",
        equation: "P V^m = const, W = (P2 V2 - P1 V1)/(1 - m)",
        assumptions: "Ideal gas, m constant.",
        validation: "m -> 1 gives isothermal log form."
      },
      {
        id: "thermo.entropy_change",
        title: "Entropy Change (Ideal Gas)",
        equation: "DeltaS = n Cv ln(T2/T1) + n R ln(V2/V1)",
        assumptions: "Ideal gas.",
        validation: "Reversible adiabatic gives DeltaS = 0.",
        inputs: ["T1", "T2", "V1", "V2", "Cv", "n"],
        outputs: ["DeltaS"]
      },
      {
        id: "thermo.carnot",
        title: "Carnot Efficiency",
        equation: "eta = 1 - Tc/Th",
        assumptions: "Reversible, two reservoirs.",
        validation: "0 <= eta <= 1.",
        inputs: ["Th", "Tc"],
        outputs: ["Efficiency"],
        plots: [{ id: "cycle", label: "Carnot cycle", axes: "T vs S" }]
      },
      {
        id: "thermo.otto",
        equation: "eta = 1 - 1/r^(gamma-1)",
        assumptions: "Air-standard, constant gamma.",
        validation: "Increasing r increases eta."
      },
      {
        id: "thermo.diesel",
        equation: "eta = 1 - (1/r^(gamma-1)) * ((rho^gamma - 1)/(gamma * (rho - 1)))",
        assumptions: "Air-standard, constant gamma.",
        validation: "rho -> 1 reduces to Otto."
      },
      {
        id: "thermo.brayton",
        equation: "eta = 1 - 1 / rp^((gamma-1)/gamma)",
        assumptions: "Ideal compressor and turbine.",
        validation: "eta increases with rp."
      },
      {
        id: "thermo.maxwell_boltzmann",
        title: "Maxwell-Boltzmann",
        equation: "f(v) = 4 pi (m/(2 pi kB T))^(3/2) v^2 exp(-m v^2/(2 kB T))",
        assumptions: "Classical ideal gas.",
        validation: "v_rms = sqrt(3 kB T / m).",
        inputs: ["T", "m"],
        outputs: ["Distribution"],
        plots: [{ id: "mb", label: "Speed distribution", axes: "v vs f(v)" }]
      },
      {
        id: "thermo.boltzmann_factor",
        equation: "p_i = exp(-E_i/(kB T)) / Z",
        assumptions: "Thermal equilibrium.",
        validation: "Sum of probabilities equals 1."
      },
      {
        id: "thermo.two_level",
        equation: "Z = 1 + exp(-E/(kB T))",
        assumptions: "Two energy states.",
        validation: "<E> = E * p1."
      },
      {
        id: "thermo.newton_cooling",
        equation: "dT/dt = -k (T - T_env)",
        assumptions: "Lumped system, k>0.",
        validation: "T(t) approaches T_env."
      }
    ]
  },
  {
    title: "Mechanics",
    models: [
      {
        id: "mech.kinematics",
        title: "Constant Acceleration",
        equation: "x = x0 + v0 t + (1/2) a t^2",
        assumptions: "Constant acceleration.",
        validation: "v^2 = v0^2 + 2 a (x - x0).",
        inputs: ["x0", "v0", "a", "t"],
        outputs: ["x", "v"],
        plots: [{ id: "xt", label: "Position", axes: "t vs x" }]
      },
      {
        id: "mech.projectile_no_drag",
        title: "Projectile (No Drag)",
        equation: "y(t) = y0 + v0 sin(theta) t - (1/2) g t^2",
        assumptions: "No drag.",
        validation: "Range R = v0^2 sin(2 theta)/g.",
        inputs: ["v0", "theta", "y0"],
        outputs: ["trajectory", "range", "time"],
        plots: [{ id: "traj", label: "Trajectory", axes: "x vs y" }]
      },
      {
        id: "mech.drag_linear",
        equation: "m dv/dt = sumF - b v",
        assumptions: "Low speed regime.",
        validation: "v_t = m g / b."
      },
      {
        id: "mech.drag_quadratic",
        equation: "Fd = -(1/2) rho Cd A |v| v",
        assumptions: "High speed regime.",
        validation: "Numerical only."
      },
      {
        id: "mech.newton_second",
        equation: "sumF = m a",
        assumptions: "Inertial frame.",
        validation: "Static case sumF = 0."
      },
      {
        id: "mech.work",
        equation: "W = integral(F dot dx)",
        assumptions: "Path integral.",
        validation: "Constant force gives W = F dot Delta x."
      },
      {
        id: "mech.kinetic_energy",
        equation: "K = (1/2) m v^2",
        assumptions: "Classical regime.",
        validation: "K >= 0."
      },
      {
        id: "mech.potential_gravity",
        equation: "U = m g h",
        assumptions: "Near Earth.",
        validation: "DeltaU = m g (h2 - h1)."
      },
      {
        id: "mech.potential_spring",
        equation: "U = (1/2) k x^2",
        assumptions: "Linear spring.",
        validation: "F = -k x."
      },
      {
        id: "mech.shm",
        equation: "x'' + (k/m) x = 0",
        assumptions: "No damping.",
        validation: "T = 2 pi sqrt(m/k)."
      },
      {
        id: "mech.damped_oscillator",
        equation: "x'' + 2 gamma x' + omega0^2 x = 0",
        assumptions: "Linear damping.",
        validation: "Energy decreases when gamma > 0."
      },
      {
        id: "mech.driven_oscillator",
        equation: "x'' + 2 gamma x' + omega0^2 x = (F0/m) cos(omega t)",
        assumptions: "Sinusoidal drive.",
        validation: "Resonance near omega0."
      },
      {
        id: "mech.pendulum_exact",
        title: "Pendulum (Exact)",
        equation: "theta'' + (g/L) sin(theta) = 0",
        assumptions: "Rigid rod, point mass.",
        validation: "Small angle matches linear.",
        inputs: ["theta0", "L", "g"],
        outputs: ["theta(t)", "period"],
        plots: [{ id: "theta", label: "Angle vs time", axes: "t vs theta" }]
      },
      {
        id: "mech.pendulum_small",
        equation: "theta'' + (g/L) theta = 0",
        assumptions: "Small angle only.",
        validation: "T = 2 pi sqrt(L/g)."
      },
      {
        id: "mech.pendulum_large_period",
        equation: "T = 4 sqrt(L/g) K(k)",
        assumptions: "Large amplitude.",
        validation: "k = sin(theta0/2)."
      },
      {
        id: "mech.double_pendulum",
        equation: "Canonical Lagrangian ODEs",
        assumptions: "Point masses, rigid rods.",
        validation: "Energy conservation when damping = 0."
      },
      {
        id: "mech.gravity",
        equation: "F = G m1 m2 / r^2",
        assumptions: "Point masses.",
        validation: "Inverse square scaling."
      },
      {
        id: "mech.circular_orbit",
        equation: "v = sqrt(G M / r)",
        assumptions: "Circular orbit.",
        validation: "T = 2 pi sqrt(r^3/(G M))."
      },
      {
        id: "mech.escape_velocity",
        equation: "v_esc = sqrt(2 G M / r)",
        assumptions: "Two-body, point mass.",
        validation: "v_esc > circular orbit speed."
      },
      {
        id: "mech.orbital_energy",
        equation: "epsilon = v^2/2 - G M / r",
        assumptions: "Two-body, Newtonian.",
        validation: "Bound ellipse epsilon = -G M/(2 a)."
      }
    ]
  },
  {
    title: "Chaos",
    models: [
      {
        id: "chaos.logistic",
        title: "Logistic Map",
        equation: "x_{n+1} = r x_n (1 - x_n)",
        assumptions: "Discrete time.",
        validation: "r=2.9 converges to fixed point.",
        inputs: ["r", "x0"],
        outputs: ["sequence"],
        plots: [{ id: "cobweb", label: "Cobweb", axes: "x_n vs x_{n+1}" }]
      },
      {
        id: "chaos.lyapunov",
        equation: "lambda = lim_{N->inf} (1/N) sum_{n=0}^{N-1} ln |f'(x_n)|",
        assumptions: "Long trajectory.",
        validation: "lambda > 0 indicates chaos."
      },
      {
        id: "chaos.tent_map",
        equation: "Piecewise linear tent map",
        assumptions: "r in [0,2].",
        validation: "Stays in [0,1] for valid r."
      },
      {
        id: "chaos.lorenz",
        title: "Lorenz System",
        equation: "x' = sigma (y - x), y' = x (rho - z) - y, z' = x y - beta z",
        assumptions: "Classic parameters.",
        validation: "Trajectory remains bounded.",
        inputs: ["sigma", "rho", "beta"],
        outputs: ["trajectory"],
        plots: [{ id: "phase", label: "Phase portrait", axes: "x vs z" }]
      },
      {
        id: "chaos.rossler",
        equation: "x' = -y - z, y' = x + a y, z' = b + z (x - c)",
        assumptions: "Typical a=0.2, b=0.2, c=5.7.",
        validation: "Bounded attractor."
      },
      {
        id: "chaos.duffing",
        equation: "x'' + delta x' + alpha x + beta x^3 = gamma cos(omega t)",
        assumptions: "Driven nonlinear oscillator.",
        validation: "Compare to reference trajectory."
      }
    ]
  },
  {
    title: "Waves",
    models: [
      {
        id: "wave.traveling",
        title: "Traveling Wave",
        equation: "y(x,t) = A sin(k x - omega t + phi)",
        assumptions: "Linear wave.",
        validation: "v = omega/k.",
        inputs: ["A", "k", "omega", "phi"],
        outputs: ["y(x,t)"],
        plots: [{ id: "wave", label: "Wave slice", axes: "x vs y" }]
      },
      {
        id: "wave.standing",
        equation: "y(x,t) = 2 A sin(k x) cos(omega t)",
        assumptions: "Two equal waves.",
        validation: "Nodes fixed at boundaries."
      },
      {
        id: "wave.beats",
        equation: "2 A cos((omega1 - omega2)t/2) cos((omega1 + omega2)t/2)",
        assumptions: "Two close frequencies.",
        validation: "Beat frequency: f_beat = |f1 - f2|."
      },
      {
        id: "wave.string_speed",
        equation: "v = sqrt(T/mu)",
        assumptions: "Uniform string.",
        validation: "v increases with T."
      },
      {
        id: "wave.harmonics",
        equation: "f_n = n v / (2 L)",
        assumptions: "Fixed ends.",
        validation: "n = 1,2,3..."
      },
      {
        id: "wave.air_columns",
        equation: "Open-closed: f_n = (2n-1) v / (4 L)",
        assumptions: "Ideal air column.",
        validation: "Odd harmonics only."
      },
      {
        id: "wave.fourier",
        equation: "f(x) = a0/2 + sum_{n=1}^inf [a_n cos(n pi x / L) + b_n sin(n pi x / L)]",
        assumptions: "Periodic function.",
        validation: "Coefficients from integrals."
      }
    ]
  },
  {
    title: "Electromagnetism",
    models: [
      {
        id: "em.coulomb",
        title: "Coulomb Force",
        equation: "F = (1/(4 pi epsilon0)) * (q1 q2 / r^2) r_hat",
        assumptions: "Point charges.",
        validation: "Inverse square scaling.",
        inputs: ["q1", "q2", "r"],
        outputs: ["force"]
      },
      {
        id: "em.field",
        equation: "E = k q / r^2 r_hat",
        assumptions: "Point charge.",
        validation: "Direction matches sign."
      },
      {
        id: "em.potential",
        equation: "V = k q / r",
        assumptions: "Point charge.",
        validation: "V decreases with r."
      },
      {
        id: "em.energy",
        equation: "U = k q1 q2 / r",
        assumptions: "Two charges.",
        validation: "Sign depends on charges."
      },
      {
        id: "em.capacitor",
        equation: "C = epsilon0 A / d",
        assumptions: "Parallel plate, vacuum.",
        validation: "U = (1/2) C V^2."
      },
      {
        id: "em.rc",
        title: "RC Step Response",
        equation: "q(t) = C V (1 - exp(-t/(R C)))",
        assumptions: "Ideal components.",
        validation: "q -> C V as t -> inf.",
        inputs: ["R", "C", "V"],
        outputs: ["q(t)", "i(t)"],
        plots: [{ id: "rc", label: "Charge", axes: "t vs q" }]
      },
      {
        id: "em.rl",
        equation: "i(t) = (V/R) (1 - exp(-t/(L/R)))",
        assumptions: "Ideal components.",
        validation: "i -> V/R as t -> inf."
      },
      {
        id: "em.rlc",
        equation: "L q'' + R q' + (1/C) q = V(t)",
        assumptions: "Series circuit.",
        validation: "omega0 = 1/sqrt(L C)."
      }
    ]
  },
  {
    title: "ODE and PDE",
    models: [
      {
        id: "ode.first_order",
        title: "First Order ODE",
        equation: "dy/dt = f(t, y)",
        assumptions: "Well-posed ODE.",
        validation: "Matches analytical solution when known.",
        inputs: ["f(t,y)", "y0"],
        outputs: ["y(t)"]
      },
      {
        id: "ode.euler",
        equation: "y_{n+1} = y_n + h f(t_n, y_n)",
        assumptions: "Explicit method.",
        validation: "Global error O(h)."
      },
      {
        id: "ode.heun",
        equation: "Predictor-corrector average slope",
        assumptions: "Explicit method.",
        validation: "Global error O(h^2)."
      },
      {
        id: "ode.rk4",
        equation: "4th-order Runge-Kutta",
        assumptions: "Explicit method.",
        validation: "Global error O(h^4)."
      },
      {
        id: "pde.heat",
        title: "Heat Equation (1D)",
        equation: "u_t = alpha u_xx",
        assumptions: "1D, constant alpha.",
        validation: "r = alpha * dt / dx^2, require r <= 1/2.",
        inputs: ["alpha", "initial condition", "boundary condition"],
        outputs: ["u(x,t)"]
      },
      {
        id: "pde.wave",
        equation: "u_tt = c^2 u_xx",
        assumptions: "1D, constant c.",
        validation: "s = c * dt / dx, require s <= 1."
      },
      {
        id: "pde.diffusion",
        equation: "u_t = D u_xx",
        assumptions: "1D, constant D.",
        validation: "Same scheme as heat equation."
      }
    ]
  },
  {
    title: "Statistical Physics",
    models: [
      {
        id: "stat.random_walk",
        title: "Random Walk",
        equation: "<x^2> = N a^2",
        assumptions: "Unbiased steps.",
        validation: "x_rms = a sqrt(N).",
        inputs: ["N", "a"],
        outputs: ["distribution"]
      },
      {
        id: "stat.diffusion",
        equation: "<x^2> = 2 D t",
        assumptions: "Continuous diffusion.",
        validation: "2D gives <r^2> = 4 D t."
      }
    ]
  }
];
