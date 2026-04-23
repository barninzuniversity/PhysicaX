import Link from "next/link";
import { FeatureChecklist } from "../../components/FeatureChecklist";
import { MathBlock } from "../../components/MathBlock";

const studioSignals = [
  {
    value: "MATLAB-style",
    label: "workflow",
    note: "One place for symbolic math, graphing, matrices, ODEs, and physics-ready diagnostics."
  },
  {
    value: "18+",
    label: "math labs",
    note: "From graphing and CAS to stability, scaling, units, fitting, and sensitivity."
  },
  {
    value: "Local-first",
    label: "runtime",
    note: "Runs inside the same PhysicaX workspace, so the math layer stays close to the physics layer."
  },
  {
    value: "Physics-ready",
    label: "reasoning",
    note: "Units, assumptions, nondimensionalization, and derivation notes are part of the workflow."
  }
];

const studioRoutes = [
  {
    tag: "Console",
    title: "Computer algebra that feels like a real command window",
    body: "Simplify, solve, differentiate, integrate, expand, factor, convert units, and work with matrices without leaving the app.",
    href: "/labs/math/cas",
    action: "Open CAS workspace"
  },
  {
    tag: "Plots",
    title: "A graphing canvas for functions, geometry, and intuition",
    body: "Move between equations and visual output quickly, which is the part users remember when they decide a tool is worth returning to.",
    href: "/labs/math/graphing",
    action: "Open graphing studio"
  },
  {
    tag: "ODEs",
    title: "An equation workbench that behaves like a lightweight live script",
    body: "Tune parameters, compare trajectories, and inspect numerical behavior with diagnostics already attached.",
    href: "/labs/math/workbench",
    action: "Open equation workbench"
  },
  {
    tag: "Modeling",
    title: "A formula and scaling layer that keeps the science honest",
    body: "Use units, nondimensionalization, sensitivity, and approximation tools so the workflow feels trustworthy instead of flashy.",
    href: "/labs/math/scaling/explorer",
    action: "Open scaling explorer"
  }
];

const workflowSteps = [
  {
    title: "Start in the command window",
    body: "Define the expression, matrix, or ODE first so the problem statement is explicit before the visuals take over."
  },
  {
    title: "Move into a visual surface",
    body: "Plot the result, inspect trajectories, or compare approximations so the symbolic result becomes intuitive instead of abstract."
  },
  {
    title: "Pressure-test the model",
    body: "Use units, scaling, assumptions, and sensitivity tools to see whether the result still holds once the physics constraints are visible."
  },
  {
    title: "Escalate into the rest of PhysicaX",
    body: "Hand the cleaned-up model into labs, desktop workflows, or CFD when the question needs stronger runtime control or higher fidelity."
  }
];

const popularLanes = [
  {
    title: "Symbolic + matrix lane",
    body: "CAS, symbolic assumptions, determinants, eigen-analysis, row reduction, and reusable results.",
    links: [
      { href: "/labs/math/cas", label: "CAS" },
      { href: "/labs/math/symbolic", label: "Symbolic tools" },
      { href: "/labs/math/linear-algebra", label: "Linear algebra" }
    ]
  },
  {
    title: "Graph + explain lane",
    body: "Graphing, calculus, interpolation, differentiation, and fitting when you need the idea to become visual fast.",
    links: [
      { href: "/labs/math/graphing", label: "Graphing" },
      { href: "/labs/math/calculus", label: "Calculus" },
      { href: "/labs/math/fitting", label: "Curve fitting" }
    ]
  },
  {
    title: "Model + validate lane",
    body: "Workbench, approximations, roots, optimization, and timestep diagnostics for people building actual numerical stories.",
    links: [
      { href: "/labs/math/workbench", label: "Workbench" },
      { href: "/labs/math/optimization", label: "Optimization" },
      { href: "/labs/math/roots", label: "Root finder" }
    ]
  },
  {
    title: "Physics-ready lane",
    body: "Scaling, units, nondimensionalization, regimes, and sensitivity when the math has to survive physical interpretation.",
    links: [
      { href: "/labs/math/units", label: "Units" },
      { href: "/labs/math/nondimensional", label: "Nondimensionalization" },
      { href: "/labs/math/sensitivity", label: "Sensitivity" }
    ]
  }
];

