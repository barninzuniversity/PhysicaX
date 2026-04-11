import { MultiplicitySim } from '../../../components/MultiplicitySim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Multiplicity</h2>
        <p>Microstate counts and entropy intuition.</p>
      </section>
      <section className="section reveal">
        <MultiplicitySim />
      </section>
    </>
  );
}

