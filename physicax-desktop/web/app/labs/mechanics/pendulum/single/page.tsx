import { PendulumSim } from "../../../../components/PendulumSim";
import { EquationWorkbench } from "../../../../components/EquationWorkbench";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Single Pendulum</h2>
        <p>Nonlinear pendulum with live motion and force vectors.</p>
      </section>
      <section className="section reveal">
        <PendulumSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="Pendulum reasoning workbench"
          equation="-(g/L)*sin(y) - c*v"
          paramDefaults={{ g: 9.81, L: 1, c: 0.05 }}
          y0={0.8}
          v0={0}
          equationSummary="This lane keeps the nonlinear restoring term visible so angle, damping, and period remain teachable."
          equationRole="The editable expression returns angular acceleration theta'' from the current angle y, angular velocity v, and the pendulum parameters."
          parameterDetails={[
            { key: "g", label: "Gravity", unit: "m/s^2", description: "Sets the gravitational restoring strength." },
            { key: "L", label: "Length", unit: "m", description: "Longer pendulums respond more slowly for the same angle range." },
            { key: "c", label: "Angular damping", unit: "1/s", description: "Represents drag or friction in a simplified linear form." }
          ]}
          assumptions={[
            "The state y is angular displacement in radians.",
            "The damping term is linear even though the restoring term is nonlinear."
          ]}
          validationHints={[
            "At larger launch angles, compare the result with the simulator above rather than relying on small-angle intuition.",
            "Use a longer tMax if you want a trustworthy period estimate under stronger damping."
          ]}
          escalationHint="Compare this trace against the animated pendulum before teaching from it, then use the math workbench if you want to prototype other nonlinear forms."
        />
      </section>
    </>
  );
}
