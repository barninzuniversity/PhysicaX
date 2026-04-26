import { RCCircuitDemo } from "../../../../components/RCCircuitDemo";
import { EquationWorkbench } from "../../../../components/EquationWorkbench";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>RC Charging</h2>
        <p>Capacitor charging curve and current decay.</p>
      </section>
      <section className="section reveal">
        <RCCircuitDemo />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="RC state workbench"
          equation="(V - y/(C))/R"
          paramDefaults={{ C: 0.000001, R: 1000, V: 5 }}
          mode="first"
          y0={0}
          v0={0}
          yLabel="q"
          equationSummary="The state here is capacitor charge q, which keeps the resistor-capacitor relationship readable before you translate it into voltage intuition."
          equationRole="The editable expression returns q' from the supply voltage V, resistance R, capacitance C, and current charge state y."
          parameterDetails={[
            { key: "R", label: "Resistance", unit: "ohm", description: "Controls how quickly the source can move charge onto the capacitor." },
            { key: "C", label: "Capacitance", unit: "F", description: "Sets how much charge is needed per volt across the capacitor." },
            { key: "V", label: "Source voltage", unit: "V", description: "The driving source that pushes the charging curve upward." }
          ]}
          assumptions={[
            "The state y is charge rather than capacitor voltage.",
            "Components are treated as linear and ideal in this reasoning lane."
          ]}
          validationHints={[
            "Compare the workbench trace with the RC demo above to keep the charge-vs-voltage interpretation straight.",
            "Choose dt well below the dominant time constant R*C if you want a trustworthy transient shape."
          ]}
          escalationHint="Once the charge story is clear here, compare it with the circuit demo above or move into graphing/CAS for closed-form manipulations."
        />
      </section>
    </>
  );
}
