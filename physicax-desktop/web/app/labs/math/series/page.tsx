import Link from "next/link";
import { LocaleText } from "../../../components/LocaleText";

export default function MathSeriesPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathSeriesPageTitle" fallback="Series + Spectral" /></h2>
        <p>
          <LocaleText
            id="mathSeriesPageIntro"
            fallback="Choose a series tool for focused exploration."
          />
        </p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="mathSeriesTaylorCardTitle" fallback="Taylor Series" /></h3>
            <p><LocaleText id="mathSeriesTaylorCardBody" fallback="Approximate functions around a point with error intuition." /></p>
            <p><Link href="/labs/math/series/taylor"><LocaleText id="mathSeriesTaylorCardLink" fallback="Open Taylor explorer" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathSeriesFourierCardTitle" fallback="Fourier Series" /></h3>
            <p><LocaleText id="mathSeriesFourierCardBody" fallback="Reconstruct waveforms and compare spectral fidelity." /></p>
            <p><Link href="/labs/math/series/fourier"><LocaleText id="mathSeriesFourierCardLink" fallback="Open Fourier builder" /></Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
