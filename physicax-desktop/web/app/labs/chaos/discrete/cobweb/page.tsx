import { CobwebSim } from '../../../../components/CobwebSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Cobweb Diagram</h2>
        <p>Visualize iteration geometry for maps.</p>
      </section>
      <section className="section reveal">
        <CobwebSim />
      </section>
    </>
  );
}

