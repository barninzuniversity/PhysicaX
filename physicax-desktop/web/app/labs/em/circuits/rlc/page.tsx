import { RLCResponseSim } from "../../../../components/RLCResponseSim";
import { EquationWorkbench } from "../../../../components/EquationWorkbench";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>RLC Response</h2>
        <p>Step and driven response with resonance.</p>
      </section>
      <section className="section reveal">
        <RLCResponseSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="RLC charge workbench"
          equation="(V - R*v - y/C)/L"
          paramDefaults={{ C: 0.02, L: 0.5, R: 10, V: 5 }}
          y0={0}
          v0={0}
          yLabel="q"
          equationSummary="This lane keeps the second-order charge equation explicit so resonance, damping, and forcing stay easy to explain."
          equationRole="The editable expression returns charge acceleration q'' using charge y, current-like velocity v, and the RLC parameters."
          parameterDetails={[
            { key: "L", label: "Inductance", unit: "H", description: "Sets the inertial part of the circuit response." },
            { key: "R", label: "Resistance", unit: "ohm", description: "Damps oscillation and broadens the resonance response." },
            { key: "C", label: "Capacitance", unit: "F", description: "Provides the restoring storage term through q/C." },
            { key: "V", label: "Source voltage", unit: "V", description: "The external drive or step forcing term." }
          ]}
          assumptions={[
            "The workbench tracks charge and its derivative as the main states.",
            "Components are treated as linear and ideal."
          ]}
          validationHints={[
            "Reduce dt when you want a trustworthy resonant period or sharper transient peaks.",
            "Compare this reduced equation view with the RLC demo above before making resonance claims."
          ]}
          escalationHint="Once the second-order circuit story is readable here, compare it against the live simulator or move into graphing/CAS for analytic cross-checks."
        />
      </section>
    </>
  );
}
