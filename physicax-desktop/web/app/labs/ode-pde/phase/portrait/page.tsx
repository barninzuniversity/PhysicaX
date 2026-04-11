import { PhasePortraitSim } from '../../../../components/PhasePortraitSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Phase Portrait</h2>
        <p>Phase portrait for nonlinear oscillators.</p>
      </section>
      <section className="section reveal">
        <PhasePortraitSim />
      </section>
    </>
  );
}

