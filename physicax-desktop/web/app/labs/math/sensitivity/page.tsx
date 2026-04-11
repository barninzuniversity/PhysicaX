import { SensitivitySim } from "../../../components/SensitivitySim";
import { LocaleText } from "../../../components/LocaleText";

export default function MathSensitivityPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathSensitivityPageTitle" fallback="Sensitivity Analysis" /></h2>
        <p>
          <LocaleText
            id="mathSensitivityPageIntro"
            fallback="Compute partial derivatives and normalized sensitivities."
          />
        </p>
      </section>
      <SensitivitySim />
    </>
  );
}
