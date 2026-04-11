import { WaveSuperpositionSim } from '../../../../components/WaveSuperpositionSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Wave Superposition</h2>
        <p>Traveling waves and standing patterns.</p>
      </section>
      <section className="section reveal">
        <WaveSuperpositionSim />
      </section>
    </>
  );
}

