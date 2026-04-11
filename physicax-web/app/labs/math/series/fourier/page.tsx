import { FourierSeriesSim } from "../../../../components/FourierSeriesSim";
import { LocaleText } from "../../../../components/LocaleText";

export default function FourierSeriesPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathSeriesFourierPageTitle" fallback="Fourier Series Builder" /></h2>
        <p>
          <LocaleText
            id="mathSeriesFourierPageIntro"
            fallback="Reconstruct discontinuous waveforms and inspect spectral convergence."
          />
        </p>
      </section>
      <FourierSeriesSim />
    </>
  );
}
