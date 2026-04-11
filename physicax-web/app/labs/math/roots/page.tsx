import { RootFinderSim } from "../../../components/RootFinderSim";
import { LocaleText } from "../../../components/LocaleText";

export default function RootFinderPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="rootFinderPageTitle" fallback="Root Finder" /></h2>
        <p>
          <LocaleText
            id="rootFinderPageIntro"
            fallback="Bisection, secant, and Newton methods with iteration diagnostics."
          />
        </p>
      </section>
      <RootFinderSim />
    </>
  );
}
