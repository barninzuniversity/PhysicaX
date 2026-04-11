import { StabilityDemo } from '../../../../components/StabilityDemo';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Stability Analysis</h2>
        <p>Step-size stability visualization.</p>
      </section>
      <section className="section reveal">
        <StabilityDemo />
      </section>
    </>
  );
}

