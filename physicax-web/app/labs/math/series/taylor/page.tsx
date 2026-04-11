import { TaylorSeriesSim } from "../../../../components/TaylorSeriesSim";
import { LocaleText } from "../../../../components/LocaleText";

export default function TaylorSeriesPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathSeriesTaylorPageTitle" fallback="Taylor Series Explorer" /></h2>
        <p>
          <LocaleText
            id="mathSeriesTaylorPageIntro"
            fallback="Compare local polynomial approximations with exact functions."
          />
        </p>
      </section>
      <TaylorSeriesSim />
    </>
  );
}
