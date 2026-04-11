import { DuffingOscillatorSim } from "../../../../components/DuffingOscillatorSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Duffing Oscillator</h2>
        <p>Nonlinear driven oscillator with Poincare sampling.</p>
      </section>
      <section className="section reveal">
        <DuffingOscillatorSim />
      </section>
    </>
  );
}