const adoptionReasons = [
  {
    title: "Looks serious on first contact",
    body: "The math layer now reads like a product surface, not a list of disconnected demos."
  },
  {
    title: "Rewards deeper use",
    body: "Users can start with plots and keep going into symbolic work, scaling, and model diagnostics without changing tools."
  },
  {
    title: "Makes the rest of PhysicaX stronger",
    body: "A better math studio lifts the value of mechanics, thermo, waves, research pages, and CFD because the reasoning layer is easier to trust."
  }
];

const studioDeskCards = [
  {
    eyebrow: "Live script lane",
    title: "Move from symbolic intent into visual evidence without losing the thread.",
    body: "Start with the command window, keep the current expression in view, and switch into graphing or workbench surfaces only when the next step is obvious.",
    code: "fx> f(x) = exp(-0.2*x) * sin(3*x)",
    tags: ["CAS", "Plots", "Notes"]
  },
  {
    eyebrow: "Model health",
    title: "Keep units, scaling, and sensitivity close enough to trust the result.",
    body: "The point of the Math Studio is not just faster calculation. It is to make a result easier to defend before it leaves the math layer.",
    code: "units -> nondimensional -> validate",
    tags: ["Units", "Scaling", "Validation"]
  }
];

const teachingRecipes = [
  {
    title: "Lead with a visible question",
    body: "Start in CAS or the workbench with one governing expression, then show the graph or trajectory immediately so the audience sees why the equation matters."
  },
  {
    title: "Narrate the assumptions out loud",
    body: "Use units, scaling, and approximation tools during the demo so people learn what makes the model trustworthy instead of just watching buttons change."
  },
  {
    title: "Escalate only when the picture is clear",
    body: "Once the symbolic and visual story makes sense, move into a lab, desktop runtime, or CFD only if the concept needs stronger evidence."
  }
];

const teachingChecklist = [
  "State the governing equation, variable meanings, and what the audience should notice first.",
  "Plot or simulate the result quickly so the symbolic step becomes visual and memorable.",
  "Call out units, assumptions, scaling, or sensitivity before claiming the model is trustworthy.",
  "Escalate into a deeper lab or desktop/CFD workflow only after the classroom-sized explanation already holds together."
];

