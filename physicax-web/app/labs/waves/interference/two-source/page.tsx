import { InterferenceSim } from '../../../../components/InterferenceSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Two-Source Interference</h2>
        <p>Interference intensity vs path difference.</p>
      </section>
      <section className="section reveal">
        <InterferenceSim />
      </section>
    </>
  );
}

