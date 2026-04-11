import Link from "next/link";
import { MathBlock } from "../../components/MathBlock";

export default function WaveLabPage() {
  return (
    <>
      <section className="section reveal">
        <h2>WaveLab</h2>
        <p>Traveling waves, interference, beats, harmonics, and Fourier series.</p>
      </section>

      <section className="section reveal">
        <h2>Simulation Pages</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Superposition</h3>
            <p><Link href="/labs/waves/superposition">Open superposition</Link></p>
          </div>
          <div className="card">
            <h3>Interference + Beats</h3>
            <p><Link href="/labs/waves/interference">Open interference suite</Link></p>
          </div>
          <div className="card">
            <h3>Harmonics</h3>
            <p><Link href="/labs/waves/harmonics">Open harmonics</Link></p>
          </div>
          <div className="card">
            <h3>Fourier Builder</h3>
            <p><Link href="/labs/waves/fourier">Open Fourier tools</Link></p>
          </div>
          <div className="card">
            <h3>Advanced Waves</h3>
            <p><Link href="/labs/waves/advanced">Open boundary + resonance</Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>Canonical Models</h2>
        <div className="model-grid">
          <div className="model-card">
            <h3>Traveling Wave</h3>
            <MathBlock latex={String.raw`y(x,t)=A\sin(kx-\omega t+\phi)`} />
          </div>
          <div className="model-card">
            <h3>Standing Wave</h3>
            <MathBlock latex={String.raw`y(x,t)=2A\sin(kx)\cos(\omega t)`} />
          </div>
          <div className="model-card">
            <h3>Beats</h3>
            <MathBlock latex={String.raw`f_{beat}=|f_1-f_2|`} />
          </div>
        </div>
      </section>
    </>
  );
}
