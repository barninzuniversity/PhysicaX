import { ODESystemExplorerSim } from "../../../../components/ODESystemExplorerSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Linear System Explorer</h2>
        <p>Explore stability via eigenvalues and phase portraits.</p>
      </section>
      <section className="section reveal">
        <ODESystemExplorerSim />
      </section>
    </>
  );
}
