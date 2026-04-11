import { TwoLevelSystemSim } from '../../../../components/TwoLevelSystemSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Two-Level System</h2>
        <p>Boltzmann population split in a two-level system.</p>
      </section>
      <section className="section reveal">
        <TwoLevelSystemSim />
      </section>
    </>
  );
}

