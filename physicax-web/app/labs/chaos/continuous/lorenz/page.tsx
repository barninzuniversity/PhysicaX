import { LorenzAttractorSim } from '../../../../components/LorenzAttractorSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Lorenz Attractor</h2>
        <p>Classic chaotic Lorenz system with 3D view.</p>
      </section>
      <section className="section reveal">
        <LorenzAttractorSim />
      </section>
    </>
  );
}

