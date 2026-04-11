import { ChaosExtrasSim } from "../../../components/ChaosExtrasSim";
import { ChaosSweepSim } from "../../../components/ChaosSweepSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Chaos Diagnostics</h2>
        <p>Basins of attraction, recurrence plots, and parameter sweeps.</p>
      </section>
      <section className="section reveal">
        <ChaosExtrasSim />
      </section>
      <section className="section reveal">
        <ChaosSweepSim />
      </section>
    </>
  );
}
