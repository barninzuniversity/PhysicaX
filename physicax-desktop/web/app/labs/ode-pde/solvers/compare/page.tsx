import { ODESolverCompareSim } from '../../../../components/ODESolverCompareSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Solver Comparison</h2>
        <p>Euler vs RK4 error behavior.</p>
      </section>
      <section className="section reveal">
        <ODESolverCompareSim />
      </section>
    </>
  );
}

