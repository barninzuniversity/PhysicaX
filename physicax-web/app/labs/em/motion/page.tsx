import { ParticleInBFieldSim } from "../../../components/ParticleInBFieldSim";
import { MagnetismMotionExtrasSim } from "../../../components/MagnetismMotionExtrasSim";

export default function EMMotionPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Charged Particle Motion</h2>
        <p>Uniform magnetic field motion, E x B drift, and induction intuition.</p>
      </section>
      <section className="section reveal">
        <ParticleInBFieldSim />
      </section>
      <section className="section reveal">
        <MagnetismMotionExtrasSim />
      </section>
    </>
  );
}
