import { SHMSim } from '../../../../components/SHMSim';
import { EquationWorkbench } from '../../../../components/EquationWorkbench';

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
          title="Custom Equation Playground"
          equation="-(k/m)*y - c*v"
          paramDefaults={{ m: 1, c: 0.1, k: 4 }}
          y0={1}
          v0={0}
        />
      </section>
    </>
  );
}


