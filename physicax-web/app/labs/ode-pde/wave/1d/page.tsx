import { WaveEquationSim } from '../../../../components/WaveEquationSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Wave Equation (1D)</h2>
        <p>Traveling wave equation solutions.</p>
      </section>
      <section className="section reveal">
        <WaveEquationSim />
      </section>
    </>
  );
}

