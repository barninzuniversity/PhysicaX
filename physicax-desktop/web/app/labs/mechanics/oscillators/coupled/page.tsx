import { CoupledOscillatorsSim } from "../../../../components/CoupledOscillatorsSim";
import { EquationWorkbench } from "../../../../components/EquationWorkbench";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Coupled Oscillators</h2>
        <p>Mode beating and energy exchange.</p>
      </section>
      <section className="section reveal">
        <CoupledOscillatorsSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="Mode-intuition workbench"
          equation="-(k/m)*y - c*v"
          paramDefaults={{ m: 1, c: 0.05, k: 3 }}
          y0={1}
          v0={0}
          equationSummary="This simplified lane isolates one representative mode so you can explain beating and damping without the full coupled state vector."
          equationRole="The editable expression is a reduced single-mode proxy, not the full two-mass coupled system."
          parameterDetails={[
            { key: "m", label: "Effective mass", unit: "kg", description: "Represents the inertia of the mode you want to discuss." },
            { key: "c", label: "Mode damping", unit: "N*s/m", description: "Controls how quickly the representative mode loses energy." },
            { key: "k", label: "Effective stiffness", unit: "N/m", description: "Acts like the mode stiffness for this simplified reasoning lane." }
          ]}
          assumptions={[
            "This workbench collapses the coupled system into one readable mode.",
            "Use it to explain the idea of energy exchange, not to replace the full coupled simulator."
          ]}
          validationHints={[
            "Treat the period and extrema as mode-level intuition only.",
            "Compare the trace against the full simulator before claiming anything about true coupled dynamics."
          ]}
          escalationHint="Use the live coupled simulation above for the full exchange story, then move into the math workbench if you need a more explicit reduced-order model."
        />
      </section>
    </>
  );
}
