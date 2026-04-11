import { ReactionDiffusionSim } from "../../../components/ReactionDiffusionSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Reaction-Diffusion Lab</h2>
        <p>Gray-Scott reaction-diffusion patterns with tunable feed/kill.</p>
      </section>
      <section className="section reveal">
        <ReactionDiffusionSim />
      </section>
    </>
  );
}
