import { DrivenOscillatorSim } from "../../../../components/DrivenOscillatorSim";
import { EquationWorkbench } from "../../../../components/EquationWorkbench";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Driven Oscillator</h2>
        <p>Forced resonance with phase control.</p>
      </section>
      <section className="section reveal">
        <DrivenOscillatorSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="Driven-response workbench"
          equation="-(k/m)*y - c*v + F0*sin(w*t)"
          paramDefaults={{ m: 1, c: 0.2, w: 2, k: 4, F0: 1 }}
          y0={0}
          v0={0}
          equationSummary="This is the cleanest place to separate natural dynamics from forcing strength and forcing frequency."
          equationRole="The expression returns acceleration y'' with linear restoring and damping terms plus a sinusoidal drive."
          parameterDetails={[
            { key: "m", label: "Mass", unit: "kg", description: "Sets the inertial scale of the driven response." },
            { key: "c", label: "Damping", unit: "N*s/m", description: "Controls how quickly resonance is suppressed or broadened." },
            { key: "k", label: "Stiffness", unit: "N/m", description: "Sets the natural frequency against which forcing is compared." },
            { key: "F0", label: "Drive amplitude", unit: "N/kg", description: "Scales the strength of the external forcing term in this normalized lane." },
            { key: "w", label: "Drive frequency", unit: "rad/s", description: "Use this to move the system toward or away from resonance." }
          ]}
          assumptions={[
            "The forcing is sinusoidal and the damping remains linear.",
            "This page is meant for resonance intuition before moving into heavier validation."
          ]}
          validationHints={[
            "Increase tMax when you want the transient to settle before reading the steady-state response.",
            "Use a smaller dt near resonance because coarse steps can blur phase lag and period estimates."
          ]}
          escalationHint="Use the simulator above to compare phase behavior visually, then move into the desktop runtime or CFD only if the question needs stronger runtime evidence."
        />
      </section>
    </>
  );
}
