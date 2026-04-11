import { BifurcationSim } from '../../../../components/BifurcationSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Bifurcation Diagram</h2>
        <p>Parameter sweep of logistic map chaos.</p>
      </section>
      <section className="section reveal">
        <BifurcationSim />
      </section>
    </>
  );
}

