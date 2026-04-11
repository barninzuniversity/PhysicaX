import { DrivenPendulumChaosSim } from "../../../../components/DrivenPendulumChaosSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Driven Pendulum (Chaos)</h2>
        <p>Chaotic pendulum with Poincare sampling.</p>
      </section>
      <section className="section reveal">
        <DrivenPendulumChaosSim />
      </section>
    </>
  );
}
