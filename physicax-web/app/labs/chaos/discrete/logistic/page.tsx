import { LogisticMapDemo } from '../../../../components/LogisticMapDemo';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Logistic Map</h2>
        <p>Discrete map iterations and convergence.</p>
      </section>
      <section className="section reveal">
        <LogisticMapDemo />
      </section>
    </>
  );
}

