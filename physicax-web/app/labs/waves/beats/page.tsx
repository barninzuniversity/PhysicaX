import { BeatEnvelopeSim } from '../../../components/BeatEnvelopeSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Beats</h2>
        <p>Beat envelope visualization.</p>
      </section>
      <section className="section reveal">
        <BeatEnvelopeSim />
      </section>
    </>
  );
}

