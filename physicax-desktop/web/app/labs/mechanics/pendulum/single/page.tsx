import { PendulumSim } from '../../../../components/PendulumSim';
import { EquationWorkbench } from '../../../../components/EquationWorkbench';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Single Pendulum</h2>
        <p>Nonlinear pendulum with live motion and force vectors.</p>
      </section>
      <section className="section reveal">
        <PendulumSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="Custom Equation Playground"
          equation="-(g/L)*sin(y) - c*v"
          paramDefaults={{ g: 9.81, L: 1, c: 0.05 }}
          y0={0.8}
          v0={0}
        />
      </section>
    </>
  );
}


