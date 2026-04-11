import { CycleEfficiencySim } from "../../../../components/CycleEfficiencySim";
import { CycleBuilderSim } from "../../../../components/CycleBuilderSim";
import { CycleLibrarySim } from "../../../../components/CycleLibrarySim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Cycle Efficiency</h2>
        <p>Carnot, Otto, Diesel, Brayton, plus cycle builders and comparisons.</p>
      </section>
      <section className="section reveal">
        <CycleEfficiencySim />
      </section>
      <section className="section reveal">
        <CycleBuilderSim />
      </section>
      <section className="section reveal">
        <CycleLibrarySim />
      </section>
    </>
  );
}
