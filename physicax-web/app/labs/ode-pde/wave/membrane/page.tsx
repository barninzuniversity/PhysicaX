import { MembraneModeSim } from "../../../../components/MembraneModeSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Membrane Modes</h2>
        <p>2D membrane normal modes with adjustable m, n, and phase.</p>
      </section>
      <section className="section reveal">
        <MembraneModeSim />
      </section>
    </>
  );
}
