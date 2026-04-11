import Link from "next/link";
import { LocaleText } from "../../../components/LocaleText";

export default function StabilityMathPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathStabilityPageTitle" fallback="Stability + Accuracy" /></h2>
        <p>
          <LocaleText
            id="mathStabilityPageIntro"
            fallback="Open a focused stability or timestep explorer."
          />
        </p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="mathStabilityTimestepCardTitle" fallback="Timestep Accuracy" /></h3>
            <p><LocaleText id="mathStabilityTimestepCardBody" fallback="Compare step size effects and local error behavior." /></p>
            <p><Link href="/labs/math/stability/timestep"><LocaleText id="mathStabilityTimestepCardLink" fallback="Open timestep explorer" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathStabilityRegionsCardTitle" fallback="Stability Regions" /></h3>
            <p><LocaleText id="mathStabilityRegionsCardBody" fallback="Visualize stability regions and CFL-style constraints." /></p>
            <p><Link href="/labs/math/stability/regions"><LocaleText id="mathStabilityRegionsCardLink" fallback="Open stability regions" /></Link></p>
          </div>
        </div>
      </section>
      <section className="section reveal">
        <p>
          <LocaleText id="mathStabilitySolverHint" fallback="Looking for the solver comparison suite?" />{" "}
          <Link href="/labs/ode-pde/solvers/compare"><LocaleText id="mathStabilitySolverLink" fallback="Open ODE solver comparison" /></Link>
        </p>
      </section>
    </>
  );
}
