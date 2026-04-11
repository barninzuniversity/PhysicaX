import { GraphingCalculatorSim } from "../../../components/GraphingCalculatorSim";
import { LocaleText } from "../../../components/LocaleText";

export default function GraphingCalculatorPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="graphingPageTitle" fallback="Graphing Calculator" /></h2>
        <p>
          <LocaleText
            id="graphingPageIntro"
            fallback="Plot functions and use geometric tools similar to a lightweight GeoGebra workflow."
          />
        </p>
      </section>
      <GraphingCalculatorSim />
    </>
  );
}
