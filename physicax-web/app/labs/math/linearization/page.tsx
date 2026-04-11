import { LinearizationSim } from "../../../components/LinearizationSim";
import { LocaleText } from "../../../components/LocaleText";

export default function MathLinearizationPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathLinearizationPageTitle" fallback="Local Linearization + Jacobian" /></h2>
        <p>
          <LocaleText
            id="mathLinearizationPageIntro"
            fallback="Find equilibria, compute Jacobians, and classify stability."
          />
        </p>
      </section>
      <LinearizationSim />
    </>
  );
}
