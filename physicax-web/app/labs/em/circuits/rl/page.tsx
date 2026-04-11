import { RLTransientSim } from '../../../../components/RLTransientSim';
import { EquationWorkbench } from '../../../../components/EquationWorkbench';

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
          title="Custom Equation Playground"
          equation="(V - R*y)/L"
          paramDefaults={{ L: 0.5, R: 50, V: 5 }}
          mode="first"
          y0={0}
          v0={0}
          yLabel="i"
        />
      </section>
    </>
  );
}


