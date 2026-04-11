import { SolverStepDemo } from "../../../../components/SolverStepDemo";
import { LocaleText } from "../../../../components/LocaleText";

export default function TimestepStabilityPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathStabilityTimestepPageTitle" fallback="Timestep Accuracy" /></h2>
        <p>
          <LocaleText
            id="mathStabilityTimestepPageIntro"
            fallback="Compare step size effects and local truncation error behavior."
          />
        </p>
      </section>
      <SolverStepDemo />
    </>
  );
}
