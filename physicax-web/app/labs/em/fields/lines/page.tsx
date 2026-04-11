import { FieldLineSim } from "../../../../components/FieldLineSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Field Lines Lab</h2>
        <p>Seed and trace electric field lines for a dipole configuration.</p>
      </section>
      <section className="section reveal">
        <FieldLineSim />
      </section>
    </>
  );
}
