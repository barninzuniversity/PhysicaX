import { RLTransientSim } from "../../../../components/RLTransientSim";
import { EquationWorkbench } from "../../../../components/EquationWorkbench";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>RL Transient</h2>
        <p>Inductor current growth and voltage decay.</p>
      </section>
      <section className="section reveal">
        <RLTransientSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="RL current workbench"
          equation="(V - R*y)/L"
          paramDefaults={{ L: 0.5, R: 50, V: 5 }}
          mode="first"
          y0={0}
          v0={0}
          yLabel="i"
          equationSummary="The state here is current i, which keeps the inductor's opposition to change readable in one place."
          equationRole="The editable expression returns i' from source voltage V, resistance R, inductance L, and the current state y."
          parameterDetails={[
            { key: "L", label: "Inductance", unit: "H", description: "Controls how strongly the circuit resists rapid current changes." },
            { key: "R", label: "Resistance", unit: "ohm", description: "Sets the rate at which the current approaches its steady value." },
            { key: "V", label: "Source voltage", unit: "V", description: "The forcing term that drives the transient." }
          ]}
          assumptions={[
            "The state y is current in amperes.",
            "This is a linear first-order transient with ideal components."
          ]}
          validationHints={[
            "Keep dt comfortably below the time constant L/R when comparing slope changes.",
            "Use the simulator above to connect the current trace to the inductor voltage story."
          ]}
          escalationHint="Use this lane to explain the current buildup clearly, then compare against the RL simulator or move into CAS for analytic forms."
        />
      </section>
    </>
  );
}
