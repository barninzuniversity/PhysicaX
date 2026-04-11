"use client";

import { useMemo, useState } from "react";
import { MathBlock } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

type Formula = {
  id: string;
  title: string;
  category: string;
  latex: string;
  variables?: { symbol: string; meaning: string }[];
  assumptions: string[];
  notes?: string[];
  domain?: string;
  validation?: string[];
};

const FORMULAS: Formula[] = [
  {
    id: "navier-stokes",
    title: "Navier-Stokes (Incompressible)",
    category: "Fluids",
    latex: String.raw`\rho(\partial_t \vec{u} + \vec{u}\cdot\nabla\vec{u}) = -\nabla p + \mu \nabla^2 \vec{u},\;\nabla\cdot\vec{u}=0`,
    variables: [
      { symbol: "\\vec{u}", meaning: "velocity field" },
      { symbol: "p", meaning: "pressure" },
      { symbol: "\\rho", meaning: "density" },
      { symbol: "\\mu", meaning: "dynamic viscosity" }
    ],
    assumptions: ["Newtonian fluid", "Constant density", "Continuum hypothesis", "Incompressible flow"],
    domain: "Continuum fluids, low Mach number",
    validation: ["Pipe flow Re < 2300", "Lid-driven cavity benchmark", "Cavity flow profiles"],
    notes: ["Used in CFD, Reynolds number controls regimes."]
  },
  {
    id: "bernoulli",
    title: "Bernoulli",
    category: "Fluids",
    latex: String.raw`p + \frac{1}{2}\rho v^2 + \rho g z = \mathrm{const}`,
    variables: [
      { symbol: "v", meaning: "speed" },
      { symbol: "z", meaning: "elevation" }
    ],
    assumptions: ["Steady", "Inviscid", "Along a streamline"],
    domain: "Streamline analysis with negligible viscosity",
    notes: ["Useful for quick pressure-speed estimates."]
  },
  {
    id: "reynolds",
    title: "Reynolds Number",
    category: "Fluids",
    latex: String.raw`\mathrm{Re}=\frac{\rho U L}{\mu}`,
    variables: [
      { symbol: "U", meaning: "characteristic velocity" },
      { symbol: "L", meaning: "characteristic length" }
    ],
    assumptions: ["Single characteristic scale", "Newtonian fluid"],
    validation: ["Laminar pipe flow", "Boundary layer estimates"],
    notes: ["Re < 2300 laminar in pipes; higher Re tends toward turbulence."]
  },
  {
    id: "heat",
    title: "Heat Equation",
    category: "Thermo",
    latex: String.raw`\partial_t T = \alpha \nabla^2 T`,
    variables: [
      { symbol: "T", meaning: "temperature" },
      { symbol: "\\alpha", meaning: "thermal diffusivity" }
    ],
    assumptions: ["Constant diffusivity", "No internal heat generation"],
    validation: ["1D slab analytic solution", "Semi-infinite transient"],
    notes: ["CFL: r = alpha * dt / dx^2 <= 1/2 (explicit)."]
  },
  {
    id: "ideal-gas",
    title: "Ideal Gas Law",
    category: "Thermo",
    latex: String.raw`PV = nRT`,
    variables: [
      { symbol: "P", meaning: "pressure" },
      { symbol: "V", meaning: "volume" },
      { symbol: "n", meaning: "moles" },
      { symbol: "R", meaning: "gas constant" },
      { symbol: "T", meaning: "temperature" }
    ],
    assumptions: ["Dilute gas", "No interactions", "Point particles"],
    domain: "Low pressure, high temperature",
    notes: ["Good at low pressure, high temperature."]
  },
  {
    id: "entropy",
    title: "Entropy Change (Ideal Gas)",
    category: "Thermo",
    latex: String.raw`\Delta S = n C_v \ln\frac{T_2}{T_1} + n R \ln\frac{V_2}{V_1}`,
    assumptions: ["Ideal gas", "Reversible path"],
    notes: ["Entropy generation positive for irreversible processes."]
  },
  {
    id: "carnot",
    title: "Carnot Efficiency",
    category: "Thermo",
    latex: String.raw`\eta = 1 - \frac{T_c}{T_h}`,
    assumptions: ["Reversible engine"],
    validation: ["Carnot cycle efficiency bound"],
    notes: ["Upper bound for any heat engine."]
  },
  {
    id: "pendulum",
    title: "Pendulum (Exact)",
    category: "Mechanics",
    latex: String.raw`\theta'' + \frac{g}{L}\sin\theta = 0`,
    variables: [
      { symbol: "\\theta", meaning: "angle" },
      { symbol: "g", meaning: "gravity" },
      { symbol: "L", meaning: "length" }
    ],
    assumptions: ["Point mass", "Rigid rod", "No air drag"],
    validation: ["Small-angle solution", "Energy conservation"],
    notes: ["Small-angle: sin(theta) ~= theta."]
  },
  {
    id: "projectile",
    title: "Projectile (No Drag)",
    category: "Mechanics",
    latex: String.raw`y(t)=y_0 + v_0\sin\theta\, t - \frac{1}{2} g t^2`,
    assumptions: ["No drag", "Uniform gravity"],
    validation: ["Range formula vs numeric"],
    notes: ["Range: R = v_0^2 sin(2 theta) / g."]
  },
  {
    id: "shm",
    title: "Simple Harmonic Motion",
    category: "Mechanics",
    latex: String.raw`x'' + \omega_0^2 x = 0`,
    assumptions: ["No damping"],
    validation: ["Energy conservation", "Period check"],
    notes: ["Period T = 2 pi / omega0."]
  },
  {
    id: "hooke",
    title: "Hooke's Law",
    category: "Mechanics",
    latex: String.raw`F=-k x`,
    assumptions: ["Linear elastic regime"],
    validation: ["Hooke linear range only"],
    notes: ["Base model for oscillators."]
  },
  {
    id: "wave",
    title: "Wave Equation",
    category: "Waves",
    latex: String.raw`\partial_{tt} u = c^2 \nabla^2 u`,
    variables: [
      { symbol: "u", meaning: "displacement" },
      { symbol: "c", meaning: "wave speed" }
    ],
    assumptions: ["Linear medium", "Small amplitude"],
    validation: ["Standing wave modes"],
    notes: ["CFL: c * dt / dx <= 1 (explicit)."]
  },
  {
    id: "fourier",
    title: "Fourier Series",
    category: "Waves",
    latex: String.raw`f(x)=\frac{a_0}{2}+\sum_{n=1}^N a_n\cos(n\omega x)+b_n\sin(n\omega x)`,
    assumptions: ["Periodic function", "Piecewise smooth"],
    validation: ["Gibbs overshoot check"],
    notes: ["Gibbs phenomenon near discontinuities."]
  },
  {
    id: "coulomb",
    title: "Coulomb Force",
    category: "Electromagnetism",
    latex: String.raw`\vec{F} = \frac{1}{4\pi\epsilon_0}\frac{q_1 q_2}{r^2}\hat{r}`,
    assumptions: ["Point charges"],
    validation: ["Inverse-square check"],
    notes: ["Inverse-square law."]
  },
  {
    id: "gauss",
    title: "Gauss Law",
    category: "Electromagnetism",
    latex: String.raw`\oint \vec{E}\cdot d\vec{A} = \frac{Q_{enc}}{\epsilon_0}`,
    assumptions: ["Electrostatics"],
    validation: ["Gaussian surface check"],
    notes: ["Useful for symmetric charge distributions."]
  },
  {
    id: "rc",
    title: "RC Charging",
    category: "Circuits",
    latex: String.raw`q(t) = C V(1-e^{-t/(RC)})`,
    assumptions: ["Ideal components"],
    validation: ["tau = R C", "step response"],
    notes: ["Time constant tau = R C."]
  },
  {
    id: "rlc",
    title: "RLC Response",
    category: "Circuits",
    latex: String.raw`L q'' + R q' + \frac{1}{C} q = V(t)`,
    assumptions: ["Series circuit"],
    validation: ["underdamped/critical/overdamped regimes"],
    notes: ["omega0 = 1/sqrt(L C)."]
  },
  {
    id: "lorenz",
    title: "Lorenz System",
    category: "Chaos",
    latex: String.raw`\dot{x}=\sigma(y-x),\;\dot{y}=x(\rho - z)-y,\;\dot{z}=xy-\beta z`,
    assumptions: ["Low-order convection model"],
    validation: ["Classical chaotic parameter set"],
    notes: ["Chaos for sigma=10, rho=28, beta=8/3."]
  },
  {
    id: "taylor",
    title: "Taylor Series",
    category: "Math",
    latex: String.raw`f(x)=\sum_{n=0}^{N}\frac{f^{(n)}(x_0)}{n!}(x-x_0)^n`,
    variables: [
      { symbol: "x_0", meaning: "expansion center" },
      { symbol: "N", meaning: "order" }
    ],
    assumptions: ["Function is smooth near x0"],
    validation: ["Series vs exact near x0"],
    notes: ["Local approximation; error grows away from x0."]
  },
  {
    id: "fourier-law",
    title: "Fourier Law",
    category: "Thermo",
    latex: String.raw`\vec{q} = -k \nabla T`,
    variables: [
      { symbol: "\\vec{q}", meaning: "heat flux" },
      { symbol: "k", meaning: "thermal conductivity" }
    ],
    assumptions: ["Isotropic medium"],
    validation: ["Steady conduction, slab"],
    notes: ["Links temperature gradient to heat flux."]
  },
  {
    id: "continuity",
    title: "Continuity Equation",
    category: "Fluids",
    latex: String.raw`\partial_t \rho + \nabla \cdot (\rho \vec{u}) = 0`,
    assumptions: ["Conservation of mass"],
    validation: ["Control volume mass balance"],
    notes: ["Incompressible: ∇·u = 0."]
  },
  {
    id: "poisson",
    title: "Poisson Equation",
    category: "Math",
    latex: String.raw`\nabla^2 \phi = -\rho/\epsilon_0`,
    assumptions: ["Electrostatics"],
    validation: ["Point charge potential"],
    notes: ["Governs potential with charge density."]
  },
  {
    id: "laplace",
    title: "Laplace Equation",
    category: "Math",
    latex: String.raw`\nabla^2 \phi = 0`,
    assumptions: ["Source-free region"],
    validation: ["Harmonic potential checks"],
    notes: ["Harmonic potential field."]
  },
  {
    id: "diffusion",
    title: "Diffusion Equation",
    category: "Waves",
    latex: String.raw`\partial_t u = D \nabla^2 u`,
    variables: [{ symbol: "D", meaning: "diffusivity" }],
    assumptions: ["Constant diffusivity"],
    validation: ["Gaussian spreading"],
    notes: ["Parabolic PDE for transport."]
  },
  {
    id: "advection",
    title: "Advection Equation",
    category: "Waves",
    latex: String.raw`\partial_t u + \vec{v}\cdot \nabla u = 0`,
    assumptions: ["Constant velocity field"],
    validation: ["Characteristic lines"],
    notes: ["Hyperbolic PDE; CFL-limited."]
  },
  {
    id: "ampere",
    title: "Ampere-Maxwell Law",
    category: "Electromagnetism",
    latex: String.raw`\nabla \times \vec{B} = \mu_0 \vec{J} + \mu_0 \epsilon_0 \partial_t \vec{E}`,
    assumptions: ["Maxwell equations"],
    validation: ["Quasi-static limit"],
    notes: ["Connects magnetic curl to currents and displacement."]
  },
  {
    id: "faraday",
    title: "Faraday Law",
    category: "Electromagnetism",
    latex: String.raw`\nabla \times \vec{E} = -\partial_t \vec{B}`,
    assumptions: ["Time-varying magnetic fields"],
    validation: ["Induction loop test"],
    notes: ["Induced electric fields."]
  },
  {
    id: "rl",
    title: "RL Transient",
    category: "Circuits",
    latex: String.raw`i(t)=\frac{V}{R}\left(1-e^{-tR/L}\right)`,
    assumptions: ["Step input", "Series circuit"],
    validation: ["tau = L/R"],
    notes: ["Time constant tau = L/R."]
  },
  {
    id: "schrodinger",
    title: "Schrodinger Equation",
    category: "Math",
    latex: String.raw`i\hbar \partial_t \psi = -\frac{\hbar^2}{2m}\nabla^2 \psi + V\psi`,
    assumptions: ["Nonrelativistic"],
    validation: ["Particle-in-box spectra"],
    notes: ["Foundation for quantum dynamics."]
  }
];

