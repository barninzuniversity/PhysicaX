import { DerivationModeSim } from "../../../components/DerivationModeSim";
import { LocaleText } from "../../../components/LocaleText";

export default function DerivationModePage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathDerivationPageTitle" fallback="Derivation Mode" /></h2>
        <p>
          <LocaleText
            id="mathDerivationPageIntro"
            fallback="Follow the governing equations, assumptions, and approximation boundaries."
          />
        </p>
      </section>
      <DerivationModeSim />
    </>
  );
}
