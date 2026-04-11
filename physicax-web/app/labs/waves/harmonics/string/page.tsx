import { StringHarmonicsDemo } from '../../../../components/StringHarmonicsDemo';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>String Harmonics</h2>
        <p>Harmonic frequencies for strings.</p>
      </section>
      <section className="section reveal">
        <StringHarmonicsDemo />
      </section>
    </>
  );
}