const categories = Array.from(new Set(FORMULAS.map((f) => f.category)));

export function FormulaLibrarySim() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(FORMULAS[0]?.id ?? "navier-stokes");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [copied, setCopied] = useState(false);

  const categoryLabels = useMemo(
    () => ({
      Fluids: t("formulaCategoryFluids"),
      Thermo: t("formulaCategoryThermo"),
      Mechanics: t("formulaCategoryMechanics"),
      Waves: t("formulaCategoryWaves"),
      Electromagnetism: t("formulaCategoryElectromagnetism"),
      Circuits: t("formulaCategoryCircuits"),
      Chaos: t("formulaCategoryChaos"),
      Math: t("formulaCategoryMath")
    }),
    [t]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FORMULAS.filter((formula) => {
      if (activeCategory !== "all" && formula.category !== activeCategory) return false;
      if (!q) return true;
      return (
        formula.title.toLowerCase().includes(q) ||
        formula.id.toLowerCase().includes(q) ||
        formula.assumptions.join(" ").toLowerCase().includes(q) ||
        formula.latex.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const current = useMemo(() => FORMULAS.find((f) => f.id === selected) ?? filtered[0], [selected, filtered]);
  const copyLatex = async () => {
    if (!current?.latex || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(current.latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("formulaLibraryTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("formulaLibrarySearch")}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("formulaLibrarySearchPlaceholder")} />
        </label>
        <label className="field">
          <span>{t("formulaLibraryCategory")}</span>
          <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)}>
            <option value="all">{t("formulaLibraryAllCategories")}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{categoryLabels[cat as keyof typeof categoryLabels] ?? cat}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("formulaLibraryFormula")}</span>
          <select value={current?.id ?? ""} onChange={(event) => setSelected(event.target.value)}>
            {filtered.map((formula) => (
              <option key={formula.id} value={formula.id}>
                {formula.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {current ? (
        <>
          <MathBlock latex={current.latex} />
          <div className="inline-kv" style={{ marginTop: "8px" }}>
            <button type="button" className="control-chip" onClick={copyLatex}>
              {copied ? t("formulaLibraryCopied") : t("formulaLibraryCopyLatex")}
            </button>
          </div>
          <div className="demo-output">
            <div className="inline-kv">
              <span className="pill">{t("formulaLibraryCategoryLabel")} {categoryLabels[current.category as keyof typeof categoryLabels] ?? current.category}</span>
              {current.notes?.length ? <span className="pill">{t("formulaLibraryNotesLabel")} {current.notes.join(" ")}</span> : null}
            </div>
            {current.variables?.length ? (
              <div className="math-vars">
                <div className="math-vars-title">{t("formulaLibraryVariables")}</div>
                <div className="math-vars-grid">
                  {current.variables.map((variable) => (
                    <div key={variable.symbol} className="math-var">
                      <MathBlock latex={variable.symbol} block={false} />
                      <span>{variable.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="inline-kv">
              {current.assumptions.map((assumption) => (
                <span key={assumption} className="pill">{assumption}</span>
              ))}
            </div>
            {current.domain ? (
              <div className="demo-note">
                <strong>{t("formulaLibraryDomain")}</strong> {current.domain}
              </div>
            ) : null}
            {current.validation?.length ? (
              <div className="demo-note">
                <strong>{t("formulaLibraryValidation")}</strong> {current.validation.join(" • ")}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="demo-note">{t("formulaLibraryEmpty")}</div>
      )}
    </div>
  );
}
