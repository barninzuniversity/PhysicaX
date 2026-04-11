import Link from "next/link";

export default function EMCircuitsPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Circuits Studio</h2>
        <p>Select a specific circuit to explore its response and graphs.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>RC Charging</h3>
            <p><Link href="/labs/em/circuits/rc">Open RC simulator</Link></p>
          </div>
          <div className="card">
            <h3>RL Transient</h3>
            <p><Link href="/labs/em/circuits/rl">Open RL simulator</Link></p>
          </div>
          <div className="card">
            <h3>RLC Response</h3>
            <p><Link href="/labs/em/circuits/rlc">Open RLC simulator</Link></p>
          </div>
          <div className="card">
            <h3>Phasor + Bode</h3>
            <p><Link href="/labs/em/circuits/phasor">Open phasor lab</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
