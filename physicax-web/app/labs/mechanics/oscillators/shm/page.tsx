import { SHMSim } from "../../../../components/SHMSim";
import { EquationWorkbench } from "../../../../components/EquationWorkbench";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Simple Harmonic Motion</h2>
        <p>SHM with analytic vs numeric comparison.</p>
      </section>
      <section className="section reveal">
        <SHMSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="SHM reasoning workbench"
          equation="-(k/m)*y - c*v"
          paramDefaults={{ m: 1, c: 0.1, k: 4 }}
          y0={1}
          v0={0}
          equationSummary="Use this lane to make the damped oscillator explicit before comparing it with the dedicated simulator."
          equationRole="The editable expression returns acceleration y'' from displacement y, velocity v, and the spring-damper parameters."
          parameterDetails={[
            { key: "m", label: "Mass", unit: "kg", description: "Inertia term controlling how strongly the state resists acceleration." },
            { key: "c", label: "Damping", unit: "N*s/m", description: "Linear dissipation that removes energy and shortens the visible ringing." },
            { key: "k", label: "Stiffness", unit: "N/m", description: "Restoring force coefficient that sets the natural timescale." }
          ]}
          assumptions={[
            "This is a single-degree-of-freedom linear oscillator.",
            "The damper is linear and the spring law is proportional to displacement."
          ]}
          validationHints={[
            "Reduce dt before comparing period changes due to subtle damping updates.",
            "Cross-check the trace against the simulator above before presenting the result as a physical claim."
          ]}
          escalationHint="Once the damping story is clear here, compare the phase and energy behavior in the live simulator or move into the math workbench for broader parameter sweeps."
        />
      </section>
    </>
  );
}
