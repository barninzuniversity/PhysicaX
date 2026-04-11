import { DerivedUnitsSim } from "../../../../components/DerivedUnitsSim";
import { LocaleText } from "../../../../components/LocaleText";

export default function DerivedUnitsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathUnitsDerivedPageTitle" fallback="Derived Units" /></h2>
        <p>
          <LocaleText
            id="mathUnitsDerivedPageIntro"
            fallback="Identify derived SI units and validate custom expressions."
          />
        </p>
      </section>
      <DerivedUnitsSim />
    </>
  );
}
