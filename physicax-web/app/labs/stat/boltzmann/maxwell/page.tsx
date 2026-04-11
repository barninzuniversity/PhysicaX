import { MaxwellBoltzmannSim } from '../../../../components/MaxwellBoltzmannSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Maxwell-Boltzmann</h2>
        <p>Speed distribution vs temperature.</p>
      </section>
      <section className="section reveal">
        <MaxwellBoltzmannSim />
      </section>
    </>
  );
}

