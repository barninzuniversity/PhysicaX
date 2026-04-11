import { RandomWalkSim } from '../../../../components/RandomWalkSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Random Walk</h2>
        <p>1D random walk with distribution stats.</p>
      </section>
      <section className="section reveal">
        <RandomWalkSim />
      </section>
    </>
  );
}

