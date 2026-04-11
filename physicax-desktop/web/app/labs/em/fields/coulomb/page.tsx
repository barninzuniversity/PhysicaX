import { CoulombFieldSim } from "../../../../components/CoulombFieldSim";

export default function CoulombPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Coulomb Field (1D)</h2>
        <p>Electric field from point charges along a line.</p>
      </section>
      <section className="section reveal">
        <CoulombFieldSim />
      </section>
    </>
  );
}
