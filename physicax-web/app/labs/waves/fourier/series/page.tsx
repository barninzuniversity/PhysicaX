import { FourierSeriesSim } from '../../../../components/FourierSeriesSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Fourier Series Builder</h2>
        <p>Construct waveforms from harmonics.</p>
      </section>
      <section className="section reveal">
        <FourierSeriesSim />
      </section>
    </>
  );
}

