import { EntropyExpansionSim } from "../../../components/EntropyExpansionSim";
import { EntropyVisualizerSim } from "../../../components/EntropyVisualizerSim";

export default function EntropyPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Entropy Visualizer</h2>
        <p>Reversible vs irreversible heat flow, mixing entropy, and engine limits.</p>
      </section>
      <section className="section reveal">
        <EntropyExpansionSim />
      </section>
      <section className="section reveal">
        <EntropyVisualizerSim />
      </section>
    </>
  );
}
