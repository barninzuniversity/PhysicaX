import { FormulaLibrarySim } from "../../../components/FormulaLibrarySim";
import { LocaleText } from "../../../components/LocaleText";

export default function MathFormulasPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathFormulasPageTitle" fallback="Formula Library" /></h2>
        <p>
          <LocaleText
            id="mathFormulasPageIntro"
            fallback="Canonical equations with assumptions and validity notes."
          />
        </p>
      </section>
      <FormulaLibrarySim />
    </>
  );
}
