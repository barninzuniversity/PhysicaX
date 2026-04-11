import { RandomWalk2DSim } from "../../../../components/RandomWalk2DSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Random Walk (2D)</h2>
        <p>Planar random walk with optional drift.</p>
      </section>
      <section className="section reveal">
        <RandomWalk2DSim />
      </section>
    </>
  );
}
