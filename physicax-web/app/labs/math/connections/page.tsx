import { MathConnectionsSim } from "../../../components/MathConnectionsSim";
import { LocaleText } from "../../../components/LocaleText";

export default function MathConnectionsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathConnectionsPageTitle" fallback="Math Connections Mode" /></h2>
        <p>
          <LocaleText
            id="mathConnectionsPageIntro"
            fallback="Bridge discrete iteration, stability, and physical intuition with connected visuals."
          />
        </p>
      </section>
      <MathConnectionsSim />
    </>
  );
}
