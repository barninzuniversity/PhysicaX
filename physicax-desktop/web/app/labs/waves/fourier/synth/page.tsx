import { WaveSignalSynthSim } from "../../../../components/WaveSignalSynthSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Harmonic Synth Lab</h2>
        <p>Build signals from harmonics and listen to the synthesis.</p>
      </section>
      <section className="section reveal">
        <WaveSignalSynthSim />
      </section>
    </>
  );
}
