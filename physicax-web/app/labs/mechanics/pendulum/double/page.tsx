import { DoublePendulumSim } from "../../../../components/DoublePendulumSim";
import { EquationWorkbench } from "../../../../components/EquationWorkbench";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Double Pendulum</h2>
        <p>Chaotic double pendulum with angle trajectories.</p>
      </section>
      <section className="section reveal">
        <DoublePendulumSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="Double-pendulum proxy workbench"
          equation="-(g/L)*sin(y)"
          paramDefaults={{ g: 9.81, L: 1 }}
          y0={1.2}
          v0={0}
          equationSummary="This proxy is intentionally simpler than the live double-pendulum model. It gives you a readable baseline before the full chaotic behavior takes over."
          equationRole="The editable expression is a single-angle proxy used to reason about restoring torque, not a full double-pendulum state model."
          parameterDetails={[
            { key: "g", label: "Gravity", unit: "m/s^2", description: "Sets the restoring acceleration scale." },
            { key: "L", label: "Reference length", unit: "m", description: "Provides the characteristic length for the proxy angle response." }
          ]}
          assumptions={[
            "This lane is a teaching aid for the double pendulum, not a chaos-accurate replacement.",
            "Use it to explain the baseline nonlinear restoring term before discussing sensitivity."
          ]}
          validationHints={[
            "Do not treat the period estimate here as evidence about the full chaotic system.",
            "Use the simulator above to show why small model changes matter once the real double pendulum takes over."
          ]}
          escalationHint="Explain the baseline restoring model here first, then move back to the full simulator when you want to show sensitivity and divergence."
        />
      </section>
    </>
  );
}
