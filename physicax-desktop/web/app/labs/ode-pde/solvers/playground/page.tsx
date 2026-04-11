import { ODESolverPlaygroundSim } from "../../../../components/ODESolverPlaygroundSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Solver Playground</h2>
        <p>Compare Euler, Heun, RK4, implicit, and symplectic methods.</p>
      </section>
      <section className="section reveal">
        <ODESolverPlaygroundSim />
      </section>
    </>
  );
}
