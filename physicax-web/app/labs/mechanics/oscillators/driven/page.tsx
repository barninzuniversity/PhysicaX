import { DrivenOscillatorSim } from '../../../../components/DrivenOscillatorSim';
import { EquationWorkbench } from '../../../../components/EquationWorkbench';

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
          title="Custom Equation Playground"
          equation="-(k/m)*y - c*v + F0*sin(w*t)"
          paramDefaults={{ m: 1, c: 0.2, w: 2, k: 4, F0: 1 }}
          y0={0}
          v0={0}
        />
      </section>
    </>
  );
}


