import { ConductionSim } from '../../../../components/ConductionSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Conduction</h2>
        <p>Fourier conduction and heat flux.</p>
      </section>
      <section className="section reveal">
        <ConductionSim />
      </section>
    </>
  );
}

