import { MonteCarloPiSim } from '../../../../components/MonteCarloPiSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Monte Carlo Pi</h2>
        <p>Random sampling to estimate π.</p>
      </section>
      <section className="section reveal">
        <MonteCarloPiSim />
      </section>
    </>
  );
}

