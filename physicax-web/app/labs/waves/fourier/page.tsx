import Link from "next/link";

export default function FourierPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Fourier Builder</h2>
        <p>Choose a Fourier series model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Fourier Series</h3>
            <p><Link href="/labs/waves/fourier/series">Open Fourier series builder</Link></p>
          </div>
          <div className="card">
            <h3>Harmonic Synth</h3>
            <p><Link href="/labs/waves/fourier/synth">Open harmonic synth</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
