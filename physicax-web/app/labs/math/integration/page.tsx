import { IntegrationCalculatorSim } from "../../../components/IntegrationCalculatorSim";
import { LocaleText } from "../../../components/LocaleText";

export default function IntegrationPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathIntegrationPageTitle" fallback="Integration Calculator" /></h2>
        <p>
          <LocaleText
            id="mathIntegrationPageIntro"
            fallback="Evaluate definite integrals with multiple numerical schemes and inspect cumulative area."
          />
        </p>
      </section>
      <IntegrationCalculatorSim />
    </>
  );
}
