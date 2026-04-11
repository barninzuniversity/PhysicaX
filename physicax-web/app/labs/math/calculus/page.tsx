import { DerivativeIntegralSim } from "../../../components/DerivativeIntegralSim";
import { LocaleText } from "../../../components/LocaleText";

export default function CalculusToolsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="calcPageTitle" fallback="Derivative + Integral Calculator" /></h2>
        <p>
          <LocaleText
            id="calcPageIntro"
            fallback="Input any function, visualize its derivative and antiderivative, and customize colors."
          />
        </p>
      </section>
      <DerivativeIntegralSim />
    </>
  );
}
