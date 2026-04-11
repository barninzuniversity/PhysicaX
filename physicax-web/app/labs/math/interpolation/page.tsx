import { InterpolationSim } from "../../../components/InterpolationSim";
import { LocaleText } from "../../../components/LocaleText";

export default function InterpolationPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="interpPageTitle" fallback="Interpolation Lab" /></h2>
        <p>
          <LocaleText
            id="interpPageIntro"
            fallback="Sample data, interpolate with Lagrange polynomials, and compare with a target function."
          />
        </p>
      </section>
      <InterpolationSim />
    </>
  );
}
