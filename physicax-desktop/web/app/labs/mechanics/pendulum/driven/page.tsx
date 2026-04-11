import { DrivenPendulumChaosSim } from "../../../../components/DrivenPendulumChaosSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Driven Pendulum</h2>
        <p>Nonlinear driven pendulum with Poincare section.</p>
      </section>
      <section className="section reveal">
        <DrivenPendulumChaosSim />
      </section>
    </>
  );
}
