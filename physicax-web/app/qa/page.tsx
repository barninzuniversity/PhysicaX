import { FeatureChecklist } from "../components/FeatureChecklist";

export default function QAPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Physics QA Checklist</h2>
        <p>
          This checklist is used to verify every lab before release. Each item should be validated
          with automated tests and manual spot checks.
        </p>
      </section>

      <section className="section reveal">
        <h2>ThermoLab QA</h2>
        <FeatureChecklist
          title="ThermoLab QA"
          storageKey="qa-thermo"
          items={[
            "Reject negative Kelvin temperatures.",
            "Verify ideal gas law at STP.",
            "Isothermal: DeltaU = 0 and Q = W.",
            "Adiabatic reversible: DeltaS = 0.",
            "Cycle efficiency in [0,1]."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>MechanicsLab QA</h2>
        <FeatureChecklist
          title="MechanicsLab QA"
          storageKey="qa-mechanics"
          items={[
            "Projectile without drag matches analytic range.",
            "SHO energy constant when damping = 0.",
            "Pendulum small-angle matches linear model.",
            "Double pendulum energy conserved when damping = 0."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>ChaosLab QA</h2>
        <FeatureChecklist
          title="ChaosLab QA"
          storageKey="qa-chaos"
          items={[
            "Logistic map r=2.9 converges to fixed point.",
            "Lyapunov exponent positive in chaotic regime.",
            "Lorenz trajectory remains bounded over test horizon."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>ODE/PDE QA</h2>
        <FeatureChecklist
          title="ODE/PDE QA"
          storageKey="qa-ode"
          items={[
            "Euler, Heun, RK4 converge on known ODEs.",
            "Heat equation stability enforces r <= 1/2.",
            "Wave equation stability enforces s <= 1."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>EMLab QA</h2>
        <FeatureChecklist
          title="EMLab QA"
          storageKey="qa-em"
          items={[
            "Coulomb law shows inverse square scaling.",
            "RC time constant equals R C.",
            "RLC resonance near omega0 = 1/sqrt(L C)."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>Stat Physics QA</h2>
        <FeatureChecklist
          title="Stat Physics QA"
          storageKey="qa-stat"
          items={[
            "Random walk variance grows linearly in N.",
            "Diffusion relation matches 2 D t in 1D.",
            "Boltzmann probabilities sum to 1."
          ]}
        />
      </section>
    </>
  );
}
