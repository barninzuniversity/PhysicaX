import { PDEExplorerSim } from "../../../components/PDEExplorerSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>PDE Explorer</h2>
        <p>Heat, wave, and advection equations with stability awareness.</p>
      </section>
      <section className="section reveal">
        <PDEExplorerSim />
      </section>
    </>
  );
}
