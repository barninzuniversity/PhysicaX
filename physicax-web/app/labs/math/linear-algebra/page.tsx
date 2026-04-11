import { MatrixSolverSim } from "../../../components/MatrixSolverSim";
import { LocaleText } from "../../../components/LocaleText";

export default function LinearAlgebraPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathLinearAlgebraPageTitle" fallback="Linear Algebra Solver" /></h2>
        <p>
          <LocaleText
            id="mathLinearAlgebraPageIntro"
            fallback="Solve 2x2 systems, inspect determinants, and read eigenvalues."
          />
        </p>
      </section>
      <MatrixSolverSim />
    </>
  );
}
