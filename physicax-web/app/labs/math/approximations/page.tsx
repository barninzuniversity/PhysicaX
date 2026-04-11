import { ApproximationComparatorSim } from "../../../components/ApproximationComparatorSim";
import { LocaleText } from "../../../components/LocaleText";

export default function ApproximationComparatorPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathApproxPageTitle" fallback="Approximation Comparator" /></h2>
        <p>
          <LocaleText
            id="mathApproxPageIntro"
            fallback="Compare exact models with common approximations and quantify error."
          />
        </p>
      </section>
      <ApproximationComparatorSim />
    </>
  );
}
