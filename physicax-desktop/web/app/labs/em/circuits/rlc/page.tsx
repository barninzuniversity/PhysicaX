import { RLCResponseSim } from '../../../../components/RLCResponseSim';
import { EquationWorkbench } from '../../../../components/EquationWorkbench';

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
          title="Custom Equation Playground"
          equation="(V - R*v - y/C)/L"
          paramDefaults={{ C: 0.02, L: 0.5, R: 10, V: 5 }}
          y0={0}
          v0={0}
          yLabel="q"
        />
      </section>
    </>
  );
}


