import { FormulaSpec } from "../types";

export const formulaRegistry: FormulaSpec[] = [
  {
    id: "mechanics.projectile.nodrag",
    title: "Projectile Motion (No Drag)",
    category: "mechanics",
    equations: [
      {
        name: "Range",
        latex: "R = \\frac{v_0^2 \\sin(2\\theta)}{g}",
        expressionId: "R=v0^2*sin(2*theta)/g",
        description: "Valid for launch and landing at same height."
      },
      {
        name: "Time of flight",
        latex: "T = \\frac{2 v_0 \\sin\\theta}{g}",
        expressionId: "T=2*v0*sin(theta)/g"
      },
      {
        name: "Max height",
        latex: "H = \\frac{v_0^2 \\sin^2\\theta}{2 g}",
        expressionId: "H=v0^2*sin(theta)^2/(2*g)"
      }
    ],
    assumptions: ["Uniform gravity", "No air resistance", "Flat ground"],
    parameterDomains: [
      { name: "g", constraint: "g > 0" },
      { name: "v0", constraint: "v0 >= 0" }
    ],
    units: [
      { variable: "R", siUnit: "m" },
      { variable: "T", siUnit: "s" },
      { variable: "H", siUnit: "m" }
    ]
  },
  {
    id: "mechanics.pendulum.exact",
    title: "Simple Pendulum (Exact)",
    category: "mechanics",
    equations: [
      {
        name: "Equation of motion",
        latex: "\\theta'' + \\frac{g}{L}\\sin\\theta = 0",
        expressionId: "theta_ddot + (g/L) * sin(theta) = 0"
      },
      {
        name: "Exact period",
        latex: "T = 4\\sqrt{\\frac{L}{g}}\\,K\\left(\\sin\\frac{\\theta_0}{2}\\right)",
        expressionId: "T=4*sqrt(L/g)*K(sin(theta0/2))"
      }
    ],
    assumptions: ["Point mass", "Massless rod", "No driving force"],
    parameterDomains: [
      { name: "L", constraint: "L > 0" },
      { name: "g", constraint: "g > 0" }
    ],
    units: [{ variable: "T", siUnit: "s" }]
  },
  {
    id: "em.circuits.rc.charge",
    title: "RC Charging",
    category: "em",
    equations: [
      {
        name: "Capacitor voltage",
        latex: "V_C(t) = V_0\\left(1-e^{-t/(RC)}\\right)",
        expressionId: "Vc=V0*(1-exp(-t/(R*C)))"
      },
      {
        name: "Current",
        latex: "I(t) = \\frac{V_0}{R} e^{-t/(RC)}",
        expressionId: "I=V0/R*exp(-t/(R*C))"
      }
    ],
    assumptions: ["Ideal resistor/capacitor", "Step input"],
    parameterDomains: [
      { name: "R", constraint: "R > 0" },
      { name: "C", constraint: "C > 0" }
    ]
  },
  {
    id: "em.circuits.rlc.impedance",
    title: "Series RLC Impedance",
    category: "em",
    equations: [
      {
        name: "Impedance",
        latex: "Z = R + i\\left(\\omega L - \\frac{1}{\\omega C}\\right)",
        expressionId: "Z=R+i*(w*L-1/(w*C))"
      },
      {
        name: "Current amplitude",
        latex: "|I| = \\frac{V_0}{|Z|}",
        expressionId: "I=V0/abs(Z)"
      },
      {
        name: "Phase",
        latex: "\\phi = \\tan^{-1}\\left(\\frac{\\omega L - 1/(\\omega C)}{R}\\right)",
        expressionId: "phi=atan((w*L-1/(w*C))/R)"
      }
    ],
    assumptions: ["Linear components", "Sinusoidal steady state"],
    parameterDomains: [
      { name: "R", constraint: "R > 0" },
      { name: "L", constraint: "L > 0" },
      { name: "C", constraint: "C > 0" }
    ]
  },
  {
    id: "em.coulomb",
    title: "Coulomb's Law",
    category: "em",
    equations: [
      {
        name: "Force magnitude",
        latex: "F = \\frac{1}{4\\pi\\epsilon_0}\\frac{|q_1 q_2|}{r^2}",
        expressionId: "F=(1/(4*pi*eps0))*abs(q1*q2)/r^2"
      },
      {
        name: "Electric field",
        latex: "\\mathbf{E} = \\frac{1}{4\\pi\\epsilon_0}\\frac{q}{r^2}\\hat{r}",
        expressionId: "E=(1/(4*pi*eps0))*q/r^2"
      }
    ],
    assumptions: ["Point charges", "Electrostatic"],
    parameterDomains: [{ name: "r", constraint: "r > 0" }]
  },
  {
    id: "waves.basic",
    title: "Traveling Wave",
    category: "waves",
    equations: [
      {
        name: "Wave form",
        latex: "y(x,t) = A\\sin(kx-\\omega t+\\phi)",
        expressionId: "y=A*sin(k*x-w*t+phi)"
      },
      {
        name: "Phase speed",
        latex: "v = \\omega / k",
        expressionId: "v=w/k"
      }
    ],
    assumptions: ["Linear medium", "Small amplitude"],
    parameterDomains: [{ name: "k", constraint: "k > 0" }]
  },
  {
    id: "pde.heat",
    title: "Heat Equation",
    category: "ode-pde",
    equations: [
      {
        name: "Heat equation",
        latex: "\\frac{\\partial T}{\\partial t} = \\alpha \\nabla^2 T",
        expressionId: "T_t = alpha * laplacian(T)"
      }
    ],
    assumptions: ["Constant diffusivity", "No internal sources"],
    parameterDomains: [{ name: "alpha", constraint: "alpha > 0" }]
  },
  {
    id: "chaos.logistic",
    title: "Logistic Map",
    category: "chaos",
    equations: [
      {
        name: "Map",
        latex: "x_{n+1} = r x_n (1 - x_n)",
        expressionId: "x_next = r*x*(1-x)"
      }
    ],
    assumptions: ["0 <= x <= 1"],
    parameterDomains: [{ name: "r", constraint: "0 < r <= 4" }]
  },
  {
    id: "mechanics.orbit.energy",
    title: "Orbital Specific Energy",
    category: "mechanics",
    equations: [
      {
        name: "Energy per unit mass",
        latex: "\\varepsilon = \\frac{v^2}{2} - \\frac{\\mu}{r}",
        expressionId: "eps=v^2/2 - mu/r"
      },
      {
        name: "Semi-major axis",
        latex: "a = -\\frac{\\mu}{2\\varepsilon}",
        expressionId: "a=-mu/(2*eps)"
      }
    ],
    assumptions: ["Two-body problem", "Central gravity"],
    parameterDomains: [{ name: "r", constraint: "r > 0" }]
  },
  {
    id: "mechanics.duffing",
    title: "Duffing Oscillator",
    category: "mechanics",
    equations: [
      {
        name: "Equation of motion",
        latex: "x'' + \\delta x' + \\alpha x + \\beta x^3 = \\gamma \\cos(\\omega t)",
        expressionId: "x_ddot + delta*x_dot + alpha*x + beta*x^3 = gamma*cos(w*t)"
      }
    ],
    assumptions: ["Nonlinear spring", "Periodic drive"],
    parameterDomains: [{ name: "beta", constraint: "beta != 0" }]
  },
  {
    id: "mechanics.driven_pendulum",
    title: "Driven Pendulum",
    category: "mechanics",
    equations: [
      {
        name: "Equation of motion",
        latex: "\\theta'' + q\\theta' + \\sin\\theta = A\\cos(\\omega t)",
        expressionId: "theta_ddot + q*theta_dot + sin(theta) = A*cos(w*t)"
      }
    ],
    assumptions: ["Unit length, unit gravity", "Periodic drive"],
    parameterDomains: [{ name: "q", constraint: "q >= 0" }]
  },
  {
    id: "ode.linear_system",
    title: "Linear 2D System",
    category: "ode-pde",
    equations: [
      {
        name: "System",
        latex: "\\dot{x} = a x + b y,\\; \\dot{y} = c x + d y",
        expressionId: "x_dot = a*x + b*y; y_dot = c*x + d*y"
      },
      {
        name: "Eigenvalues",
        latex: "\\lambda = \\frac{\\text{tr}\\,A \\pm \\sqrt{(\\text{tr}\\,A)^2 - 4\\det A}}{2}",
        expressionId: "lambda=(trA +- sqrt(trA^2 - 4*detA))/2"
      }
    ],
    assumptions: ["Linear time-invariant"],
    parameterDomains: []
  }
];