export default function MathEnginePage() {
  return (
    <>
      <section className="section reveal" id="math-studio-hero">
        <div className="hero math-studio-hero">
          <div>
            <div className="hero-kicker">Math Studio</div>
            <h1>A MATLAB-inspired scientific computing surface built directly into PhysicaX.</h1>
            <p className="hero-lede">
              Use symbolic algebra, graphing, matrices, ODE workbenches, scaling tools, and physics-aware checks in
              one place. The goal is not just to calculate faster, but to make the mathematical story cleaner, more
              visual, and easier to trust.
            </p>
            <div className="hero-badges">
              <span>Command window mindset</span>
              <span>Symbolic + numeric flow</span>
              <span>Matrix + ODE tooling</span>
              <span>Physics-ready assumptions</span>
            </div>
            <div className="hero-actions">
              <Link className="control-button" href="/labs/math/cas">
                Open Math Studio
              </Link>
              <Link className="control-button secondary" href="/labs/math/graphing">
                Launch graphing canvas
              </Link>
              <Link className="control-chip" href="/labs/math/workbench">
                Equation workbench
              </Link>
              <Link className="control-chip" href="/labs/math/linear-algebra">
                Matrix tools
              </Link>
            </div>
            <div className="hero-signal-grid">
              {studioSignals.map((item) => (
                <div className="signal-card" key={item.label}>
                  <div className="signal-value">{item.value}</div>
                  <div className="signal-label">{item.label}</div>
                  <div className="signal-note">{item.note}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-panel math-studio-panel">
            <div className="math-console">
              <div className="math-console-bar">
                <span className="math-console-dot" />
                <span className="math-console-dot" />
                <span className="math-console-dot" />
                <span className="math-console-title">Math Studio / Command Window</span>
              </div>
              <div className="math-console-body">
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>syms x; simplify(sin(x)^2 + cos(x)^2)</span>
                </div>
                <div className="math-console-line math-console-output">ans = 1</div>
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>solve(x^3 - 2*x - 5 == 0, x)</span>
                </div>
                <div className="math-console-line math-console-output">x ~= 2.09455</div>
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>ode: y&quot;&quot; = -k*y - c*v</span>
                </div>
                <div className="math-console-line math-console-comment">
                  response: plot displacement, velocity, and inferred period
                </div>
              </div>
            </div>
            <div className="panel-card math-studio-formula">
              <div className="status-label">Physics-ready context</div>
              <MathBlock latex={String.raw`\nabla \cdot \vec{u}=0,\qquad \mathrm{Re}=\frac{\rho U L}{\mu},\qquad y''+c y'+k y=0`} />
              <p>
                The math layer is strongest when it stays connected to assumptions, dimensions, and governing
                equations. That is the difference between a flashy calculator and a modeling tool people keep.
              </p>
            </div>
            <div className="math-studio-desk">
              {studioDeskCards.map((card) => (
                <div className="math-desk-card" key={card.title}>
                  <div className="status-label">{card.eyebrow}</div>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <div className="math-desk-code">{card.code}</div>
                  <div className="math-desk-tags" aria-label={`${card.eyebrow} tags`}>
                    {card.tags.map((tag) => (
                      <span className="math-desk-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal" id="math-studio-surfaces">
        <div className="section-header">
          <p className="section-kicker">Core studio surfaces</p>
          <h2>The math section now behaves like a product, not a directory.</h2>
          <p className="section-lede">
            These are the places most likely to make the app feel premium to new users: a command-window style CAS, a
            polished graphing surface, a live ODE workbench, and modeling tools that keep the physics visible.
          </p>
        </div>
        <div className="spotlight-grid">
          {studioRoutes.map((item) => (
            <div className="spotlight-card" key={item.title}>
              <div className="spotlight-tag">{item.tag}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <Link className="control-chip" href={item.href}>
                {item.action}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Working style</p>
          <h2>How the Math Studio should feel</h2>
          <p className="section-lede">
            The point is to help users think like model builders: define clearly, visualize quickly, validate early,
            and only then move into heavier workflows.
          </p>
        </div>
        <div className="workflow-strip">
          {workflowSteps.map((item, index) => (
            <div className="workflow-card" key={item.title}>
              <div className="workflow-index">{String(index + 1).padStart(2, "0")}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Teaching flow</p>
          <h2>Make the math section easier to teach and demonstrate</h2>
          <p className="section-lede">
            A strong demo should feel like a guided scientific conversation: show the model, make it visual, then
            validate the assumptions before moving into a heavier workflow.
          </p>
        </div>
        <div className="card-grid">
          {teachingRecipes.map((recipe) => (
            <div className="card" key={recipe.title}>
              <h3>{recipe.title}</h3>
              <p>{recipe.body}</p>
            </div>
          ))}
        </div>
        <FeatureChecklist
          title="Teaching and Demo Checklist"
          description="Use this when you want the Math Studio to land well in a lesson, walkthrough, or product demo rather than just showing raw capability."
          items={teachingChecklist}
          storageKey="physicax-math-teaching-checklist"
        />
      </section>

      <section className="section reveal" id="math-studio-lanes">
        <div className="section-header">
          <p className="section-kicker">Popular lanes</p>
          <h2>Pick the math lane that matches the question</h2>
          <p className="section-lede">
            This keeps the section approachable for new users while still feeling deep enough for more serious work.
          </p>
        </div>
        <div className="card-grid">
          {popularLanes.map((lane) => (
            <div className="card" key={lane.title}>
              <h3>{lane.title}</h3>
              <p>{lane.body}</p>
              <div className="scenario-links">
                {lane.links.map((link) => (
                  <Link className="control-chip" href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-header">
          <p className="section-kicker">Retention logic</p>
          <h2>Why this part of the app can attract and keep users</h2>
        </div>
        <div className="card-grid">
          {adoptionReasons.map((item) => (
            <div className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
