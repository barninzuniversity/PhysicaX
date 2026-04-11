import { WaveExtrasSim } from "../../../components/WaveExtrasSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>WaveLab Advanced</h2>
        <p>Boundary reflections, pulse propagation, resonance modes, and membrane vibration.</p>
      </section>
      <section className="section reveal">
        <WaveExtrasSim />
      </section>
    </>
  );
}
