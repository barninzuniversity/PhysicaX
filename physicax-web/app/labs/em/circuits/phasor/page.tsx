import { CircuitPhasorSim } from "../../../../components/CircuitPhasorSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Phasor + Bode Analysis</h2>
        <p>Explore impedance, phase lag, and frequency response for a series RLC circuit.</p>
      </section>
      <section className="section reveal">
        <CircuitPhasorSim />
      </section>
    </>
  );
}
