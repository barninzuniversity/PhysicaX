import { RosslerAttractorSim } from '../../../../components/RosslerAttractorSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Rössler Attractor</h2>
        <p>Spiral chaos with tunable parameters.</p>
      </section>
      <section className="section reveal">
        <RosslerAttractorSim />
      </section>
    </>
  );
}

