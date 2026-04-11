import Link from "next/link";

export default function OscillatorsPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Oscillator Lab</h2>
        <p>Choose a specific oscillator to explore in detail.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Simple Harmonic Motion</h3>
            <p><Link href="/labs/mechanics/oscillators/shm">Open SHM</Link></p>
          </div>
          <div className="card">
            <h3>Coupled Oscillators</h3>
            <p><Link href="/labs/mechanics/oscillators/coupled">Open coupled oscillators</Link></p>
          </div>
          <div className="card">
            <h3>Driven Oscillator</h3>
            <p><Link href="/labs/mechanics/oscillators/driven">Open driven oscillator</Link></p>
          </div>
          <div className="card">
            <h3>Duffing Oscillator</h3>
            <p><Link href="/labs/mechanics/oscillators/duffing">Open Duffing oscillator</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
