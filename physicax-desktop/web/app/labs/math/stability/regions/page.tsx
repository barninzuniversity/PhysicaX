import { StabilityDemo } from "../../../../components/StabilityDemo";
import { StabilityRegionSim } from "../../../../components/StabilityRegionSim";
import { LocaleText } from "../../../../components/LocaleText";

export default function StabilityRegionsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathStabilityRegionsPageTitle" fallback="Stability Regions" /></h2>
        <p>
          <LocaleText
            id="mathStabilityRegionsPageIntro"
            fallback="Visualize stability regions and CFL-style constraints."
          />
        </p>
      </section>
      <StabilityRegionSim />
      <StabilityDemo />
    </>
  );
}
