import { NBodyOrbitSim } from "../../../../components/NBodyOrbitSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>N-Body Mini-Sim</h2>
        <p>Three-body gravitational interaction with adjustable mass and speed.</p>
      </section>
      <section className="section reveal">
        <NBodyOrbitSim />
      </section>
    </>
  );
}
