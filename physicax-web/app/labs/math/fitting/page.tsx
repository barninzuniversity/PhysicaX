import { CurveFittingSim } from "../../../components/CurveFittingSim";
import { LocaleText } from "../../../components/LocaleText";

export default function FittingPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="fitPageTitle" fallback="Curve Fitting Lab" /></h2>
        <p>
          <LocaleText
            id="fitPageIntro"
            fallback="Fit linear, quadratic, exponential, and power models to data."
          />
        </p>
      </section>
      <CurveFittingSim />
    </>
  );
}
