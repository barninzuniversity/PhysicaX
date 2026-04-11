import { DimensionlessGroupsSim } from "../../../../components/DimensionlessGroupsSim";
import { LocaleText } from "../../../../components/LocaleText";

export default function DimensionlessGroupsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathScalingGroupsPageTitle" fallback="Dimensionless Groups" /></h2>
        <p>
          <LocaleText
            id="mathScalingGroupsPageIntro"
            fallback="Compute similarity numbers with fluid presets and regime hints."
          />
        </p>
      </section>
      <DimensionlessGroupsSim />
    </>
  );
}
