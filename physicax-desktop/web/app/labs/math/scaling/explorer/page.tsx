import { ScalingDemo } from "../../../../components/ScalingDemo";
import { LocaleText } from "../../../../components/LocaleText";

export default function ScalingExplorerPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathScalingExplorerPageTitle" fallback="Scaling Explorer" /></h2>
        <p>
          <LocaleText
            id="mathScalingExplorerPageIntro"
            fallback="Compute characteristic scales and nondimensional time to interpret regimes."
          />
        </p>
      </section>
      <ScalingDemo />
    </>
  );
}
