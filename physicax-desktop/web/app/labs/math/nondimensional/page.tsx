import { NondimensionalSim } from "../../../components/NondimensionalSim";
import { LocaleText } from "../../../components/LocaleText";

export default function MathNondimensionalPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathNondimensionalPageTitle" fallback="Nondimensionalization" /></h2>
        <p>
          <LocaleText
            id="mathNondimensionalPageIntro"
            fallback="Define characteristic scales and compute dimensionless variables."
          />
        </p>
      </section>
      <NondimensionalSim />
    </>
  );
}
