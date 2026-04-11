import { AsymptoticRegimeSim } from "../../../components/AsymptoticRegimeSim";
import { LocaleText } from "../../../components/LocaleText";

export default function MathRegimesPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathRegimesPageTitle" fallback="Asymptotic Regimes" /></h2>
        <p>
          <LocaleText
            id="mathRegimesPageIntro"
            fallback="Explore scaling regimes using log-log slope analysis."
          />
        </p>
      </section>
      <AsymptoticRegimeSim />
    </>
  );
}
