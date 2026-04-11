import { SolverStepDemo } from '../../../../components/SolverStepDemo';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Solver Step</h2>
        <p>Single-step integration diagnostics.</p>
      </section>
      <section className="section reveal">
        <SolverStepDemo />
      </section>
    </>
  );
}

