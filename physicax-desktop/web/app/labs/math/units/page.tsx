import { UnitConsistencySim } from "../../../components/UnitConsistencySim";
import { LocaleText } from "../../../components/LocaleText";

export default function MathUnitsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathUnitsPageTitle" fallback="Unit Consistency" /></h2>
        <p>
          <LocaleText
            id="mathUnitsPageIntro"
            fallback="Check dimensional consistency and validate custom expressions."
          />
        </p>
      </section>
      <UnitConsistencySim />
      <section className="section reveal">
        <p>
          <LocaleText id="mathUnitsDerivedHint" fallback="Looking for derived-unit matching?" />{" "}
          <a href="/labs/math/units/derived"><LocaleText id="mathUnitsDerivedLink" fallback="Open derived units" /></a>
        </p>
      </section>
    </>
  );
}
