import { CoupledOscillatorsSim } from '../../../../components/CoupledOscillatorsSim';
import { EquationWorkbench } from '../../../../components/EquationWorkbench';

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
          title="Custom Equation Playground"
          equation="-(k/m)*y - c*v"
          paramDefaults={{ m: 1, c: 0.05, k: 3 }}
          y0={1}
          v0={0}
        />
      </section>
    </>
  );
}


