import { DoublePendulumSim } from '../../../../components/DoublePendulumSim';
import { EquationWorkbench } from '../../../../components/EquationWorkbench';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Double Pendulum</h2>
        <p>Chaotic double pendulum with angle trajectories.</p>
      </section>
      <section className="section reveal">
        <DoublePendulumSim />
      </section>

      <section className="section reveal">
        <EquationWorkbench
          title="Custom Equation Playground"
          equation="-(g/L)*sin(y)"
          paramDefaults={{ g: 9.81, L: 1 }}
          y0={1.2}
          v0={0}
        />
      </section>
    </>
  );
}


