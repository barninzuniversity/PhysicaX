import { RCCircuitDemo } from '../../../../components/RCCircuitDemo';
import { EquationWorkbench } from '../../../../components/EquationWorkbench';

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
          title="Custom Equation Playground"
          equation="(V - y/(C))/R"
          paramDefaults={{ C: 0.000001, R: 1000, V: 5 }}
          mode="first"
          y0={0}
          v0={0}
          yLabel="q"
        />
      </section>
    </>
  );
}


