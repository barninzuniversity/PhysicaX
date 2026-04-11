import { ForceEnergySuiteSim } from "../../../components/ForceEnergySuiteSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Force + Energy Systems</h2>
        <p>Inclined plane, friction work, potential wells, escape velocity, energy partition.</p>
      </section>
      <section className="section reveal">
        <ForceEnergySuiteSim />
      </section>
    </>
  );
}
