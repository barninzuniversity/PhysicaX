import { NumericalDifferentiationSim } from "../../../components/NumericalDifferentiationSim";
import { LocaleText } from "../../../components/LocaleText";

export default function DifferentiationPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="diffPageTitle" fallback="Numerical Differentiation" /></h2>
        <p>
          <LocaleText
            id="diffPageIntro"
            fallback="Compare finite difference methods and quantify error versus analytic derivatives."
          />
        </p>
      </section>
      <NumericalDifferentiationSim />
    </>
  );
}
